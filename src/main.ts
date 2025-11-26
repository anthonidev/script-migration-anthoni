import dotenv from 'dotenv';
import { validateEnv } from './config/env.js';
import { DoctoraliaScraper } from './scrapers/doctoralia.js';
import { PatientGenerator } from './generators/patients.js';
import { DbService } from './services/db.js';
import { Logger } from './utils/logger.js';

dotenv.config();

async function main() {
  const env = validateEnv();
  const logger = new Logger(env.LOG_LEVEL);

  logger.info('🚀 Doctoralia Migration Pipeline');
  logger.info('================================');

  // Services
  const scraper = new DoctoraliaScraper(env);
  const generator = new PatientGenerator(env);
  const db = new DbService(env);

  try {
    // 1. Scrape Data
    logger.info('🕷️ Starting Scraper...');
    const doctors = await scraper.scrape();
    await scraper.close();
    logger.info(`✅ Scraped ${doctors.length} doctors.`);

    // 2. Generate Data
    logger.info('🎲 Starting Data Generator...');
    const patients = generator.generate();
    logger.info(`✅ Generated ${patients.length} patients.`);

    // 3. Seed Database
    logger.info('💾 Starting Database Seeder...');
    await db.connect();
    await db.seedDatabase(doctors, patients);
    logger.info('✅ Database seeded successfully.');
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
