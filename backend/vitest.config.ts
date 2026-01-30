import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globalSetup: ['./tests/globalSetup.ts'],
    testTimeout: 20000,
    fileParallelism: false,
    include: ['tests/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test_jwt_secret_value_12345',
      REFRESH_TOKEN_SECRET: 'test_refresh_secret_value_67890',
      // DATABASE_URL is managed by setup.ts/testDb.ts via Testcontainers
    }
  },
});