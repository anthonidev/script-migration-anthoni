import dotenv from 'dotenv';
import { validateEnv } from './config/env.js';

dotenv.config();

async function main() {
  console.log('🚀 Doctoralia Migration Pipeline');
  console.log('================================\n');

  const env = validateEnv();

  console.log('✅ Environment validated');
  console.log(`📊 Database: ${env.DATABASE_URL?.split('@')[1] || 'Not set'}`);
  console.log(`🌍 Cities: ${env.SCRAPING_CITIES}`);
  console.log(`🏥 Specialties: ${env.SCRAPING_SPECIALTIES}`);
  console.log(`👥 Patients: ${env.PATIENTS_COUNT}`);
  console.log(`📅 Appointments: ${env.APPOINTMENTS_COUNT}\n`);

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
