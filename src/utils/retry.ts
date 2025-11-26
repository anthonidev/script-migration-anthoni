/**
 * Utilidades para delays y reintentos en scraping
 */

import { logger } from './logger.js';

/**
 * Espera un tiempo determinado
 */
export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Espera un tiempo aleatorio entre min y max
 */
export async function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await delay(ms);
}

/**
 * Opciones para la función retry
 */
export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Reintentar una función asíncrona con backoff exponencial
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoff = true,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      const waitTime = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

      logger.warn(
        `Attempt ${attempt}/${maxRetries} failed. Retrying in ${waitTime}ms...`,
        { error: error instanceof Error ? error.message : error }
      );

      if (onRetry) {
        onRetry(attempt, error);
      }

      await delay(waitTime);
    }
  }

  throw lastError;
}
