import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

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
