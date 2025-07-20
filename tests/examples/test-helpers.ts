/**
 * Test helpers for fjell-client-api examples
 *
 * These utilities help test the example files and verify their outputs
 * and behaviors are correct.
 */

import { vi } from 'vitest';

// ===== Console Capture Utilities =====

export interface ConsoleCapture {
  logs: string[];
  errors: string[];
  warns: string[];
  originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
  };
}

/**
 * Sets up console capture for testing example outputs
 */
export function setupConsoleCapture(): ConsoleCapture {
  const capture: ConsoleCapture = {
    logs: [],
    errors: [],
    warns: [],
    originalConsole: {
      log: console.log,
      error: console.error,
      warn: console.warn
    }
  };

  // Mock console methods to capture output
  console.log = vi.fn((...args: any[]) => {
    capture.logs.push(args.map(arg =>
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' '));
  });

  console.error = vi.fn((...args: any[]) => {
    capture.errors.push(args.map(arg =>
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' '));
  });

  console.warn = vi.fn((...args: any[]) => {
    capture.warns.push(args.map(arg =>
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' '));
  });

  return capture;
}

/**
 * Restores original console methods
 */
export function restoreConsole(capture: ConsoleCapture): void {
  console.log = capture.originalConsole.log;
  console.error = capture.originalConsole.error;
  console.warn = capture.originalConsole.warn;
}

/**
 * Gets all captured console output as a single string
 */
export function getLogOutput(capture: ConsoleCapture): string {
  return capture.logs.join('\n');
}

/**
 * Gets all captured error output as a single string
 */
export function getErrorOutput(capture: ConsoleCapture): string {
  return capture.errors.join('\n');
}

/**
 * Gets all captured warning output as a single string
 */
export function getWarnOutput(capture: ConsoleCapture): string {
  return capture.warns.join('\n');
}

// ===== Example Output Verification =====

/**
 * Verifies that no errors were logged during example execution
 */
export function expectNoErrors(capture: ConsoleCapture): void {
  if (capture.errors.length > 0) {
    throw new Error(`Expected no errors, but found: ${capture.errors.join(', ')}`);
  }
}

/**
 * Verifies that the example demonstrates basic CRUD operations
 */
export function expectCRUDOperations(logOutput: string): void {
  const requiredOperations = [
    'Getting all', // GET operations
    'Creating', // CREATE operations
    'Getting specific', // GET by ID
    'Updating', // UPDATE operations
  ];

  for (const operation of requiredOperations) {
    if (!logOutput.includes(operation)) {
      throw new Error(`Expected to find "${operation}" in log output`);
    }
  }
}

/**
 * Verifies that the example demonstrates conceptual fjell-client-api patterns
 */
export function expectClientApiPatterns(logOutput: string): void {
  const requiredPatterns = [
    'Client-API', // Title should mention client API
    'HTTP endpoints', // Should mention HTTP
    'API operations', // Should mention API operations
  ];

  for (const pattern of requiredPatterns) {
    if (!logOutput.includes(pattern)) {
      throw new Error(`Expected to find "${pattern}" in log output`);
    }
  }
}

/**
 * Verifies that primary item operations are demonstrated
 */
export function expectPrimaryItemOperations(logOutput: string): void {
  const primaryItemPatterns = [
    'Primary Item Operations',
    'PItemApi', // Should mention primary item API
    'independent entities' // Should explain concept
  ];

  for (const pattern of primaryItemPatterns) {
    if (!logOutput.includes(pattern)) {
      throw new Error(`Expected to find primary item pattern "${pattern}" in log output`);
    }
  }
}

/**
 * Verifies that contained item operations are demonstrated
 */
export function expectContainedItemOperations(logOutput: string): void {
  const containedItemPatterns = [
    'Contained Item Operations',
    'CItemApi', // Should mention contained item API
    'hierarchical', // Should explain concept
    'location' // Should mention location context
  ];

  for (const pattern of containedItemPatterns) {
    if (!logOutput.includes(pattern)) {
      throw new Error(`Expected to find contained item pattern "${pattern}" in log output`);
    }
  }
}

/**
 * Verifies that hierarchical operations are demonstrated
 */
export function expectHierarchicalOperations(logOutput: string): void {
  const hierarchicalPatterns = [
    'Organization',
    'Department',
    'Employee',
    'Multi-level',
    'Level 0', 'Level 1', 'Level 2' // Should show different levels
  ];

  for (const pattern of hierarchicalPatterns) {
    if (!logOutput.includes(pattern)) {
      throw new Error(`Expected to find hierarchical pattern "${pattern}" in log output`);
    }
  }
}

/**
 * Verifies that enterprise workflow patterns are demonstrated
 */
export function expectEnterpriseWorkflows(logOutput: string): void {
  const enterprisePatterns = [
    'Customer Management',
    'Product',
    'Order',
    'Support',
    'Business Intelligence',
    'workflow',
    'analytics'
  ];

  for (const pattern of enterprisePatterns) {
    if (!logOutput.includes(pattern)) {
      throw new Error(`Expected to find enterprise pattern "${pattern}" in log output`);
    }
  }
}

/**
 * Verifies that actions and facets are demonstrated
 */
export function expectActionsAndFacets(logOutput: string): void {
  const actionFacetPatterns = [
    'action', // Should execute actions
    'facet', // Should query facets
    'analytics', // Should get analytics
    'Executing action',
    'Getting.*analytics'
  ];

  for (const pattern of actionFacetPatterns) {
    const regex = new RegExp(pattern, 'i');
    if (!regex.test(logOutput)) {
      throw new Error(`Expected to find action/facet pattern "${pattern}" in log output`);
    }
  }
}

