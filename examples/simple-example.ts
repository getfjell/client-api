/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Simple Fjell-Client-API Example - Basic Client API Operations
 *
 * This example demonstrates the conceptual usage of fjell-client-api for HTTP-based
 * data operations. It shows the patterns and API design for client-side operations.
 *
 * This is a conceptual guide showing:
 * - How to create and configure client APIs (PItemApi and CItemApi)
 * - Basic CRUD operations through HTTP endpoints
 * - Primary and contained item patterns
 * - Error handling and response management
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

// Mock implementation that logs operations
const createMockPItemApi = (itemType: string): MockPItemApi => ({
  async all(query: any) {
    console.log(`📊 PItemApi.all(${itemType}) - query:`, query);
    return [
      { id: '1', name: 'Item 1', keyType: itemType },
      { id: '2', name: 'Item 2', keyType: itemType }
    ];
  },

  async create(item: any) {
    const created = { ...item, id: `${itemType}-${Date.now()}` };
    console.log(`➕ PItemApi.create(${itemType}) - created:`, created.id);
    return created;
  },

  async get(key: any) {
    console.log(`🔍 PItemApi.get(${itemType}) - key:`, key);
    return { id: key.id, name: `${itemType} ${key.id}`, keyType: itemType };
  },

  async update(key: any, updates: any) {
    console.log(`✏️ PItemApi.update(${itemType}) - key:`, key, 'updates:', updates);
    return { id: key.id, ...updates, keyType: itemType };
  },

  async remove(key: any) {
    console.log(`🗑️ PItemApi.remove(${itemType}) - key:`, key);
    return true;
  },

  async action(key: any, action: string, body?: any) {
    console.log(`⚡ PItemApi.action(${itemType}) - action:`, action, 'on:', key.id);
    return { success: true, action, result: body };
  },

  async find(finder: string, params?: any) {
    console.log(`🔍 PItemApi.find(${itemType}) - finder:`, finder, 'params:', params);
    return [{ id: '1', name: 'Found Item', keyType: itemType }];
  },

  async facet(key: any, facet: string, params?: any) {
    console.log(`📈 PItemApi.facet(${itemType}) - facet:`, facet, 'on:', key.id);
    return { facet, data: { count: 42, stats: 'mock data' } };
  },

  async allAction(action: string, body?: any) {
    console.log(`📦 PItemApi.allAction(${itemType}) - action:`, action);
    return [{ id: '1', result: 'updated' }, { id: '2', result: 'updated' }];
  },

  async allFacet(facet: string, params?: any) {
    console.log(`📊 PItemApi.allFacet(${itemType}) - facet:`, facet);
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

    console.log('\n✅ Simple example completed successfully!');
    console.log('\nKey Concepts Demonstrated:');
    console.log('• Primary Item API (PItemApi) for independent entities');
    console.log('• Contained Item API (CItemApi) for hierarchical data');
    console.log('• CRUD operations through HTTP endpoints');
    console.log('• Actions and facets for business logic');
    console.log('• Query patterns and finders');
    console.log('• Error handling and response management');
    console.log('\nNote: This is a conceptual example showing API patterns.');
    console.log('In production, use actual fjell-client-api with proper types.');

  } catch (error) {
    console.error('❌ Example failed:', error);
    throw error;
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSimpleExample().catch(console.error);
}
