import { describe, it, expect, vi } from 'vitest';
import { Logger } from './logger.js';

describe('Logger Utility', () => {
  it('should create a logger instance', () => {
    const logger = new Logger('info');
    expect(logger).toBeInstanceOf(Logger);
  });

  it('should log info messages', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = new Logger('info');
    logger.info('test message');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should log error messages', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = new Logger('info');
    logger.error('error message');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
