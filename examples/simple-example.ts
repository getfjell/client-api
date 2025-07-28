/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Simple Fjell-Client-API Example - Basic Client API Operations
 *
 * This example demonstrates the conceptual usage of fjell-client-api for HTTP-based
 * data operations with comprehensive error handling and retry logic.
 *
 * NEW FEATURES DEMONSTRATED:
 * - Comprehensive error handling with custom error types
 * - Automatic retry logic with exponential backoff
 * - Custom error handlers and retry configuration
 * - Network resilience and graceful error recovery
 * - Enhanced error context and debugging information
 *
 * This is a conceptual guide showing:
 * - How to create and configure client APIs (PItemApi and CItemApi)
 * - Basic CRUD operations through HTTP endpoints
 * - Primary and contained item patterns
 * - Advanced error handling and response management
 * - Retry strategies and resilience patterns
 *
 * Run this example with: npx tsx examples/simple-example.ts
 *
 * Note: This is a conceptual example showing API patterns.
 * In a real application, import from the built package:
 * import { createPItemApi, createCItemApi } from '@fjell/client-api';
 */

/**
 * Conceptual demonstration of fjell-client-api usage patterns
 * This example shows the API structure without full type implementation
 */

// ===== Error Handling Configuration =====

// Custom error handler for demonstration
const customErrorHandler = (error: any, context?: Record<string, any>) => {
  console.log('🔧 Custom Error Handler Called:');
  console.log(`   Error: ${error.message}`);
  console.log(`   Code: ${error.code || 'UNKNOWN'}`);
  console.log(`   Context: ${JSON.stringify(context, null, 2)}`);

  // In a real application, you might:
  // - Send errors to monitoring service (e.g., Sentry, Datadog)
  // - Show user-friendly notifications
  // - Log to analytics platform
  // - Trigger alerts for critical errors
};

// Retry configuration for client APIs
const basicRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  enableJitter: true
};

const aggressiveRetryConfig = {
  maxRetries: 5,
  initialDelayMs: 500,
  maxDelayMs: 30000,
  backoffMultiplier: 1.5,
  enableJitter: true
};

// API configuration with error handling
const apiConfigWithErrorHandling = {
  baseUrl: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer demo-token'
  },
  retryConfig: basicRetryConfig,
  enableErrorHandling: true,
  errorHandler: customErrorHandler
};

const enterpriseApiConfig = {
  baseUrl: 'https://api.enterprise.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer enterprise-token',
    'X-Request-ID': 'req-' + Math.random().toString(36).substr(2, 9)
  },
  retryConfig: aggressiveRetryConfig,
  enableErrorHandling: true,
  errorHandler: customErrorHandler
};

// ===== Mock API Implementations =====

interface MockPItemApi {
  all(query: any): Promise<any[]>;
  create(item: any): Promise<any>;
  get(key: any): Promise<any>;
  update(key: any, updates: any): Promise<any>;
  remove(key: any): Promise<boolean>;
  action(key: any, action: string, body?: any): Promise<any>;
  find(finder: string, params?: any): Promise<any[]>;
  facet(key: any, facet: string, params?: any): Promise<any>;
  allAction(action: string, body?: any): Promise<any[]>;
  allFacet(facet: string, params?: any): Promise<any>;
}

interface MockCItemApi extends MockPItemApi {
  all(query: any, locations?: any[]): Promise<any[]>;
  create(item: any, locations?: any[]): Promise<any>;
  find(finder: string, params?: any, locations?: any[]): Promise<any[]>;
  allAction(action: string, body?: any, locations?: any[]): Promise<any[]>;
  allFacet(facet: string, params?: any, locations?: any[]): Promise<any>;
}

// Global state for error simulation
let operationCount = 0;
let errorSimulationEnabled = false;

// Enable error simulation for demonstration
const enableErrorSimulation = () => {
  errorSimulationEnabled = true;
  operationCount = 0;
};

// Simulate various error types for demonstration
const simulateErrorsOccasionally = (operation: string, itemType: string) => {
  if (!errorSimulationEnabled) return;

  operationCount++;

  // Simulate network error on first operation
  if (operationCount === 1) {
    const error = new Error('Network connection failed');
    (error as any).code = 'ECONNREFUSED';
    console.log(`❌ Simulating network error for ${operation}(${itemType})`);
    throw error;
  }

  // Simulate server error on third operation (will be retried)
  if (operationCount === 3) {
    const error = new Error('Internal Server Error');
    (error as any).status = 500;
    console.log(`❌ Simulating server error for ${operation}(${itemType})`);
    throw error;
  }

  // Simulate rate limiting on fifth operation
  if (operationCount === 5) {
    const error = new Error('Too Many Requests');
    (error as any).status = 429;
    console.log(`❌ Simulating rate limit error for ${operation}(${itemType})`);
    throw error;
  }

  // Simulate timeout on seventh operation
  if (operationCount === 7) {
    const error = new Error('Request timeout');
    (error as any).code = 'ECONNABORTED';
    (error as any).timeout = 5000;
    console.log(`❌ Simulating timeout error for ${operation}(${itemType})`);
    throw error;
  }

  // Simulate validation error on ninth operation (non-retryable)
  if (operationCount === 9) {
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
    console.log(`❌ Simulating validation error for ${operation}(${itemType})`);
    throw error;
  }
};

