import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { configDefaults } from 'vitest/config';
import { readFileSync } from 'fs';

const { dependencies } = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  server: {
    port: 3000
  },
  plugins: [
    ...VitePluginNode({
      adapter: 'express',
      appPath: './src/index.ts',
      exportName: 'viteNodeApp',
      tsCompiler: 'swc',
      swcOptions: {
        sourceMaps: true,
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: false,
            decorators: true,
          },
          target: 'es2020',
        },
      },
    }),
    // visualizer({
    //     template: 'network',
    //     filename: 'network.html',
    //     projectRoot: process.cwd(),
    // }),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      exclude: ['./tests/**/*.ts'],
      include: ['./src/**/*.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    lib: {
      entry: './src/index.ts',
      fileName: () => '[name].js',
    },
    rollupOptions: {
      external: [...Object.keys(dependencies || {})],
      input: 'src/index.ts',
      output: [
        {
          format: 'esm',
          entryFileNames: '[name].js',
          preserveModules: true,
          exports: 'named',
        },
      ],
    },
    // Make sure Vite generates ESM-compatible code
    modulePreload: false,
    minify: false,
    sourcemap: true
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'dist', 'coverage', 'src/index.ts'],
    coverage: {
      provider: 'v8', // or 'istanbul' for more detailed reports
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts', 'examples/**/*.ts'],
      exclude: ['src/index.ts', 'tests/**', 'node_modules/**'],
      thresholds: {
        global: {
          branches: 93,
          functions: 93,
          lines: 90,
          statements: 90,
        }
      }
    },
  },
});
