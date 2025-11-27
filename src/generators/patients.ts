import { faker } from '@faker-js/faker';
import { Env } from '../config/env.js';
import { Logger } from '../utils/logger.js';
import { ProgressUtils } from '../utils/progress.js';

import { GeneratedPatient } from '../types/index.js';

export class PatientGenerator {
  private logger: Logger;

  constructor(private env: Env) {
    this.logger = new Logger(env.LOG_LEVEL);
  }

  async generate(): Promise<GeneratedPatient[]> {
    const count = this.env.PATIENTS_COUNT;
    this.logger.info(`👥 Generating ${count} fake patients...`);

    const patients: GeneratedPatient[] = [];
    const bar = ProgressUtils.createBar(
      ProgressUtils.getStandardFormat('Generating Patients'),
      this.logger,
    );
    bar.start(count, 0);

    for (let i = 0; i < count; i++) {
      patients.push({
        fullName: faker.person.fullName(),
        documentNumber: faker.string.numeric(8),
        phoneNumber: faker.phone.number(),
        email: faker.internet.email(),
      });
      bar.increment();

      // Yield to event loop every 20 items to allow logs to flush
      if (i % 20 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    bar.stop();

    return patients;
  }
}