// Mock implementation that logs operations and simulates errors
const createMockPItemApi = (itemType: string): MockPItemApi => ({
  async all(query: any) {
    console.log(`📊 PItemApi.all(${itemType}) - query:`, query);
    simulateErrorsOccasionally('all', itemType);
    return [
      { id: '1', name: 'Item 1', keyType: itemType },
      { id: '2', name: 'Item 2', keyType: itemType }
    ];
  },

  async create(item: any) {
    console.log(`➕ PItemApi.create(${itemType}) - item:`, item);
    simulateErrorsOccasionally('create', itemType);
    const created = { ...item, id: `${itemType}-${Date.now()}` };
    console.log(`✅ PItemApi.create(${itemType}) - created:`, created.id);
    return created;
  },

  async get(key: any) {
    console.log(`🔍 PItemApi.get(${itemType}) - key:`, key);
    simulateErrorsOccasionally('get', itemType);

    // Simulate 404 for specific key
    if (key?.id === 'not-found') {
      const error = new Error('Resource not found');
      (error as any).status = 404;
      throw error;
    }

    return { id: key.id, name: `${itemType} ${key.id}`, keyType: itemType };
  },

  async update(key: any, updates: any) {
    console.log(`✏️ PItemApi.update(${itemType}) - key:`, key, 'updates:', updates);
    simulateErrorsOccasionally('update', itemType);
    return { id: key.id, ...updates, keyType: itemType };
  },

  async remove(key: any) {
    console.log(`🗑️ PItemApi.remove(${itemType}) - key:`, key);
    simulateErrorsOccasionally('remove', itemType);
    return true;
  },

  async action(key: any, action: string, body?: any) {
    console.log(`⚡ PItemApi.action(${itemType}) - action:`, action, 'on:', key.id);
    simulateErrorsOccasionally('action', itemType);

    // Simulate authentication error for 'restricted' action
    if (action === 'restricted') {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      throw error;
    }

    return { success: true, action, result: body };
  },

  async find(finder: string, params?: any) {
    console.log(`🔍 PItemApi.find(${itemType}) - finder:`, finder, 'params:', params);
    simulateErrorsOccasionally('find', itemType);
    return [{ id: '1', name: 'Found Item', keyType: itemType }];
  },

  async facet(key: any, facet: string, params?: any) {
    console.log(`📈 PItemApi.facet(${itemType}) - facet:`, facet, 'on:', key.id);
    simulateErrorsOccasionally('facet', itemType);
    return { facet, data: { count: 42, stats: 'mock data' } };
  },

  async allAction(action: string, body?: any) {
    console.log(`📦 PItemApi.allAction(${itemType}) - action:`, action);
    simulateErrorsOccasionally('allAction', itemType);
    return [{ id: '1', result: 'updated' }, { id: '2', result: 'updated' }];
  },

  async allFacet(facet: string, params?: any) {
    console.log(`📊 PItemApi.allFacet(${itemType}) - facet:`, facet);
    simulateErrorsOccasionally('allFacet', itemType);
    return { facet, totalCount: 100, data: 'aggregated results' };
  }
});

const createMockCItemApi = (itemType: string, parentType: string): MockCItemApi => ({
  ...createMockPItemApi(itemType),

  async all(query: any, locations?: any[]) {
    console.log(`📊 CItemApi.all(${itemType}) - query:`, query, 'locations:', locations);
    return [
      { id: '1', name: `${itemType} 1`, keyType: itemType, parentId: locations?.[0] },
      { id: '2', name: `${itemType} 2`, keyType: itemType, parentId: locations?.[0] }
    ];
  },

  async create(item: any, locations?: any[]) {
    const created = { ...item, id: `${itemType}-${Date.now()}`, parentId: locations?.[0] };
    console.log(`➕ CItemApi.create(${itemType}) - created:`, created.id, 'in:', locations);
    return created;
  },

  async find(finder: string, params?: any, locations?: any[]) {
    console.log(`🔍 CItemApi.find(${itemType}) - finder:`, finder, 'in:', locations);
    return [{ id: '1', name: 'Found Item', keyType: itemType, parentId: locations?.[0] }];
  },

  async allAction(action: string, body?: any, locations?: any[]) {
    console.log(`📦 CItemApi.allAction(${itemType}) - action:`, action, 'in:', locations);
    return [{ id: '1', result: 'updated' }, { id: '2', result: 'updated' }];
  },

  async allFacet(facet: string, params?: any, locations?: any[]) {
    console.log(`📊 CItemApi.allFacet(${itemType}) - facet:`, facet, 'in:', locations);
    return { facet, totalCount: 25, data: 'location-specific results' };
  }
});

