import { describe, expect, it } from 'vitest';
import { expectNoErrors, getLogOutput, restoreConsole, setupConsoleCapture } from './test-helpers';

describe('Multi-Level Keys Example Integration Tests', () => {
  it('should run multi-level keys example and show completion', async () => {
    const capture = setupConsoleCapture();

    try {
      const { runMultiLevelKeysExample } = await import('../../examples/multi-level-keys');
      await runMultiLevelKeysExample();

      const logOutput = getLogOutput(capture);

      expectNoErrors(capture);
      expect(logOutput).toContain('Multi-Level Keys Example');
      expect(logOutput).toContain('completed successfully');
    } finally {
      restoreConsole(capture);
    }
  });
});
