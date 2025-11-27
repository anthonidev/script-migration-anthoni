import { describe, it, expect, vi } from 'vitest';
import { delay } from './delay.js';

describe('Delay Utility', () => {
  it('should wait for the specified time', async () => {
    vi.useFakeTimers();
    const promise = delay(1000);

    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();

    vi.useRealTimers();
  });
});