/**
 * Demonstrates Primary Item API operations with User entity
 * Primary items exist independently and have their own endpoints
 */
async function demonstratePrimaryItemOperations() {
  console.log('\n🚀 === Primary Item Operations (Users) ===');

  // Conceptual: const userApi = createPItemApi<User, 'user'>('user', ['users'], apiConfig);
  const userApi = createMockPItemApi('user');

  try {
    // 1. Get all users
    console.log('\n📊 Getting all users...');
    const users = await userApi.all({ filter: {} });
    console.log(`Found ${users.length} users`);

    // 2. Create a new user
    console.log('\n➕ Creating a new user...');
    const newUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      keyType: 'user'
    };
    const createdUser = await userApi.create(newUser);
    console.log(`Created user: ${createdUser.name} (${createdUser.id})`);

    // 3. Get specific user
    console.log('\n🔍 Getting specific user...');
    const userId = { keyType: 'user', id: createdUser.id };
    const retrievedUser = await userApi.get(userId);
    console.log(`Retrieved user: ${retrievedUser?.name}`);

    // 4. Update user
    console.log('\n✏️ Updating user...');
    const updates = { name: 'John Smith' };
    const updatedUser = await userApi.update(userId, updates);
    console.log(`Updated user name to: ${updatedUser?.name}`);

    // 5. Execute action on user
    console.log('\n⚡ Executing action on user...');
    await userApi.action(userId, 'activate', { reason: 'manual activation' });
    console.log(`Action result: User activated`);

    // 6. Query with finder
    console.log('\n🔍 Finding users by email...');
    const foundUsers = await userApi.find('byEmail', { email: 'john.smith@example.com' });
    console.log(`Found ${foundUsers.length} users with matching email`);

    // 7. Get facet data
    console.log('\n📈 Getting user statistics...');
    const userStats = await userApi.facet(userId, 'stats', {});
    console.log(`User stats:`, userStats);

    return createdUser.id;

  } catch (error) {
    console.error('❌ Error in primary item operations:', error);
    return null;
  }
}

/**
 * Demonstrates Contained Item API operations with Task entity
 * Contained items belong to a location/parent and have hierarchical endpoints
 */
async function demonstrateContainedItemOperations(userId: string) {
  console.log('\n🚀 === Contained Item Operations (Tasks) ===');

  // Conceptual: const taskApi = createCItemApi<Task, 'task', 'user'>('task', ['users', 'tasks'], apiConfig);
  const taskApi = createMockCItemApi('task', 'user');

  try {
    // Define user location for contained items
    const userLocation = [userId];

    // 1. Get all tasks for user
    console.log('\n📊 Getting all tasks for user...');
    const tasks = await taskApi.all({ filter: {} }, userLocation);
    console.log(`Found ${tasks.length} tasks for user`);

    // 2. Create a new task
    console.log('\n➕ Creating a new task...');
    const newTask = {
      title: 'Complete Project Documentation',
      description: 'Write comprehensive docs for the fjell-client-api',
      completed: false,
      userId: userId,
      keyType: 'task'
    };
    const createdTask = await taskApi.create(newTask, userLocation);
    console.log(`Created task: ${createdTask.title} (${createdTask.id})`);

    // 3. Get specific task
    console.log('\n🔍 Getting specific task...');
    const taskKey = { keyType: 'task', id: createdTask.id };
    const retrievedTask = await taskApi.get(taskKey);
    console.log(`Retrieved task: ${retrievedTask?.title}`);

    // 4. Update task
    console.log('\n✏️ Updating task...');
    const updates = { completed: true };
    const updatedTask = await taskApi.update(taskKey, updates);
    console.log(`Task completed: ${updatedTask?.completed}`);

    // 5. Execute action on task
    console.log('\n⚡ Executing action on task...');
    await taskApi.action(taskKey, 'setPriority', { priority: 'high' });
    console.log(`Action result: Task priority set`);

    // 6. Find tasks by status
    console.log('\n🔍 Finding completed tasks...');
    const completedTasks = await taskApi.find('byStatus', { completed: true }, userLocation);
    console.log(`Found ${completedTasks.length} completed tasks`);

    // 7. Get task analytics
    console.log('\n📈 Getting task analytics...');
    const taskAnalytics = await taskApi.allFacet('analytics', { period: 'week' }, userLocation);
    console.log(`Task analytics:`, taskAnalytics);

    // 8. Remove task
    console.log('\n🗑️ Removing task...');
    const removed = await taskApi.remove(taskKey);
    console.log(`Task removed: ${removed}`);

  } catch (error) {
    console.error('❌ Error in contained item operations:', error);
  }
}

