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

    // 2. Connect to Database
    logger.info('STEP 2: CONNECTING TO DATABASE');
    logger.separator();
    await db.connect();
    logger.emptyLine();

    // 3. Parallel Generation + Seeding
    logger.info('STEP 3: PARALLEL DATA GENERATION & DOCTOR SEEDING');
    logger.separator();
    logger.info('⚡ Running in parallel: Patient generation + Doctor seeding...');

    const [createdDoctors, patients] = await Promise.all([
      db.seedDoctors(doctors),
      generator.generate(),
    ]);

    logger.info(`✅ Parallel execution completed.`);
    logger.info(`   - Seeded ${createdDoctors.length} doctors`);
    logger.info(`   - Generated ${patients.length} patients`);
    logger.emptyLine();

    // 4. Sequential Patient & Appointment Seeding
    logger.info('STEP 4: SEEDING PATIENTS & APPOINTMENTS');
    logger.separator();

    const createdPatients = await db.seedPatients(patients);
    await db.seedAppointments(createdDoctors, createdPatients);

    logger.info('✅ Database seeding completed successfully.');
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
