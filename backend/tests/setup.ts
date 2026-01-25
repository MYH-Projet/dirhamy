import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { connectPrisma, resetDb, getPrisma } from './helpers/testDb';
import fs from 'fs';
import path from 'path';

// Mock Redis to prevent connection errors
vi.mock('ioredis', () => {
    return {
        default: class Redis {
            status = 'ready';
            constructor() { }
            on(_event: string, _callback: any) { }
            consume() { return Promise.resolve() } // For rate-limiter-flexible
            disconnect() { }
            quit() { }
        }
    };
});

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: class {
            constructor() { }
            getGenerativeModel() {
                return {
                    generateContent: async () => ({
                        response: { text: () => "Mocked AI response" }
                    })
                };
            }
        }
    };
});

// Mock the global prisma instance used by the app
vi.mock('../src/lib/prisma', () => ({
    prisma: getPrismaProxy()
}));

// We need a proxy because getPrisma() throws if called before connectPrisma()
// and the mock is hoisted.
function getPrismaProxy() {
    return new Proxy({}, {
        get: (_target, prop) => {
            const prisma = getPrisma();
            return (prisma as any)[prop];
        }
    });
}

beforeAll(async () => {
    // Read DATABASE_URL from the file created by globalSetup
    const envFile = path.resolve(__dirname, 'test-env.json');
    if (!fs.existsSync(envFile)) {
        throw new Error('test-env.json not found. Did globalSetup run?');
    }
    const { DATABASE_URL } = JSON.parse(fs.readFileSync(envFile, 'utf-8'));
    process.env.DATABASE_URL = DATABASE_URL;

    console.log("Connecting to Test Database...");
    await connectPrisma();
    console.log("Connected to Test Database.");
});

// No need to stop container in afterAll, globalSetup handles it.
// We just disconnect Prisma client.
afterAll(async () => {
    const prisma = getPrisma();
    await prisma.$disconnect();
});

beforeEach(async () => {
    await resetDb();
});
