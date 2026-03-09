import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';
import * as JSONStream from 'JSONStream';
import { randomUUID } from 'crypto';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const GEOJSON_DIR = path.join(process.cwd(), 'geojson/building_profiles');
const BATCH_SIZE = 5000;

async function ingestFile(filePath: string, iso3: string) {
  console.log(`Starting ingestion for ${iso3} from ${filePath}`);
  
  return new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const parser = JSONStream.parse('features.*');
    
    let batch: any[] = [];
    let processedCount = 0;
    let isProcessing = false;

    const processBatch = async () => {
      if (batch.length === 0) return;
      isProcessing = true;
      const currentBatch = [...batch];
      batch = [];

      try {
        // We use a raw query because Prisma doesn't natively support PostGIS geometry types in its TypeSafe API yet
        // for Unsupported types.
        const values = currentBatch.map(feature => {
          const id = randomUUID();
          const geom = JSON.stringify(feature.geometry);
          const props = JSON.stringify(feature.properties);
          return `('${id}', '${iso3}', ST_GeomFromGeoJSON('${geom}'), '${props}'::jsonb)`;
        }).join(',');

        await prisma.$executeRawUnsafe(`
          INSERT INTO building_profiles (id, iso3, geom, properties)
          VALUES ${values}
        `);

        processedCount += currentBatch.length;
        console.log(`Inserted batch of ${currentBatch.length}. Total: ${processedCount}`);
      } catch (err) {
        console.error(`Error inserting batch:`, err);
        stream.destroy();
        reject(err);
      } finally {
        isProcessing = false;
        if (parser.readable) {
            parser.resume();
        }
      }
    };

    stream.pipe(parser);

    parser.on('data', (feature: any) => {
      batch.push(feature);
      if (batch.length >= BATCH_SIZE && !isProcessing) {
        parser.pause();
        processBatch();
      }
    });

    parser.on('end', async () => {
      if (batch.length > 0) {
        await processBatch();
      }
      console.log(`Finished ingestion for ${iso3}. Total processed: ${processedCount}`);
      resolve();
    });

    parser.on('error', (err) => {
      console.error(`Parser error:`, err);
      reject(err);
    });

    stream.on('error', (err) => {
      console.error(`Stream error:`, err);
      reject(err);
    });
  });
}

async function main() {
  const files = fs.readdirSync(GEOJSON_DIR).filter(f => f.startsWith('vulnerability_') && f.endsWith('.geojson'));
  
  console.log(`Found ${files.length} files to ingest.`);

  for (const file of files) {
    const iso3 = file.split('_')[1].split('.')[0];
    const filePath = path.join(GEOJSON_DIR, file);
    
    // Clear existing data for this ISO3 to allow re-runs
    console.log(`Clearing existing data for ${iso3}...`);
    await prisma.$executeRawUnsafe(`DELETE FROM building_profiles WHERE iso3 = $1`, iso3);
    
    await ingestFile(filePath, iso3);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
