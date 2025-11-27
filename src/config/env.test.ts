import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateEnv } from './env.js';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate correct environment variables', () => {
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';
    process.env.LOG_LEVEL = 'info';

    const env = validateEnv();
    expect(env).toBeDefined();
    expect(env.DATABASE_URL).toBe('postgresql://user:password@localhost:5432/db');
  });

  it('should throw error if required variables are missing', () => {
    delete process.env.DATABASE_URL;
    expect(() => validateEnv()).toThrow();
  });
});
