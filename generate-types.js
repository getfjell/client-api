import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function generateTypes() {
  try {
    console.log('Generating TypeScript declarations...');
    await execAsync('pnpm exec tsc --emitDeclarationOnly --outDir dist --declaration');
    console.log('TypeScript declarations generated successfully!');
  } catch (error) {
    console.error('Failed to generate TypeScript declarations:', error);
    process.exit(1);
  }
}

generateTypes();
