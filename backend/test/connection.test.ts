// test/connection.integration.test.ts
import request from 'supertest';
import {prisma} from '../src/lib/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Database Connection (Integration)', () => {
  it('should successfully query the database', async () => {
    const result = await prisma.$queryRaw`SELECT 1`; 
    expect(result).toBeDefined();
  });
});