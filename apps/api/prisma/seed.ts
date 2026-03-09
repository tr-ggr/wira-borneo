import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const EVAC_GEOJSON_PATH = join(process.cwd(), 'data', 'evacuation-center', 'src', 'data', 'ph_evacs_cleaned.geojson');
const EVAC_RAW_GEOJSON_PATH = join(process.cwd(), 'data', 'evacuation-center', 'src', 'data', 'ph_evacs_raw.geojson');
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

  // 3. Seed Disaster Response Data (porting from .sql)
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

  const evacFromGeojson = loadEvacuationGeoJson();
  if (evacFromGeojson.length > 0) {
    console.log(`Seeding ${evacFromGeojson.length} evacuation areas from GeoJSON...`);
    for (const e of evacFromGeojson) {
      await prisma.evacuationArea.upsert({
        where: { id: e.id },
        update: {
          name: e.name,
          latitude: e.latitude,
          longitude: e.longitude,
          address: e.address,
          region: e.region,
          type: e.type,
          capacity: e.capacity,
          population: e.population,
          source: e.source,
        },
        create: {
          id: e.id,
          name: e.name,
          latitude: e.latitude,
          longitude: e.longitude,
          address: e.address,
          region: e.region,
          type: e.type,
          capacity: e.capacity,
          population: e.population,
          source: e.source,
          isActive: true,
        },
      });
    }
  }

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
