import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.ts'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'tests/**',
        'src/index.ts',
        // Exclude non-library example files from coverage
        'examples/**',
        // Exclude type-only interface files that contain no runtime code
        'src/ClientApi.ts',
        'src/ClientApiOptions.ts',
        '**/*.d.ts',
        'dist/**',
        'build.js',
        'docs/**',
        'coverage/**',
        'output/**',
        '**/*.config.*',
      ],
    },
  },
});
