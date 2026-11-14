/** Integration test với PostgreSQL thật (cần DATABASE_URL, đã migrate + seed). */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.int-spec.ts'],
  setupFiles: ['<rootDir>/test/load-env.ts'],
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
};
