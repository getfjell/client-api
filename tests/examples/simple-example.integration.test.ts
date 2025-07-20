import { describe, expect, it } from 'vitest';
import { expectNoErrors, getLogOutput, restoreConsole, setupConsoleCapture } from './test-helpers';

describe('Simple Example Integration Tests', () => {
  it('should run simple example and show completion', async () => {
    const capture = setupConsoleCapture();

    try {
      const { runSimpleExample } = await import('../../examples/simple-example');
      await runSimpleExample();

      const logOutput = getLogOutput(capture);

      expectNoErrors(capture);
      expect(logOutput).toContain('Fjell-Client-API Simple Example');
      expect(logOutput).toContain('completed successfully');
    } finally {
      restoreConsole(capture);
    }
  });
});
