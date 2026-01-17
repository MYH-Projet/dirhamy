import { describe, it, expect, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';

// Close the connection after tests to prevent "Worker failed to exit" errors
afterAll(async () => {
  await prisma.$disconnect();
});

describe('Database Connection (Integration)', () => {
  it('should successfully query the database', async () => {
    // A simple query to verify the DB is reachable
    const result = await prisma.$queryRaw`SELECT 1`; 
    
    // Check that we got a result back
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});