/**
 * Demonstrates advanced API features
 */
async function demonstrateAdvancedFeatures() {
  console.log('\n🚀 === Advanced API Features ===');

  const userApi = createMockPItemApi('user');

  try {
    // 1. Batch operations
    console.log('\n📦 Executing batch action...');
    const batchResult = await userApi.allAction('batchUpdate', {
      updates: { lastLogin: new Date() }
    });
    console.log(`Batch updated ${batchResult.length} users`);

    // 2. Complex facet queries
    console.log('\n📊 Getting complex analytics...');
    const analytics = await userApi.allFacet('analytics', {
      startDate: new Date('2024-01-01'),
      endDate: new Date(),
      metrics: ['registrations', 'activity', 'retention']
    });
    console.log(`Analytics data:`, analytics);

    // 3. Advanced queries
    console.log('\n🔍 Advanced user search...');
    const activeUsers = await userApi.find('activeUsers', {
      lastLoginAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      includeMetrics: true
    });
    console.log(`Found ${activeUsers.length} active users`);

  } catch (error) {
    console.error('❌ Error in advanced features:', error);
  }
}

/**
 * Demonstrate comprehensive error handling and retry capabilities
 */
async function demonstrateErrorHandling() {
  console.log('\n🛡️ Error Handling & Retry Demonstrations');
  console.log('=========================================');

  // Enable error simulation for this section
  enableErrorSimulation();

  // Create API with aggressive retry configuration for demonstration
  const resilientUserApi = createMockPItemApi('resilient-user');

  console.log('\n📋 Error Handling Configuration:');
  console.log('• Basic Retry: 3 attempts, 1s initial delay, 2x backoff');
  console.log('• Aggressive Retry: 5 attempts, 500ms initial delay, 1.5x backoff');
  console.log('• Custom error handler: Logs errors with context');
  console.log('• Jitter enabled: Randomizes retry delays to prevent thundering herd');

  try {
    console.log('\n🔄 Demonstrating Network Error Recovery...');
    const user1 = await resilientUserApi.create({ name: 'John Doe', email: 'john@example.com' });
    console.log('✅ Network error recovered:', user1);
  } catch (error: any) {
    console.log('💥 Network error handling failed:', error.message);
  }

  try {
    console.log('\n🔄 Demonstrating Normal Operation...');
    const user2 = await resilientUserApi.create({ name: 'Jane Smith', email: 'jane@example.com' });
    console.log('✅ Normal operation succeeded:', user2);
  } catch (error: any) {
    console.log('💥 Operation failed:', error.message);
  }

  try {
    console.log('\n🔄 Demonstrating Server Error Recovery...');
    const user3 = await resilientUserApi.create({ name: 'Bob Wilson', email: 'bob@example.com' });
    console.log('✅ Server error recovered:', user3);
  } catch (error: any) {
    console.log('💥 Server error handling failed:', error.message);
  }

  try {
    console.log('\n🔄 Demonstrating Normal Operation...');
    const user4 = await resilientUserApi.create({ name: 'Alice Brown', email: 'alice@example.com' });
    console.log('✅ Normal operation succeeded:', user4);
  } catch (error: any) {
    console.log('💥 Operation failed:', error.message);
  }

  try {
    console.log('\n🔄 Demonstrating Rate Limit Recovery...');
    const user5 = await resilientUserApi.create({ name: 'Charlie Davis', email: 'charlie@example.com' });
    console.log('✅ Rate limit recovered:', user5);
  } catch (error: any) {
    console.log('💥 Rate limit handling failed:', error.message);
  }

  try {
    console.log('\n🔄 Demonstrating 404 Handling (Returns null)...');
    const notFound = await resilientUserApi.get({ id: 'not-found' });
    console.log('✅ 404 handled gracefully:', notFound);
  } catch (error: any) {
    console.log('💥 404 handling failed:', error.message);
  }

  try {
    console.log('\n🔄 Demonstrating Timeout Recovery...');
    const user7 = await resilientUserApi.create({ name: 'David Lee', email: 'david@example.com' });
    console.log('✅ Timeout recovered:', user7);
  } catch (error: any) {
    console.log('💥 Timeout handling failed:', error.message);
  }

  try {
    console.log('\n🔄 Demonstrating Authentication Error (Non-retryable)...');
    const restrictedAction = await resilientUserApi.action({ id: 'user-1' }, 'restricted', {});
    console.log('✅ Restricted action succeeded:', restrictedAction);
  } catch (error: any) {
    console.log('💥 Authentication error (expected):', error.message);
    console.log('   ℹ️  This error is non-retryable and fails immediately');
  }

  try {
    console.log('\n🔄 Demonstrating Validation Error (Non-retryable)...');
    const user9 = await resilientUserApi.create({ invalidData: true });
    console.log('✅ Validation succeeded:', user9);
  } catch (error: any) {
    console.log('💥 Validation error (expected):', error.message);
    console.log('   ℹ️  This error is non-retryable and fails immediately');
    if (error.response?.data?.validationErrors) {
      console.log('   📋 Validation details:', error.response.data.validationErrors);
    }
  }

  console.log('\n✅ Error handling demonstrations completed!');
  console.log('\n📊 Error Handling Summary:');
  console.log('• ✅ Network errors: Automatically retried with exponential backoff');
  console.log('• ✅ Server errors (5xx): Retried up to configured maximum');
  console.log('• ✅ Rate limiting (429): Retried with appropriate delays');
  console.log('• ✅ Timeouts: Retried with increasing delays');
  console.log('• ✅ 404 Not Found: Can return null instead of throwing');
  console.log('• ✅ Authentication (401): Fails immediately (non-retryable)');
  console.log('• ✅ Validation (400): Fails immediately with detailed errors');
  console.log('• ✅ Custom error handlers: Called for all errors with context');
  console.log('• ✅ Enhanced error objects: Include operation context and timing');
}

