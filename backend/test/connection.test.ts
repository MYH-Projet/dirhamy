import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';

// Close the connection after tests to prevent "Worker failed to exit" errors
afterAll(async () => {
  await prisma.$disconnect();
});

describe('Database Connection (Integration)', () => {
  it('should successfully query the database', async () => {
    // Ping MongoDB to verify the DB is reachable (no SQL on Mongo)
    const result = await prisma.$runCommandRaw({ ping: 1 });

    // Check that we got a result back
    expect(result).toBeDefined();
    expect((result as { ok?: number }).ok).toBe(1);
  });
});