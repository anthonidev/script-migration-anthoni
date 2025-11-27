import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { validateEnv } from './config/env.js';
import { DoctoraliaScraper } from './scrapers/doctoralia.js';
import { PatientGenerator } from './generators/patients.js';
import { DbService } from './services/db.js';
import { Logger } from './utils/logger.js';

dotenv.config();

async function main() {
  const env = validateEnv();
  const logger = new Logger(env.LOG_LEVEL);

  logger.emptyLine();
  logger.info('🚀 Doctoralia Migration Pipeline');
  logger.separator('=');
  logger.emptyLine();

  // Services
  const scraper = new DoctoraliaScraper(env);
  const generator = new PatientGenerator(env);
  const db = new DbService(env);

  try {
    // 1. Scrape Data
    logger.info('STEP 1: SCRAPING DATA');
    logger.separator();

    let doctors;
    if (process.env.SKIP_SCRAPING === 'true') {
      logger.info('⏭️  Skipping scraping as requested.');
      const dataPath = path.join(process.cwd(), 'data', 'doctors.json');
      try {
        const data = await fs.readFile(dataPath, 'utf-8');
        doctors = JSON.parse(data);
        logger.info(`✅ Loaded ${doctors.length} doctors from ${dataPath}`);
      } catch (error) {
        logger.error(`❌ Failed to load existing data from ${dataPath}:`, error);
        throw error;
      }
    } else {
      logger.info('🕷️ Starting Scraper...');
      doctors = await scraper.scrape();
      await scraper.close();
      logger.info(`✅ Scraped ${doctors.length} doctors.`);
    }
    logger.emptyLine();

    // 2. Generate Data
    logger.info('STEP 2: GENERATING DATA');
    logger.separator();
    logger.info('🎲 Starting Data Generator...');
    const patients = await generator.generate();
    logger.info(`✅ Generated ${patients.length} patients.`);
    logger.emptyLine();

    // 3. Seed Database
    logger.info('STEP 3: SEEDING DATABASE');
    logger.separator();
    logger.info('💾 Starting Database Seeder...');
    await db.connect();
    await db.seedDatabase(doctors, patients);
    logger.info('✅ Database seeded successfully.');
    logger.emptyLine();
  } catch (error) {
    logger.error('❌ Pipeline failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
    await scraper.close();
  }
}

main()
  .then(() => {
    console.log('\n✅ Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
