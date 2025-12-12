# API Reference

Complete reference for all Client API interfaces and methods.

## Core Interfaces

### PItemApi<V, S>

Primary Item API for independent entities that exist at the top level of your API hierarchy.

**Type Parameters:**
- `V` - The value type returned from API operations
- `S` - The string literal type representing the item type

#### Methods

##### `all(query?: ItemQuery): Promise<V[]>`
Retrieve all items matching the query criteria.

**Parameters:**
- `query` (optional) - Query parameters for filtering and pagination

**Returns:** Promise resolving to an array of items

**Example:**
```typescript
const users = await userApi.all({ limit: 10, offset: 0 })
```

##### `create(item: Partial<Item<S>>): Promise<V>`
Create a new item.

**Parameters:**
- `item` - Partial item data for creation

**Returns:** Promise resolving to the created item

**Example:**
```typescript
const user = await userApi.create({
  name: 'John Doe',
  email: 'john@example.com'
})
```

##### `get(key: PriKey<S>): Promise<V>`
Retrieve a specific item by its key.

**Parameters:**
- `key` - Primary key identifying the item

**Returns:** Promise resolving to the item

**Example:**
```typescript
const user = await userApi.get(userKey)
```

##### `update(key: PriKey<S>, updates: Partial<Item<S>>): Promise<V>`
Update an existing item.

**Parameters:**
- `key` - Primary key identifying the item
- `updates` - Partial updates to apply

**Returns:** Promise resolving to the updated item

**Example:**
```typescript
const updatedUser = await userApi.update(userKey, {
  name: 'John Smith'
})
```

##### `remove(key: PriKey<S>): Promise<boolean>`
Delete an item.

**Parameters:**
- `key` - Primary key identifying the item

**Returns:** Promise resolving to true if deletion was successful

**Example:**
```typescript
const deleted = await userApi.remove(userKey)
```

##### `action(key: PriKey<S>, action: string, body?: any): Promise<[V, Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]>`
Execute a business action on a specific item.

**Parameters:**
- `key` - Primary key identifying the item
- `action` - Name of the action to execute
- `body` (optional) - Action parameters

**Returns:** Promise resolving to a tuple containing:
- `[0]` - The primary action result (updated item or action response)
- `[1]` - Array of keys for other items that were affected by this action

**Example:**
```typescript
const [result, affectedItems] = await userApi.action(userKey, 'activate', { reason: 'manual activation' })
// result = the updated user or action response
// affectedItems = array of keys for other items affected (e.g., related orders, notifications, etc.)
```

##### `find(finder: string, params?: any): Promise<V[]>`
Execute a custom finder operation.

**Parameters:**
- `finder` - Name of the finder
- `params` (optional) - Finder parameters

**Returns:** Promise resolving to an array of found items

**Example:**
```typescript
const activeUsers = await userApi.find('active-users', { since: '2024-01-01' })
```

##### `facet(key: PriKey<S>, facet: string, params?: any): Promise<any>`
Retrieve computed data or analytics for a specific item.

**Parameters:**
- `key` - Primary key identifying the item
- `facet` - Name of the facet
- `params` (optional) - Facet parameters

**Returns:** Promise resolving to facet data

**Example:**
```typescript
const userStats = await userApi.facet(userKey, 'activity-stats')
```

##### `allAction(action: string, body?: any): Promise<[V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]>`
Execute a business action on all items or collections.

**Parameters:**
- `action` - Name of the action to execute
- `body` (optional) - Action parameters

**Returns:** Promise resolving to a tuple containing:
- `[0]` - Array of primary action results (updated items or action responses)
- `[1]` - Array of keys for other items that were affected by this action

**Example:**
```typescript
const [results, affectedItems] = await userApi.allAction('bulk-update', { status: 'active' })
// results = array of updated users or action responses
// affectedItems = array of keys for other items affected (e.g., related records, audit logs, etc.)
```

##### `allFacet(facet: string, params?: any): Promise<any>`
Retrieve computed data or analytics for collections.

**Parameters:**
- `facet` - Name of the facet
- `params` (optional) - Facet parameters

**Returns:** Promise resolving to facet data

**Example:**
```typescript
const userAnalytics = await userApi.allFacet('engagement-metrics', { period: 'monthly' })
```

