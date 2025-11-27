import { describe, it, expect } from 'vitest';
import { PatientGenerator } from './patients.js';
import { Env } from '../config/env.js';

describe('Patient Generator', () => {
  const mockEnv = {
    PATIENTS_COUNT: 5,
    LOG_LEVEL: 'info',
  } as Env;

  it('should generate the specified number of patients', async () => {
    const generator = new PatientGenerator(mockEnv);
    const patients = await generator.generate();
    expect(patients).toHaveLength(5);
  });

  it('should generate patients with valid properties', async () => {
    const generator = new PatientGenerator({ ...mockEnv, PATIENTS_COUNT: 1 });
    const patients = await generator.generate();
    const patient = patients[0];

    expect(patient).toHaveProperty('fullName');
    expect(patient).toHaveProperty('documentNumber');
    expect(patient).toHaveProperty('email');
    expect(patient).toHaveProperty('phoneNumber');
    expect(patient.email).toContain('@');
  });
});
