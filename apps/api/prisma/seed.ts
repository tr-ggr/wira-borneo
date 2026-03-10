import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
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
