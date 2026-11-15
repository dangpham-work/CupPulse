import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Node 25+ bật sẵn Web Storage của Node; thiếu --localstorage-file thì window.localStorage = undefined
    // và che mất localStorage của jsdom. Tắt nó trong tiến trình chạy test.
    poolOptions: { forks: { execArgv: ['--no-experimental-webstorage'] } },
  },
});