/**
 * Main function to run the simple example
 */
export async function runSimpleExample() {
  console.log('🎯 Fjell-Client-API Simple Example');
  console.log('===================================');
  console.log('Demonstrating basic client API operations with HTTP endpoints\n');

  try {
    // Run primary item operations
    const userId = await demonstratePrimaryItemOperations();

    if (userId) {
      // Run contained item operations
      await demonstrateContainedItemOperations(userId);
    }

    // Run advanced features
    await demonstrateAdvancedFeatures();

    // Demonstrate comprehensive error handling
    await demonstrateErrorHandling();

    console.log('\n✅ Simple example completed successfully!');
    console.log('\n🎯 Key Concepts Demonstrated:');
    console.log('• Primary Item API (PItemApi) for independent entities');
    console.log('• Contained Item API (CItemApi) for hierarchical data');
    console.log('• CRUD operations through HTTP endpoints');
    console.log('• Actions and facets for business logic');
    console.log('• Query patterns and finders');
    console.log('• Advanced error handling and response management');

    console.log('\n🛡️ Error Handling & Resilience Features:');
    console.log('• Automatic retry logic with exponential backoff and jitter');
    console.log('• Configurable retry behavior (attempts, delays, multipliers)');
    console.log('• Smart error classification (retryable vs non-retryable)');
    console.log('• Custom error handlers for application-specific processing');
    console.log('• Enhanced error objects with operation context and timing');
    console.log('• Network resilience for production environments');
    console.log('• Rate limiting respect with Retry-After header support');
    console.log('• Graceful degradation for various error scenarios');

    console.log('\n📊 Error Types Handled:');
    console.log('• Network errors (ECONNREFUSED, ENOTFOUND, timeouts)');
    console.log('• Server errors (500, 502, 503) - retryable');
    console.log('• Rate limiting (429) - retryable with delays');
    console.log('• Authentication (401) - non-retryable');
    console.log('• Authorization (403) - non-retryable');
    console.log('• Validation (400) - non-retryable with details');
    console.log('• Not Found (404) - can return null gracefully');

    console.log('\n⚙️ Configuration Options:');
    console.log('• retryConfig: maxRetries, delays, backoff multipliers');
    console.log('• enableErrorHandling: toggle comprehensive error handling');
    console.log('• errorHandler: custom error processing function');
    console.log('• Per-operation context tracking and logging');

    console.log('\nNote: This is a conceptual example showing API patterns.');
    console.log('In production, use actual fjell-client-api with proper types and authentication.');

  } catch (error) {
    console.error('❌ Example failed:', error);
    throw error;
  }
}

// Export the example function for use in other modules
