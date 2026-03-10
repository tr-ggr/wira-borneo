import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const EVAC_GEOJSON_PATH = join(process.cwd(), 'geojson', 'evacuation', 'ph_evacs_cleaned.geojson');
const EVAC_RAW_GEOJSON_PATH = join(process.cwd(), 'geojson', 'evacuation', 'ph_evacs_raw.geojson');
const EVAC_IMPORT_LIMIT = 500;

function polygonCentroid(ring: number[][]): [number, number] | null {
  if (!ring || ring.length === 0) return null;
  let sumLon = 0;
  let sumLat = 0;
  for (const p of ring) {
    sumLon += p[0];
    sumLat += p[1];
  }
  return [sumLon / ring.length, sumLat / ring.length];
}

function getCentroid(geom: { type: string; coordinates: number[][][] | number[][][][] }): [number, number] | null {
  const coords = geom.coordinates;
  if (!Array.isArray(coords)) return null;
  if (geom.type === 'Polygon') {
    const ring = (coords as number[][][])[0];
    return polygonCentroid(ring);
  }
  if (geom.type === 'MultiPolygon') {
    const firstPoly = (coords as number[][][][])[0];
    if (!firstPoly || !firstPoly[0]) return null;
    return polygonCentroid(firstPoly[0]);
  }
  return null;
}

type RawLookup = Map<string, { population: string | null; source: string | null }>;

function buildRawLookup(): RawLookup {
  const map: RawLookup = new Map();
  try {
    const raw = readFileSync(EVAC_RAW_GEOJSON_PATH, 'utf-8');
    const geojson = JSON.parse(raw) as { features: Array<{ properties: Record<string, unknown> }> };
    for (const f of geojson.features ?? []) {
      const props = f.properties ?? {};
      const atId = props['@id'];
      const id = atId != null
        ? String(atId).replace(/^relation\//, '').replace(/^way\//, '')
        : String(props.id ?? props.ref ?? '');
      if (!id) continue;
      let population: string | null = null;
      if (props['population:pupils:2015'] != null) population = String(props['population:pupils:2015']);
      else if (props['population:pupils:2012'] != null) population = String(props['population:pupils:2012']);
      else {
        const popKey = Object.keys(props).find((k) => k.startsWith('population'));
        if (popKey && props[popKey] != null) population = String(props[popKey]);
      }
      const source = props.source != null ? String(props.source) : null;
      map.set(id, { population, source });
    }
  } catch {
    // raw file optional
  }
  return map;
}

type EvacRow = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  region: string | null;
  type: string | null;
  capacity: string | null;
  population: string | null;
  source: string | null;
};

function loadEvacuationGeoJson(): EvacRow[] {
  try {
    const rawLookup = buildRawLookup();
    const raw = readFileSync(EVAC_GEOJSON_PATH, 'utf-8');
    const geojson = JSON.parse(raw) as {
      features: Array<{
        geometry: { type: string; coordinates: number[][][] | number[][][][] };
        properties: Record<string, unknown>;
      }>;
    };
    const out: EvacRow[] = [];
    const features = (geojson.features ?? []).slice(0, EVAC_IMPORT_LIMIT);
    for (const f of features) {
      const geom = f.geometry;
      const props = f.properties ?? {};
      if (!geom || !Array.isArray(geom.coordinates)) continue;
      const centroid = getCentroid(geom);
      if (!centroid) continue;
      const [longitude, latitude] = centroid;
      const id = String(props.id ?? '');
      const name = String(props.name ?? 'Evacuation site').trim() || 'Evacuation site';
      const region = props.province != null ? String(props.province) : null;
      const parts = [props.place, props.city, props.municipality].filter(Boolean).map(String);
      const address = parts.length > 0 ? parts.join(', ') : null;
      const type = props.type != null ? String(props.type) : null;
      const capacity = props.capacity != null ? String(props.capacity) : null;
      const rawData = rawLookup.get(id);
      const population = rawData?.population ?? null;
      const source = rawData?.source ?? null;
      out.push({
        id: `evac-ph-${id}`,
        name,
        latitude,
        longitude,
        address,
        region,
        type,
        capacity,
        population,
        source,
      });
    }
    return out;
  } catch {
    return [];
  }
}

