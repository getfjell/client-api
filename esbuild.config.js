import { build } from 'esbuild';
import { readFileSync } from 'fs';

// Read dependencies from package.json to mark them as external
const { dependencies, peerDependencies } = JSON.parse(readFileSync('./package.json', 'utf-8'));
const external = [
  ...Object.keys(dependencies || {}),
  ...Object.keys(peerDependencies || {})
];

const baseConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  target: 'es2022',
  sourcemap: true,
  minify: false,
  external, // Don't bundle dependencies
  platform: 'neutral',
  mainFields: ['module', 'main'],
  conditions: ['import', 'module', 'default']
};

async function buildESM() {
  await build({
    ...baseConfig,
    format: 'esm',
    outfile: 'dist/index.js',
    splitting: false,
  });
}

async function buildAll() {
  try {
    console.log('Building ESM...');
    await buildESM();
    console.log('Build complete!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildAll();