/**
 * Verifies that business logic patterns are demonstrated
 */
export function expectBusinessLogicPatterns(logOutput: string): void {
  const businessPatterns = [
    'business',
    'workflow',
    'process',
    'management'
  ];

  for (const pattern of businessPatterns) {
    if (!logOutput.includes(pattern)) {
      throw new Error(`Expected to find business logic pattern "${pattern}" in log output`);
    }
  }
}

// ===== Example Execution Helpers =====

/**
 * Times the execution of an example function
 */
export async function timeExecution<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  const duration = endTime - startTime;

  return { result, duration };
}

/**
 * Verifies that an example completes within a reasonable time
 */
export function expectReasonableExecutionTime(duration: number, maxMs: number = 5000): void {
  if (duration > maxMs) {
    throw new Error(`Example took too long to execute: ${duration}ms (max: ${maxMs}ms)`);
  }
}

/**
 * Verifies that an example produces a minimum amount of output
 */
export function expectMinimumOutput(logOutput: string, minLines: number = 10): void {
  const lines = logOutput.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < minLines) {
    throw new Error(`Expected at least ${minLines} lines of output, but got ${lines.length}`);
  }
}

/**
 * Verifies that an example shows completion message
 */
export function expectSuccessfulCompletion(logOutput: string): void {
  const completionPatterns = [
    'completed successfully',
    '✅',
    'example completed'
  ];

  const hasCompletion = completionPatterns.some(pattern =>
    logOutput.includes(pattern)
  );

  if (!hasCompletion) {
    throw new Error('Expected to find completion message in log output');
  }
}

/**
 * Verifies that an example shows key concepts
 */
export function expectKeyConceptsListed(logOutput: string): void {
  const conceptsPattern = /Key Concepts.*:|Concepts.*Demonstrated/i;
  if (!conceptsPattern.test(logOutput)) {
    throw new Error('Expected to find "Key Concepts" section in log output');
  }
}

// ===== API Pattern Verification =====

/**
 * Verifies that HTTP API patterns are demonstrated
 */
export function expectHttpApiPatterns(logOutput: string): void {
  const httpPatterns = [
    'HTTP',
    'endpoint',
    'API',
    'http://localhost', // Mock API URLs
    'baseUrl'
  ];

  for (const pattern of httpPatterns) {
    if (!logOutput.includes(pattern)) {
      throw new Error(`Expected to find HTTP API pattern "${pattern}" in log output`);
    }
  }
}

/**
 * Verifies that authentication patterns are mentioned
 */
export function expectAuthenticationPatterns(logOutput: string): void {
  const authPatterns = [
    'Authorization',
    'Bearer',
    'token',
    'authenticate'
  ];

  const hasAuth = authPatterns.some(pattern =>
    logOutput.toLowerCase().includes(pattern.toLowerCase())
  );

  if (!hasAuth) {
    throw new Error('Expected to find authentication patterns in log output');
  }
}

/**
 * Verifies that error handling is demonstrated
 */
export function expectErrorHandling(logOutput: string): void {
  const errorPatterns = [
    'try',
    'catch',
    'error',
    'Error handling'
  ];

  const hasErrorHandling = errorPatterns.some(pattern =>
    logOutput.toLowerCase().includes(pattern.toLowerCase())
  );

  if (!hasErrorHandling) {
    throw new Error('Expected to find error handling patterns in log output');
  }
}

// ===== Advanced Pattern Verification =====

/**
 * Verifies that location-based operations are demonstrated
 */
export function expectLocationBasedOperations(logOutput: string): void {
  const locationPatterns = [
    'location',
    'path',
    'contained',
    'parent'
  ];

  for (const pattern of locationPatterns) {
    if (!logOutput.toLowerCase().includes(pattern.toLowerCase())) {
      throw new Error(`Expected to find location pattern "${pattern}" in log output`);
    }
  }
}

/**
 * Verifies that analytics and metrics are demonstrated
 */
export function expectAnalyticsAndMetrics(logOutput: string): void {
  const analyticsPatterns = [
    'analytics',
    'metrics',
    'stats',
    'performance',
    'report'
  ];

  for (const pattern of analyticsPatterns) {
    if (!logOutput.toLowerCase().includes(pattern.toLowerCase())) {
      throw new Error(`Expected to find analytics pattern "${pattern}" in log output`);
    }
  }
}

/**
 * Verifies that mock API behavior is demonstrated
 */
export function expectMockApiBehavior(logOutput: string): void {
  const mockPatterns = [
    'Mock',
    'conceptual',
    'demonstration',
    'simulated'
  ];

  const hasMockBehavior = mockPatterns.some(pattern =>
    logOutput.toLowerCase().includes(pattern.toLowerCase())
  );

  if (!hasMockBehavior) {
    throw new Error('Expected to find mock API behavior indicators in log output');
  }
}

// ===== Test Execution Utilities =====

/**
 * Creates a test wrapper that captures console output and measures execution time
 */
export function createTestWrapper<T>(
  exampleFn: () => Promise<T>,
  validationFn?: (logOutput: string, result: T, duration: number) => void
) {
  return async (): Promise<{ result: T; logOutput: string; duration: number }> => {
    const capture = setupConsoleCapture();

    try {
      const { result, duration } = await timeExecution(exampleFn);
      const logOutput = getLogOutput(capture);

      // Verify no errors occurred
      expectNoErrors(capture);

      // Run custom validation if provided
      if (validationFn) {
        validationFn(logOutput, result, duration);
      }

      return { result, logOutput, duration };
    } finally {
      restoreConsole(capture);
    }
  };
}
