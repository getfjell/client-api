import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';
import dts from 'vite-plugin-dts';
import path from 'path';
import { configDefaults } from 'vitest/config';

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
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'cjs' ? '[name].cjs' : '[name].js',
    },
    rollupOptions: {
      input: 'src/index.ts',
      output: [
        {
          format: 'esm',
          entryFileNames: '[name].js',
          preserveModules: true,
          exports: 'named',
          sourcemap: 'inline',
        },
        {
          format: 'cjs',
          entryFileNames: '[name].cjs',
          preserveModules: true,
          exports: 'named',
          sourcemap: 'inline',
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
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8', // or 'istanbul' for more detailed reports
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 66,
          functions: 71,
          lines: 75,
          statements: 75,
        }
      }
    },
    exclude: [...configDefaults.exclude, 'dist', 'coverage']
  },
});