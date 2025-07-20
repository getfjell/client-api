import { describe, expect, it } from 'vitest';
import { expectNoErrors, getLogOutput, restoreConsole, setupConsoleCapture } from './test-helpers';

describe('Enterprise Example Integration Tests', () => {
  it('should run enterprise example and show completion', async () => {
    const capture = setupConsoleCapture();

    try {
      const { runEnterpriseExample } = await import('../../examples/enterprise-example');
      await runEnterpriseExample();

      const logOutput = getLogOutput(capture);

      expectNoErrors(capture);
      expect(logOutput).toContain('Enterprise Example');
      expect(logOutput).toContain('completed successfully');
    } finally {
      restoreConsole(capture);
    }
  });
});
