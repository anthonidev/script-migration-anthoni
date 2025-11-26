import { faker } from '@faker-js/faker';
import { Env } from '../config/env.js';

import { GeneratedPatient } from '../types/index.js';

export class PatientGenerator {
  constructor(private env: Env) {}

  generate(): GeneratedPatient[] {
    const count = this.env.PATIENTS_COUNT;
    console.log(`👥 Generating ${count} fake patients...`);

    const patients: GeneratedPatient[] = [];

    for (let i = 0; i < count; i++) {
      patients.push({
        fullName: faker.person.fullName(),
        documentNumber: faker.string.numeric(8),
        phoneNumber: faker.phone.number(),
        email: faker.internet.email(),
      });
    }

    return patients;
  }
}
