/**
 * Error Handling Example for fjell-client-api
 *
 * This example demonstrates the comprehensive error handling capabilities
 * including retry logic, custom error types, and graceful error recovery.
 */

// Mock API setup to simulate various error conditions
interface MockApi {
  httpGet: (url: string, options?: any) => Promise<any>;
  httpPost: (url: string, data?: any, options?: any) => Promise<any>;
  httpPut: (url: string, data?: any, options?: any) => Promise<any>;
  httpDelete: (url: string, options?: any) => Promise<any>;
}

// Simulate different types of errors for demonstration
let callCount = 0;
const mockApi: MockApi = {
  async httpGet(url: string) {
    callCount++;
    console.log(`[HTTP GET] Attempt ${callCount}: ${url}`);

    // Simulate different error scenarios
    if (url.includes('network-error')) {
      const error = new Error('Network connection failed');
      (error as any).code = 'ECONNREFUSED';
      throw error;
    }

    if (url.includes('server-error') && callCount < 3) {
      const error = new Error('Internal Server Error');
      (error as any).status = 500;
      throw error;
    }

    if (url.includes('not-found')) {
      const error = new Error('Resource not found');
      (error as any).status = 404;
      throw error;
    }

    if (url.includes('rate-limited') && callCount < 2) {
      const error = new Error('Too Many Requests');
      (error as any).status = 429;
      throw error;
    }

    if (url.includes('auth-error')) {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      throw error;
    }

    // Success case
    return {
      id: '123',
      name: 'Test Item',
      status: 'active',
      retrievedAt: new Date().toISOString()
    };
  },

  async httpPost(url: string, data?: any) {
    callCount++;
    console.log(`[HTTP POST] Attempt ${callCount}: ${url}`, data);

    if (url.includes('validation-error')) {
      const error = new Error('Validation failed');
      (error as any).status = 400;
      (error as any).response = {
        data: {
          message: 'Validation failed',
          validationErrors: [
            { field: 'name', message: 'Name is required' },
            { field: 'email', message: 'Invalid email format' }
          ]
        }
      };
      throw error;
    }

    if (url.includes('timeout') && callCount < 2) {
      const error = new Error('Request timeout');
      (error as any).code = 'ECONNABORTED';
      (error as any).timeout = 5000;
      throw error;
    }

    return {
      id: 'new-123',
      ...data,
      createdAt: new Date().toISOString()
    };
  },

  async httpPut(url: string, data?: any) {
    callCount++;
    console.log(`[HTTP PUT] Attempt ${callCount}: ${url}`, data);
    return { ...data, updatedAt: new Date().toISOString() };
  },

  async httpDelete(url: string) {
    callCount++;
    console.log(`[HTTP DELETE] Attempt ${callCount}: ${url}`);
    return { success: true };
  }
};

// Mock implementations of the error handling utilities
function shouldRetryError(error: any): boolean {
  if (error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ENETUNREACH' ||
    error.code === 'ECONNABORTED' ||
    error.message?.includes('timeout') ||
    error.message?.includes('network')) {
    return true;
  }

  if (error.status >= 500 || error.status === 429) {
    return true;
  }

  if (error.status >= 400 && error.status < 500 && error.status !== 429) {
    return false;
  }

  return true;
}

function calculateRetryDelay(attempt: number, config: any): number {
  const exponentialDelay = (config.initialDelayMs || 1000) * Math.pow(config.backoffMultiplier || 2, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs || 30000);
  const jitter = 0.5 + (Math.random() * 0.5);
  return Math.floor(cappedDelay * jitter);
}

function enhanceError(error: any, context: any): any {
  if (!error) return new Error('Unknown error occurred');
  if (error.context) return error;

  const enhancedError = new Error(error.message || 'HTTP operation failed');
  Object.assign(enhancedError, {
    code: error.code || error.status || 'UNKNOWN_ERROR',
    status: error.status,
    context,
    originalError: error
  });

  return enhancedError;
}

