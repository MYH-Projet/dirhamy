// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // 1. Use the ESM preset
  preset: 'ts-jest/presets/default-esm', 
  testEnvironment: 'node',
  
  // 2. Allow .ts files to be treated as ESM
  extensionsToTreatAsEsm: ['.ts'],

  // 3. Force ts-jest to use ESM
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  
  // 4. Ignore transformation for node_modules EXCEPT specific ones if needed
  // (Usually not needed for Prisma, but good to know)
  transformIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    // If code imports "foo.js", Jest will look for "foo" (which ts-jest resolves to foo.ts)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};