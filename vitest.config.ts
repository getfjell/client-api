/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    testTimeout: 30000,
    coverage: {
      exclude: [
        'build.js',
        'docs/**',
        'coverage/**',
        'output/**',
        '**/*.config.*',
        '**/*.d.ts',
        'dist/**',
      ]
    }
  },
})