// Enhanced HTTP operation with comprehensive error handling
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  operationContext: Record<string, any>,
  retryConfig: any = {},
  specialErrorHandling?: (error: any) => T | null
): Promise<T> {
  const config = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    ...retryConfig
  };

  let lastError: any = null;
  const startTime = Date.now();

  console.log(`\n🚀 Starting ${operationName} operation...`);

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`   Attempt ${attempt + 1}/${config.maxRetries + 1}`);

      const result = await operation();

      if (attempt > 0) {
        console.log(`✅ ${operationName} succeeded after ${attempt} retries (${Date.now() - startTime}ms)`);
      } else {
        console.log(`✅ ${operationName} succeeded on first attempt`);
      }

      return result;
    } catch (error: any) {
      lastError = error;
      console.log(`   ❌ Attempt ${attempt + 1} failed: ${error.message} (${error.code || error.status || 'UNKNOWN'})`);

      // Handle special error cases
      if (specialErrorHandling) {
        const specialResult = specialErrorHandling(error);
        if (specialResult !== null && specialResult !== void 0) {
          console.log(`🔄 Special handling for error: returning ${specialResult}`);
          return specialResult as T;
        }
      }

      if (attempt === config.maxRetries) {
        break;
      }

      const isRetryable = shouldRetryError(error);
      if (!isRetryable) {
        console.log(`🚫 Error is not retryable, stopping attempts`);
        break;
      }

      const delay = calculateRetryDelay(attempt, config);
      console.log(`⏱️  Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  const finalError = enhanceError(lastError, operationContext);
  console.log(`💥 ${operationName} failed after ${config.maxRetries + 1} attempts (${Date.now() - startTime}ms)`);
  console.log(`   Final error: ${finalError.message}`);

  throw finalError;
}

// Example operations demonstrating different error scenarios
async function demonstrateSuccessfulRetry() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 DEMO: Successful Retry After Server Errors');
  console.log('='.repeat(60));

  callCount = 0; // Reset for this demo

  try {
    const result = await executeWithRetry(
      () => mockApi.httpGet('/api/items/server-error'),
      'GET /api/items/server-error',
      { url: '/api/items/server-error' }
    );

    console.log('📦 Result:', result);
  } catch (error: any) {
    console.log('💥 Final error:', error.message);
  }
}

async function demonstrateRateLimitHandling() {
  console.log('\n' + '='.repeat(60));
  console.log('⏳ DEMO: Rate Limit Handling');
  console.log('='.repeat(60));

  callCount = 0;

  try {
    const result = await executeWithRetry(
      () => mockApi.httpGet('/api/items/rate-limited'),
      'GET /api/items/rate-limited',
      { url: '/api/items/rate-limited' }
    );

    console.log('📦 Result:', result);
  } catch (error: any) {
    console.log('💥 Final error:', error.message);
  }
}

async function demonstrateNonRetryableError() {
  console.log('\n' + '='.repeat(60));
  console.log('🚫 DEMO: Non-Retryable Error (401 Auth)');
  console.log('='.repeat(60));

  callCount = 0;

  try {
    const result = await executeWithRetry(
      () => mockApi.httpGet('/api/items/auth-error'),
      'GET /api/items/auth-error',
      { url: '/api/items/auth-error' }
    );

    console.log('📦 Result:', result);
  } catch (error: any) {
    console.log('💥 Final error:', error.message);
  }
}

async function demonstrateNotFoundHandling() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 DEMO: 404 Handling (Returns null instead of throwing)');
  console.log('='.repeat(60));

  callCount = 0;

  try {
    const result = await executeWithRetry(
      () => mockApi.httpGet('/api/items/not-found'),
      'GET /api/items/not-found',
      { url: '/api/items/not-found' },
      {},
      (error: any) => error.status === 404 ? null : void 0 // Special handling for 404
    );

    console.log('📦 Result:', result);
  } catch (error: any) {
    console.log('💥 Final error:', error.message);
  }
}

async function demonstrateTimeoutRecovery() {
  console.log('\n' + '='.repeat(60));
  console.log('⏰ DEMO: Timeout Recovery');
  console.log('='.repeat(60));

  callCount = 0;

  try {
    const result = await executeWithRetry(
      () => mockApi.httpPost('/api/items/timeout', { name: 'Test Item' }),
      'POST /api/items/timeout',
      { url: '/api/items/timeout' }
    );

    console.log('📦 Result:', result);
  } catch (error: any) {
    console.log('💥 Final error:', error.message);
  }
}

async function demonstrateValidationError() {
  console.log('\n' + '='.repeat(60));
  console.log('✅ DEMO: Validation Error (Non-retryable)');
  console.log('='.repeat(60));

  callCount = 0;

  try {
    const result = await executeWithRetry(
      () => mockApi.httpPost('/api/items/validation-error', { invalidData: true }),
      'POST /api/items/validation-error',
      { url: '/api/items/validation-error' }
    );

    console.log('📦 Result:', result);
  } catch (error: any) {
    console.log('💥 Final error:', error.message);
    if (error.originalError?.response?.data?.validationErrors) {
      console.log('📋 Validation errors:', error.originalError.response.data.validationErrors);
    }
  }
}

async function demonstrateCustomRetryConfig() {
  console.log('\n' + '='.repeat(60));
  console.log('⚙️  DEMO: Custom Retry Configuration');
  console.log('='.repeat(60));

  callCount = 0;

  const customConfig = {
    maxRetries: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 1.5
  };

  try {
    const result = await executeWithRetry(
      () => mockApi.httpGet('/api/items/server-error'),
      'GET /api/items/server-error',
      { url: '/api/items/server-error' },
      customConfig
    );

    console.log('📦 Result:', result);
  } catch (error: any) {
    console.log('💥 Final error:', error.message);
  }
}

// Main execution function
export async function runErrorHandlingExample(): Promise<void> {
  console.log('🚀 Fjell Client API - Error Handling Examples');
  console.log('This demonstrates comprehensive error handling with retry logic, custom error types, and graceful recovery.');

  await demonstrateSuccessfulRetry();
  await demonstrateRateLimitHandling();
  await demonstrateNonRetryableError();
  await demonstrateNotFoundHandling();
  await demonstrateTimeoutRecovery();
  await demonstrateValidationError();
  await demonstrateCustomRetryConfig();

  console.log('\n' + '='.repeat(60));
  console.log('✅ Error Handling Examples Complete!');
  console.log('='.repeat(60));
  console.log('\n📚 Key Features Demonstrated:');
  console.log('• Automatic retry logic with exponential backoff');
  console.log('• Different retry strategies for different error types');
  console.log('• Graceful handling of network errors and timeouts');
  console.log('• Special handling for specific HTTP status codes');
  console.log('• Enhanced error objects with context information');
  console.log('• Configurable retry behavior');
  console.log('• Non-retryable error detection');
  console.log('• Custom error handling for special cases');
}

// Export the example function for use in other modules
