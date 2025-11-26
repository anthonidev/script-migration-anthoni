import dotenv from 'dotenv';
import { validateEnv } from './config/env.js';
import { DoctoraliaScraper } from './scrapers/doctoralia.js';
import { PatientGenerator } from './generators/patients.js';
import { DbService } from './services/db.js';

dotenv.config();

async function main() {
  console.log('🚀 Doctoralia Migration Pipeline');
  console.log('================================\n');

  const env = validateEnv();

  // Services
  const scraper = new DoctoraliaScraper(env);
  const generator = new PatientGenerator(env);
  const db = new DbService(env);

  try {
    // 1. Scrape Data
    console.log('🕷️ Starting Scraper...');
    const doctors = await scraper.scrape();
    await scraper.close();
    console.log(`✅ Scraped ${doctors.length} doctors.\n`);

    // 2. Generate Data
    console.log('🎲 Starting Data Generator...');
    const patients = generator.generate();
    console.log(`✅ Generated ${patients.length} patients.\n`);

    // 3. Seed Database
    console.log('💾 Starting Database Seeder...');
    await db.connect();
    await db.seedDatabase(doctors, patients);
    console.log('✅ Database seeded successfully.\n');

  } catch (error) {
    console.error('❌ Pipeline failed:', error);
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