### CItemApi<V, S, L1, L2, L3, L4, L5>

Contained Item API for hierarchical entities that belong to parent resources and require location context.

**Type Parameters:**
- `V` - The value type returned from API operations
- `S` - The string literal type representing the item type
- `L1, L2, L3, L4, L5` - Location hierarchy types (up to 5 levels)

**Extends:** All PItemApi methods plus location-aware variants

#### Location-Aware Methods

##### `all(query: ItemQuery, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<V[]>`
Retrieve all items within a specific location context.

**Parameters:**
- `query` - Query parameters
- `locations` (optional) - Array of location keys defining the context

**Returns:** Promise resolving to an array of items

**Example:**
```typescript
// Get all tasks for a specific user
const tasks = await taskApi.all({}, [userId])

// Get all employees in a specific department
const employees = await employeeApi.all({}, [orgId, deptId])
```

##### `create(item: Partial<Item<S>>, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<V>`
Create a new item within a specific location context.

**Parameters:**
- `item` - Partial item data for creation
- `locations` (optional) - Array of location keys defining the context

**Returns:** Promise resolving to the created item

**Example:**
```typescript
const task = await taskApi.create({
  title: 'Complete project'
}, [userId])
```

##### `find(finder: string, params?: any, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<V[]>`
Execute a custom finder within a location context.

##### `allAction(action: string, body?: any, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<[V[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>]>`
Execute actions on collections within a location context.

**Parameters:**
- `action` - Name of the action to execute
- `body` (optional) - Action parameters
- `locations` (optional) - Array of location keys defining the context

**Returns:** Promise resolving to a tuple containing:
- `[0]` - Array of primary action results (updated items or action responses)
- `[1]` - Array of keys for other items that were affected by this action

**Example:**
```typescript
const [results, affectedItems] = await taskApi.allAction('bulk-complete', { reason: 'project finished' }, [userId])
// results = array of updated tasks
// affectedItems = array of keys for other items affected (e.g., user stats, project milestones, etc.)
```

##### `allFacet(facet: string, params?: any, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<any>`
Retrieve analytics for collections within a location context.

**Parameters:**
- `facet` - Name of the facet
- `params` (optional) - Facet parameters
- `locations` (optional) - Array of location keys defining the context

**Returns:** Promise resolving to facet data

**Example:**
```typescript
const userAnalytics = await userApi.allFacet('engagement-metrics', { period: 'monthly' })
```

## Affected Items Feature

The Client API now supports tracking items that are affected as side effects of actions. This is particularly useful for complex business operations that may impact multiple entities across your system.

### Understanding Affected Items

When you execute an action or allAction, the API returns a tuple where:
- The first element contains the primary result (the item(s) you directly acted upon)
- The second element contains an array of keys for other items that were indirectly affected

### Use Cases

**Example 1: Order Phase Update**
```typescript
// When updating an order phase, you might also affect the parent order
const [updatedPhase, affectedItems] = await orderPhaseApi.action(phaseKey, 'complete', {})
// updatedPhase = the completed order phase
// affectedItems = [PriKey<'order'>(orderId)] - the parent order was also updated
```

**Example 2: Bulk User Activation**
```typescript
// When bulk-activating users, you might affect related records
const [activatedUsers, affectedItems] = await userApi.allAction('bulk-activate', { reason: 'campaign' })
// activatedUsers = array of activated users
// affectedItems = [
//   PriKey<'notification'>(notificationId),     // notification records created
//   ComKey<'audit', 'user'>(auditId, userId),  // audit logs created
//   PriKey<'campaign'>(campaignId)             // campaign status updated
// ]
```

### Working with Affected Items

```typescript
const [result, affectedItems] = await api.action(key, 'someAction', params)

// Check if any items were affected
if (affectedItems.length > 0) {
  console.log(`${affectedItems.length} items were affected by this action`)
  
  // Process each affected item type
  affectedItems.forEach(itemKey => {
    if (itemKey.kt === 'order') {
      // Handle affected order
      console.log('Order was affected:', itemKey.pk)
    } else if (itemKey.kt === 'notification') {
      // Handle affected notification
      console.log('Notification was affected:', itemKey.pk)
    }
  })
}
```

### Key Types in Affected Items

The affected items array can contain any combination of:

