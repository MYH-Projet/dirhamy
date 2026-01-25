import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '../../generated/prisma/client'; // Correct path to generated client file
import { execSync } from 'child_process';
import path from 'path';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let pool: pg.Pool;

export const startContainer = async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer("postgres:16-alpine")
        .withDatabase('dirhamy_test')
        .withUsername('postgres')
        .withPassword('postgres')
        .withExposedPorts(5432)
        .start();

    const databaseUrl = container.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;

    // Run migrations
    const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
    try {
        execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
            env: { ...process.env, DATABASE_URL: databaseUrl },
            stdio: 'inherit'
        });
    } catch (e) {
        console.error("Migration failed", e);
        throw e;
    }

    return databaseUrl;
};

export const connectPrisma = async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error("DATABASE_URL not set. Container not started?");
    }

    // Use driver adapter as in the app
    pool = new pg.Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);

    prisma = new PrismaClient({ adapter });
    return prisma;
};

// Backwards compatibility for now, or just remove if we update everything
export const startTestDb = async () => {
    await startContainer();
    return connectPrisma();
};

export const stopTestDb = async () => {
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
    if (container) await container.stop();
};

export const getPrisma = () => {
    if (!prisma) {
        throw new Error("Prisma not initialized. Call startTestDb first.");
    }
    return prisma;
};

export const resetDb = async () => {
    if (!prisma) return;

    // Truncate tables in specific order to avoid FK constraints
    const tablenames = await prisma.$queryRaw<
        Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`)
        .join(', ');

    if (tables.length > 0) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        } catch (error) {
            console.log({ error });
        }
    }
};
