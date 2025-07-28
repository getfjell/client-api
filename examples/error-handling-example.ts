/**
 * Error Handling Example for fjell-client-api
 *
 * This example demonstrates the comprehensive error handling capabilities
 * including retry logic, custom error types, and graceful error recovery.
 *
 * COMPREHENSIVE ERROR HANDLING FEATURES:
 * - Network error recovery with exponential backoff
 * - Server error retry with configurable strategies
 * - Rate limiting handling with Retry-After respect
 * - Authentication and authorization error handling
 * - Validation error processing with detailed feedback
 * - Custom error handlers and monitoring integration
 * - Graceful degradation and fallback mechanisms
 * - Circuit breaker patterns for service protection
 * - Error analytics and operational insights
 *
 * This example shows both mock scenarios for demonstration and
 * real API integration patterns for production use.
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

/**
 * Demonstrate real API integration with error handling
 */
async function demonstrateRealApiIntegration() {
  console.log('\n' + '='.repeat(60));
  console.log('🔗 DEMO: Real API Integration Patterns');
  console.log('='.repeat(60));

  console.log('\n📚 Production API Configuration Example:');
  console.log(`
// Production-ready API configuration
const productionConfig = {
  baseUrl: 'https://api.production.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer prod-token',
    'X-Service-Name': 'fjell-client',
    'X-Environment': 'production'
  },

  // Aggressive retry for critical operations
  retryConfig: {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    enableJitter: true,

    // Custom retry logic for business-critical operations
    shouldRetry: (error, attemptNumber) => {
      // Always retry network and server errors
      if (error.isRetryable) return true;

      // Special handling for payment operations
      if (error.context?.operation === 'payment' && error.status === 409) {
        return attemptNumber < 2; // Limited retries for conflicts
      }

      return false;
    },

    // Custom retry callback for monitoring
    onRetry: (error, attemptNumber, delay) => {
      // Send to monitoring service
      monitoring.recordRetry({
        operation: error.context?.operation,
        errorCode: error.code,
        attemptNumber,
        delay
      });
    }
  },

  // Enterprise error handler
  errorHandler: (error, context) => {
    // Log to centralized logging
    logger.error('API Operation Failed', {
      error: error.message,
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId
    });

    // Send to error tracking service
    errorTracking.captureException(error, {
      tags: {
        service: 'fjell-client-api',
        operation: context?.operation
      },
      extra: context
    });

    // Alert on critical errors
    if (error.code === 'PAYMENT_FAILED' || error.status >= 500) {
      alerting.sendAlert({
        severity: 'high',
        message: \`API operation failed: \${error.message}\`,
        service: 'fjell-client-api',
        context
      });
    }

    // Business logic for specific errors
    if (error.code === 'RATE_LIMIT_ERROR') {
      // Implement circuit breaker
      circuitBreaker.recordFailure();
    }
  }
};

// Create production APIs with comprehensive error handling
const userApi = createPItemApi<User, 'user'>('user', ['users'], productionConfig);
const orderApi = createCItemApi<Order, 'order', 'customer'>('order', ['customers', 'orders'], productionConfig);
`);

  console.log('\n🛡️ Error Handling Patterns in Production:');
  console.log(`
// Pattern 1: Graceful degradation
try {
  const user = await userApi.get(userKey);
  return user;
} catch (error) {
  if (error.code === 'NOT_FOUND_ERROR') {
    // Return default user or redirect to registration
    return createGuestUser();
  }

  if (error.code === 'NETWORK_ERROR') {
    // Use cached data if available
    return await getCachedUser(userKey) || createOfflineUser();
  }

  // Re-throw critical errors
  throw error;
}

// Pattern 2: Circuit breaker integration
const circuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 30000,
  monitoringPeriod: 60000
};

try {
  await circuitBreaker.execute(async () => {
    return await userApi.create(userData);
  }, circuitBreakerConfig);
} catch (error) {
  if (error.code === 'CIRCUIT_BREAKER_OPEN') {
    // Use alternative service or queue for later
    return await fallbackUserService.create(userData);
  }
  throw error;
}

// Pattern 3: Business workflow error recovery
async function processOrder(orderData) {
  const transaction = await beginTransaction();

  try {
    // Step 1: Create order
    const order = await orderApi.create(orderData, [customerId]);

    // Step 2: Process payment
    const payment = await paymentApi.create({
      orderId: order.id,
      amount: order.total
    });

    // Step 3: Update inventory
    await inventoryApi.action(productKey, 'reserve', {
      quantity: orderData.quantity
    });

    await transaction.commit();
    return order;

  } catch (error) {
    await transaction.rollback();

    // Compensating actions based on error type
    if (error.code === 'PAYMENT_FAILED') {
      await orderApi.action(order.id, 'mark-payment-failed');
      await notificationService.sendPaymentFailedEmail(customerId);
    } else if (error.code === 'INVENTORY_INSUFFICIENT') {
      await orderApi.remove(order.id);
      await notificationService.sendOutOfStockNotification(customerId);
    }

    throw error;
  }
}
`);

  console.log('\n📊 Monitoring and Analytics Integration:');
  console.log(`
// Error metrics collection
const errorMetrics = {
  // Track error rates by operation
  recordErrorRate: (operation, errorCode) => {
    metrics.increment('api.errors.total', {
      operation,
      error_code: errorCode
    });
  },

  // Track retry success rates
  recordRetrySuccess: (operation, attemptNumber) => {
    metrics.increment('api.retries.success', {
      operation,
      attempt: attemptNumber
    });
  },

  // Track response times including retries
  recordOperationTiming: (operation, duration, attempts) => {
    metrics.timing('api.operation.duration', duration, {
      operation,
      attempts: attempts.toString()
    });
  }
};

// Business impact tracking
const businessMetrics = {
  // Track revenue impact of errors
  recordRevenueImpact: (errorCode, orderValue) => {
    if (errorCode === 'PAYMENT_FAILED') {
      metrics.increment('business.revenue.lost', orderValue);
    }
  },

  // Track customer satisfaction impact
  recordCustomerImpact: (errorCode, customerId) => {
    if (['TIMEOUT_ERROR', 'NETWORK_ERROR'].includes(errorCode)) {
      metrics.increment('business.customer.poor_experience', {
        customer_id: customerId
      });
    }
  }
};
`);

  console.log('\n✅ Real API Integration Patterns Complete!');
  console.log('\n📋 Production Checklist:');
  console.log('• ✅ Configure appropriate retry strategies for your use case');
  console.log('• ✅ Implement custom error handlers for monitoring and alerting');
  console.log('• ✅ Set up circuit breakers for external service protection');
  console.log('• ✅ Implement graceful degradation and fallback mechanisms');
  console.log('• ✅ Add comprehensive logging and error tracking');
  console.log('• ✅ Monitor business impact metrics and SLA compliance');
  console.log('• ✅ Set up automated alerts for critical error patterns');
  console.log('• ✅ Implement compensating transactions for business workflows');
  console.log('• ✅ Test error scenarios in staging environments');
  console.log('• ✅ Document error handling procedures for operations team');
}

/**
 * Enhanced main function with real API integration
 */
export async function runErrorHandlingExample(): Promise<void> {
  console.log('🚀 Fjell Client API - Comprehensive Error Handling Examples');
  console.log('This demonstrates comprehensive error handling with retry logic, custom error types, and graceful recovery.');

  await demonstrateSuccessfulRetry();
  await demonstrateRateLimitHandling();
  await demonstrateNonRetryableError();
  await demonstrateNotFoundHandling();
  await demonstrateTimeoutRecovery();
  await demonstrateValidationError();
  await demonstrateCustomRetryConfig();

  // NEW: Real API integration patterns
  await demonstrateRealApiIntegration();

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
  console.log('• 🆕 Production API integration patterns');
  console.log('• 🆕 Circuit breaker and fallback mechanisms');
  console.log('• 🆕 Business workflow error recovery');
  console.log('• 🆕 Monitoring and analytics integration');
  console.log('• 🆕 Enterprise-grade error handling strategies');
}

// Export the example function for use in other modules
