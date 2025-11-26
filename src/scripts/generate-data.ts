import dotenv from 'dotenv';
import { validateEnv } from '../config/env.js';
import { DoctoraliaScraper } from '../scrapers/doctoralia.js';
import { Logger } from '../utils/logger.js';

dotenv.config();

async function main() {
  const env = validateEnv();
  const logger = new Logger(env.LOG_LEVEL);

  logger.emptyLine();
  logger.info('🚀 Generating Sample Data');
  logger.separator('=');
  logger.emptyLine();

  const scraper = new DoctoraliaScraper(env);

  try {
    logger.info('🕷️ Starting Scraper...');
    const doctors = await scraper.scrape();
    await scraper.close();

    logger.emptyLine();
    logger.info(`✅ Successfully generated data for ${doctors.length} doctors.`);
    logger.info('📁 Data saved to: data/doctors.json');
    logger.emptyLine();
  } catch (error) {
    logger.error('❌ Data generation failed:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