// Prefer direct connection for seed (required for Supabase; pooler can cause issues)
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL or DIRECT_URL is not set');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seed starting...');

  // 1. Clear existing data (optional, but good for clean seeds)
  // Note: Order matters for deletion due to foreign keys
  console.log('Clearing existing seed data...');
  await prisma.helpRequestEvent.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.helpAssignment.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.helpRequest.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.volunteerDecisionLog.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.volunteerApplication.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.volunteerProfile.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.warningEventLog.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.warningEventEvacuationArea.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.evacuationRouteSuggestion.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.warningTargetArea.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.warningEvent.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.familyMember.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.family.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.userLocationSnapshot.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.mapPinStatus.deleteMany({
    where: { id: { startsWith: 'seed-' } },
  });
  await prisma.evacuationArea.deleteMany({
    where: { id: { startsWith: 'seed-' } },
  });
  await prisma.riskRegionSnapshot.deleteMany({
    where: { id: { startsWith: 'seed-' } },
  });
  await prisma.account.deleteMany({
    where: { userId: { startsWith: 'seed-user-' } },
  });
  await prisma.user.deleteMany({ where: { id: { startsWith: 'seed-user-' } } });

  // Clear tracker data
  await prisma.trackerShipment.deleteMany({
    where: { id: { startsWith: 'seed-tracker-' } },
  });
  await prisma.trackerStats.deleteMany({
    where: { id: { startsWith: 'seed-tracker-' } },
  });
  await prisma.trackerReliefZone.deleteMany({
    where: { id: { startsWith: 'seed-tracker-' } },
  });
  await prisma.trackerValidator.deleteMany({
    where: { id: { startsWith: 'seed-tracker-' } },
  });

  await prisma.mapPinStatus.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.evacuationArea.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.riskRegionSnapshot.deleteMany({ where: { id: { startsWith: 'seed-' } } });
  await prisma.account.deleteMany({ where: { userId: { startsWith: 'seed-user-' } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: 'seed-user-' } } });

  const saltRounds = 10;
  const commonPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(commonPassword, saltRounds);

  // 2. Seed Users
  console.log('Seeding users...');

  
  // Admin User
  await prisma.user.upsert({
    where: { email: 'admin@wira-borneo.com' },
    update: {},
    create: {
      id: 'seed-user-admin',
      name: 'System Administrator',
      email: 'admin@wira-borneo.com',
      role: 'admin',
      emailVerified: true,
      accounts: {
        create: {
          id: 'seed-acc-admin',
          accountId: 'seed-acc-admin',
          providerId: 'credential',
          password: hashedPassword,
        },
      },
    },
  });

  // 3 regular users
  const users = [
    { id: 'seed-user-1', name: 'User One', email: 'user1@example.com' },
    { id: 'seed-user-2', name: 'User Two', email: 'user2@example.com' },
    { id: 'seed-user-3', name: 'User Three', email: 'user3@example.com' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: 'user',
        emailVerified: true,
        accounts: {
          create: {
            id: `acc-${u.id}`,
            accountId: `acc-${u.id}`,
            providerId: 'credential',
            password: hashedPassword,
          },
        },
      },
    });
  }

  // Specific test user for demographics
  console.log('Seeding demographic test user...');
  await prisma.user.upsert({
    where: { id: '1aM6xRLAxxV1D6DfrfLuYaf6ovInp7ui' },
    update: {
      age: 65,
      housingType: 'LONGHOUSE',
      personalInfo: {
        languages: ['Malay', 'Iban'],
      },
      vulnerabilities: {
        disabilities: ['Wheelchair user', 'Partially sighted'],
        assistive_devices: ['Wheelchair', 'Hearing aid'],
      },
      householdComposition: {
        infants: 2,
        elderly: 2,
        pwd: 1,
        pregnant: 1,
      },
      emergencySkills: ['First Aid (Red Cross certified)', 'Swimming'],
      assets: ['Portable Generator', 'Small Motorized Boat'],
    },
    create: {
      id: '1aM6xRLAxxV1D6DfrfLuYaf6ovInp7ui',
      name: 'Demographic Test User',
      email: 'demo-test@wira-borneo.com',
      role: 'user',
      emailVerified: true,
      age: 65,
      housingType: 'LONGHOUSE',
      personalInfo: {
        languages: ['Malay', 'Iban'],
      },
      vulnerabilities: {
        disabilities: ['Wheelchair user', 'Partially sighted'],
        assistive_devices: ['Wheelchair', 'Hearing aid'],
      },
      householdComposition: {
        infants: 2,
        elderly: 2,
        pwd: 1,
        pregnant: 1,
      },
      emergencySkills: ['First Aid (Red Cross certified)', 'Swimming'],
      assets: ['Portable Generator', 'Small Motorized Boat'],
      accounts: {
        create: {
          id: 'acc-demo-test',
          accountId: 'demo-test',
          providerId: 'credential',
          password: hashedPassword,
        },
      },
    },
  });

  // 3. Seed Families
  console.log('Seeding families...');
  await prisma.family.upsert({
    where: { id: 'seed-family-1' },
    update: {},
    create: {
      id: 'seed-family-1',
      name: 'The One Family',
      code: 'F1-SEED',
      createdById: 'seed-user-1',
      members: {
        createMany: {
          data: [
            { id: 'seed-fmem-1', userId: 'seed-user-1', role: 'HEAD' },
            { id: 'seed-fmem-2', userId: 'seed-user-2', role: 'MEMBER' },
          ],
        },
      },
    },
  });

  await prisma.family.upsert({
    where: { id: 'seed-family-2' },
    update: {},
    create: {
      id: 'seed-family-2',
      name: 'The Three Family',
      code: 'F3-SEED',
      createdById: 'seed-user-3',
      members: {
        createMany: {
          data: [
            { id: 'seed-fmem-3', userId: 'seed-user-3', role: 'HEAD' },
          ],
        },
      },
    },
  });

  // 4. Seed Volunteer Profiles
  console.log('Seeding volunteers...');
  await prisma.volunteerProfile.upsert({
    where: { userId: 'seed-user-2' },
    update: {},
    create: {
      id: 'seed-vol-2',
      userId: 'seed-user-2',
      status: 'APPROVED',
      approvedById: 'seed-user-admin',
      approvedAt: new Date(),
    },
  });

  // 5. Seed Disaster Response Data
  console.log('Seeding disaster response data...');

  await prisma.riskRegionSnapshot.upsert({
    where: { id: 'seed-risk-flood-1' },
    update: {},
    create: {
      id: 'seed-risk-flood-1',
      hazardType: 'FLOOD',
      severity: 'HIGH',
      name: 'Central River Flood Watch',
      latitude: 3.1400,
      longitude: 113.0400,
      radiusKm: 35.0,
      startsAt: new Date(),
      source: 'seed',
    },
  });

  await prisma.riskRegionSnapshot.upsert({
    where: { id: 'seed-risk-typhoon-1' },
    update: {},
    create: {
      id: 'seed-risk-typhoon-1',
      hazardType: 'TYPHOON',
      severity: 'MODERATE',
      name: 'Coastal Typhoon Exposure',
      latitude: 3.3000,
      longitude: 113.3000,
      radiusKm: 60.0,
      startsAt: new Date(),
      source: 'seed',
    },
  });

  await prisma.evacuationArea.upsert({
    where: { id: 'seed-evac-1' },
    update: {},
    create: {
      id: 'seed-evac-1',
      name: 'Community Hall A',
      latitude: 3.1500,
      longitude: 113.0500,
      address: 'Community Hall A',
      region: 'Kuching',
      isActive: true,
    },
  });

  await prisma.evacuationArea.upsert({
    where: { id: 'seed-evac-2' },
    update: {},
    create: {
      id: 'seed-evac-2',
      name: 'Public School B',
      latitude: 3.1700,
      longitude: 113.0800,
      address: 'Public School B',
      region: 'Kuching',
      isActive: true,
    },
  });

  // 6. Seed Warning Events
  console.log('Seeding warning events...');
  await prisma.warningEvent.upsert({
    where: { id: 'seed-warning-1' },
    update: {},
    create: {
      id: 'seed-warning-1',
      title: 'Critical Flood Warning',
      message: 'Severe flooding expected in Central River area. Please evacuate immediately.',
      hazardType: 'FLOOD',
      severity: 'CRITICAL',
      status: 'SENT',
      startsAt: new Date(),
      createdById: 'seed-user-admin',
      targetAreas: {
        create: {
          id: 'seed-target-1',
          areaName: 'Central River Zone',
          latitude: 3.1400,
          longitude: 113.0400,
          radiusKm: 10,
        },
      },
      evacuationAreas: {
        create: {
          id: 'seed-we-evac-1',
          evacuationAreaId: 'seed-evac-1',
        },
      },
    },
  });

  // 7. Seed Help Requests
  console.log('Seeding help requests...');
  await prisma.helpRequest.upsert({
    where: { id: 'seed-help-1' },
    update: {},
    create: {
      id: 'seed-help-1',
      requesterId: 'seed-user-1',
      familyId: 'seed-family-1',
      hazardType: 'FLOOD',
      urgency: 'HIGH',
      status: 'CLAIMED',
      description: 'Flood water entering ground floor, need assistance moving elderly.',
      latitude: 3.1450,
      longitude: 113.0450,
      assignments: {
        create: {
          id: 'seed-assign-1',
          volunteerId: 'seed-user-2',
          status: 'CLAIMED',
        },
      },
    },
  });

  // 8. Seed Map Pins
  console.log('Seeding map pins...');
  await prisma.mapPinStatus.upsert({
    where: { id: 'seed-pin-1' },
    update: {},
    create: {
      id: 'seed-pin-1',
      title: 'Bridge access blocked',
      hazardType: 'FLOOD',
      status: 'OPEN',
      priority: 3,
      latitude: 3.1600,
      longitude: 113.0600,
      region: 'Kuching',
      note: 'Initial seeded operational pin',
    },
  });

  // 4. Seed Tracker Data
  console.log('Seeding tracker data...');

  // Tracker Stats
  await prisma.trackerStats.upsert({
    where: { id: 'seed-tracker-stats-1' },
    update: {},
    create: {
      id: 'seed-tracker-stats-1',
      totalAidDisbursed: 4281902,
      verifiedPayouts: 12840,
      networkTrustIndex: 99.98,
    },
  });

  // Tracker Relief Zones
  const reliefZones = [
    {
      id: 'seed-tracker-zone-1',
      name: 'Manila Relief Hub',
      lat: 14.5995,
      lng: 120.9842,
      familyCount: 842,
      status: 'ACTIVE' as const,
      zoneType: 'evacuation',
    },
    {
      id: 'seed-tracker-zone-2',
      name: 'Bangkok Supply Center',
      lat: 13.7563,
      lng: 100.5018,
      familyCount: 620,
      status: 'ACTIVE' as const,
      zoneType: 'supply',
    },
    {
      id: 'seed-tracker-zone-3',
      name: 'Jakarta Medical Station',
      lat: -6.2088,
      lng: 106.8456,
      familyCount: 1150,
      status: 'ACTIVE' as const,
      zoneType: 'medical',
    },
    {
      id: 'seed-tracker-zone-4',
      name: 'Singapore Distribution Point',
      lat: 1.3521,
      lng: 103.8198,
      familyCount: 0,
      status: 'INACTIVE' as const,
      zoneType: 'supply',
    },
  ];

  for (const zone of reliefZones) {
    await prisma.trackerReliefZone.upsert({
      where: { id: zone.id },
      update: {},
      create: zone,
    });
  }

  // Tracker Validators
  const validators = [
    {
      id: 'seed-tracker-val-1',
      nodeId: 'PH-Manila-01',
      location: 'Manila, Philippines',
      latencyMs: 42,
      uptimePercentage: 98.2,
      status: 'ONLINE' as const,
    },
    {
      id: 'seed-tracker-val-2',
      nodeId: 'TH-Bangkok-14',
      location: 'Bangkok, Thailand',
      latencyMs: 38,
      uptimePercentage: 99.1,
      status: 'ONLINE' as const,
    },
    {
      id: 'seed-tracker-val-3',
      nodeId: 'MY-KL-09',
      location: 'Kuala Lumpur, Malaysia',
      latencyMs: 156,
      uptimePercentage: 94.5,
      status: 'DEGRADED' as const,
    },
    {
      id: 'seed-tracker-val-4',
      nodeId: 'SG-Central-03',
      location: 'Singapore',
      latencyMs: 28,
      uptimePercentage: 99.8,
      status: 'ONLINE' as const,
    },
    {
      id: 'seed-tracker-val-5',
      nodeId: 'ID-Jakarta-07',
      location: 'Jakarta, Indonesia',
      latencyMs: 65,
      uptimePercentage: 97.3,
      status: 'ONLINE' as const,
    },
    {
      id: 'seed-tracker-val-6',
      nodeId: 'VN-Hanoi-12',
      location: 'Hanoi, Vietnam',
      latencyMs: 88,
      uptimePercentage: 96.1,
      status: 'ONLINE' as const,
    },
  ];

  for (const validator of validators) {
    await prisma.trackerValidator.upsert({
      where: { id: validator.id },
      update: {},
      create: validator,
    });
  }

  // Tracker Shipments
  const shipments = [
    {
      id: 'seed-tracker-ship-1',
      shipmentId: 'AR-8821',
      origin: 'JKT',
      destination: 'MNL',
      class: 'Medical Supplies',
      status: 'DISPATCHED' as const,
      verificationStatus: 'VERIFIED' as const,
      blockchainHash: '0x71c7f4e9a2f8d3b1c5e6a9f2d4b8c3e1a7f9d2b6',
      timestamp: new Date('2025-03-10T14:20:05Z'),
    },
    {
      id: 'seed-tracker-ship-2',
      shipmentId: 'AR-8790',
      origin: 'BKK',
      destination: 'HAN',
      class: 'Food Rations',
      status: 'DISPATCHED' as const,
      verificationStatus: 'PENDING' as const,
      blockchainHash: '0x44d8e2f1b9c7a5d3e8f2b6c1a9d4e7f3b8c2a6d1',
      timestamp: new Date('2025-03-10T15:05:41Z'),
    },
    {
      id: 'seed-tracker-ship-3',
      shipmentId: 'AR-8812',
      origin: 'SIN',
      destination: 'KUL',
      class: 'Shelter Kits',
      status: 'IN_TRANSIT' as const,
      verificationStatus: 'VERIFIED' as const,
      blockchainHash: '0x22a9f3b7d1e5c8a4f2b9d6e3c1a7f8b4d2e9c5a1',
      timestamp: new Date('2025-03-10T16:30:12Z'),
    },
    {
      id: 'seed-tracker-ship-4',
      shipmentId: 'AR-8805',
      origin: 'PNH',
      destination: 'VTE',
      class: 'Water Filters',
      status: 'DISPATCHED' as const,
      verificationStatus: 'VERIFIED' as const,
      blockchainHash: '0x99e4d7a2f8c1b6e3a9f5d2c8b4e1a7f3d9c6b2a5',
      timestamp: new Date('2025-03-10T17:12:00Z'),
    },
    {
      id: 'seed-tracker-ship-5',
      shipmentId: 'AR-8833',
      origin: 'MNL',
      destination: 'BKK',
      class: 'Emergency Kits',
      status: 'DELIVERED' as const,
      verificationStatus: 'VERIFIED' as const,
      blockchainHash: '0x55f2a8d3c9e1b7f4a6d2c8e5b1f9a3d7c4e8b6a2',
      timestamp: new Date('2025-03-09T10:45:22Z'),
    },
    {
      id: 'seed-tracker-ship-6',
      shipmentId: 'AR-8799',
      origin: 'HAN',
      destination: 'MNL',
      class: 'Medical Equipment',
      status: 'DELIVERED' as const,
      verificationStatus: 'VERIFIED' as const,
      blockchainHash: '0x77d9e4a1f6c2b8d5e3a9f7c4b2d8e6a1f3c9b5d7',
      timestamp: new Date('2025-03-08T08:20:15Z'),
    },
    {
      id: 'seed-tracker-ship-7',
      shipmentId: 'AR-8856',
      origin: 'KUL',
      destination: 'SIN',
      class: 'Hygiene Supplies',
      status: 'IN_TRANSIT' as const,
      verificationStatus: 'VERIFIED' as const,
      blockchainHash: '0x33c6f8a4d2e9b5c1a7f3d8e6b4a2f9c5d1e7a8b3',
      timestamp: new Date('2025-03-10T12:30:45Z'),
    },
    {
      id: 'seed-tracker-ship-8',
      shipmentId: 'AR-8841',
      origin: 'JKT',
      destination: 'BKK',
      class: 'Construction Materials',
      status: 'IN_TRANSIT' as const,
      verificationStatus: 'PENDING' as const,
      blockchainHash: null,
      timestamp: new Date('2025-03-10T18:15:30Z'),
    },
    {
      id: 'seed-tracker-ship-9',
      shipmentId: 'AR-8872',
      origin: 'SIN',
      destination: 'HAN',
      class: 'Solar Panels',
      status: 'DELIVERED' as const,
      verificationStatus: 'VERIFIED' as const,
      blockchainHash: '0x88e1a7f4c3b9d6e2a5f8c1d4b7e9a3f6c2d8b5a4',
      timestamp: new Date('2025-03-07T14:55:10Z'),
    },
  ];

  for (const shipment of shipments) {
    await prisma.trackerShipment.upsert({
      where: { id: shipment.id },
      update: {},
      create: shipment,
    });
  }

  await prisma.mapPinStatus.upsert({
    where: { id: 'seed-pin-2' },
    update: {},
    create: {
      id: 'seed-pin-2',
      title: 'Road collapse at KM 12',
      hazardType: 'EARTHQUAKE',
      status: 'OPEN',
      priority: 4,
      latitude: 3.1800,
      longitude: 113.1000,
      region: 'Kuching',
      note: 'Foundations weakened by aftershock.',
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });