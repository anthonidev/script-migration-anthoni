import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Scraping
  SCRAPING_DELAY_MS: z.coerce.number().min(0).default(1500),
  SCRAPING_MAX_RETRIES: z.coerce.number().min(1).default(3),
  SCRAPING_TIMEOUT_MS: z.coerce.number().min(1000).default(30000),
  SCRAPING_CONCURRENCY: z.coerce.number().min(1).max(10).default(3),
  SCRAPING_CITIES: z.string().default('Lima,Bogotá,Madrid'),
  SCRAPING_SPECIALTIES: z.string().default('Cardiólogo,Dermatólogo,Pediatra'),
  MAX_SERVICES_COUNT: z.coerce.number().min(1).default(5),
  MAX_AVAILABILITY_SLOTS_COUNT: z.coerce.number().min(1).default(5),
  MAX_DOCTORS_PER_SEARCH: z.coerce.number().min(1).default(3),

  // Data Generation
  PATIENTS_COUNT: z.coerce.number().min(1).default(200),
  APPOINTMENTS_COUNT: z.coerce.number().min(1).default(1000),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Error en variables de entorno:');
      const issues = error.issues || [];
      issues.forEach((err) => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
    }

    throw new Error('Invalid environment variables');
  }
}

export function getCities(env: Env): string[] {
  return env.SCRAPING_CITIES.split(',').map((city) => city.trim());
}

export function getSpecialties(env: Env): string[] {
  return env.SCRAPING_SPECIALTIES.split(',').map((specialty) => specialty.trim());
}