- **`PriKey<any>`** - Primary keys for any item type
- **`ComKey<any, any, any, any, any, any>`** - Composite keys for any item type
- **`LocKeyArray<any, any, any, any, any>`** - Location key arrays for any item type

This flexibility allows actions to signal effects on completely unrelated item types, giving you full visibility into the impact of your operations.

## Configuration

### ApiConfig

Configuration object for API instances.

```typescript
interface ApiConfig {
  baseUrl: string;
  headers?: { [key: string]: string };
  timeout?: number;
  retries?: number;
  readAuthenticated?: boolean;
  writeAuthenticated?: boolean;
}
```

**Properties:**
- `baseUrl` - Base URL for API endpoints
- `headers` (optional) - Default headers to include with requests
- `timeout` (optional) - Request timeout in milliseconds
- `retries` (optional) - Number of retry attempts for failed requests
- `readAuthenticated` (optional) - Whether read operations require authentication
- `writeAuthenticated` (optional) - Whether write operations require authentication

**Example:**
```typescript
const config: ApiConfig = {
  baseUrl: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  timeout: 5000,
  retries: 3,
  readAuthenticated: true,
  writeAuthenticated: true
}
```

## Factory Functions

### createPItemApi

Creates a Primary Item API instance.

```typescript
function createPItemApi<V, S extends string>(
  itemType: S,
  pathSegments: string[],
  config: ApiConfig
): PItemApi<V, S>
```

**Parameters:**
- `itemType` - String literal identifying the item type
- `pathSegments` - Array of path segments for API endpoints
- `config` - API configuration

**Example:**
```typescript
const userApi = createPItemApi<User, 'user'>('user', ['users'], config)
```

### createCItemApi

Creates a Contained Item API instance.

```typescript
function createCItemApi<V, S extends string, L1 extends string, L2 extends string = never, L3 extends string = never, L4 extends string = never, L5 extends string = never>(
  itemType: S,
  pathSegments: string[],
  config: ApiConfig
): CItemApi<V, S, L1, L2, L3, L4, L5>
```

**Parameters:**
- `itemType` - String literal identifying the item type
- `pathSegments` - Array of path segments for API endpoints (including parent segments)
- `config` - API configuration

**Example:**
```typescript
// Single-level containment
const taskApi = createCItemApi<Task, 'task', 'user'>('task', ['users', 'tasks'], config)

// Multi-level containment
const employeeApi = createCItemApi<Employee, 'employee', 'organization', 'department'>(
  'employee',
  ['organizations', 'departments', 'employees'],
  config
)
```

## Error Handling

The Client API provides comprehensive error handling with detailed error information.

### Error Types

- **NetworkError** - Network connectivity issues
- **AuthenticationError** - Authentication failures
- **AuthorizationError** - Authorization/permission issues
- **ValidationError** - Request validation failures
- **NotFoundError** - Resource not found
- **ServerError** - Server-side errors

### Error Handling Patterns

```typescript
try {
  const user = await userApi.get(userKey)
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('User not found')
  } else if (error instanceof AuthenticationError) {
    // Redirect to login
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    console.error('Validation errors:', error.details)
  } else {
    // Handle other errors
    console.error('API error:', error.message)
  }
}
```

## Best Practices

### 1. Type Safety
Always provide proper TypeScript types for your data models:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const userApi = createPItemApi<User, 'user'>('user', ['users'], config)
```

### 2. Error Handling
Implement comprehensive error handling:

```typescript
const createUser = async (userData: Partial<User>) => {
  try {
    return await userApi.create(userData)
  } catch (error) {
    // Log error and handle appropriately
    console.error('Failed to create user:', error)
    throw error
  }
}
```

### 3. Configuration Management
Use environment-specific configuration:

```typescript
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Authorization': `Bearer ${process.env.API_TOKEN}`
  }
}
```

### 4. Location Context
Always provide proper location context for contained items:

```typescript
// Good - specific location context
const userTasks = await taskApi.all({}, [userId])

// Avoid - missing location context may return unexpected results
const allTasks = await taskApi.all({})
```

### 5. Query Optimization
Use appropriate queries and pagination:

```typescript
const users = await userApi.all({
  limit: 50,
  offset: 0,
  sort: 'createdAt:desc',
  filter: 'status:active'
})
```
