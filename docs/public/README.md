# Fjell Client API

A comprehensive HTTP client library for the Fjell ecosystem. The Client API provides powerful abstractions for HTTP-based data operations, making it easy to build robust client applications that consume REST APIs.

## Installation

```bash
npm install @fjell/client-api
```

## Quick Start

```typescript
import { createPItemApi, createCItemApi } from '@fjell/client-api'

// Configure API endpoints
const apiConfig = {
  baseUrl: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' }
}

// Create Primary Item API (independent entities)
const userApi = createPItemApi<User, 'user'>('user', ['users'], apiConfig)

// Create Contained Item API (hierarchical entities)
const taskApi = createCItemApi<Task, 'task', 'user'>('task', ['users', 'tasks'], apiConfig)

// Basic operations
const users = await userApi.all(query)
const user = await userApi.create(userData)
const tasks = await taskApi.all(query, [userId]) // Location-based query
```

## Key Features

- **HTTP-based Operations**: Complete CRUD operations over HTTP
- **Type-safe APIs**: Full TypeScript support with generic type parameters
- **Hierarchical Data**: Support for nested resource relationships
- **Business Logic**: Actions and facets for complex operations
- **Authentication**: Built-in support for various auth patterns
- **Error Handling**: Comprehensive error handling and retry logic

## Architecture

The Client API is built around two main concepts:

### Primary Items (PItemApi)
Independent entities that exist at the top level of your API hierarchy. These represent resources that don't require parent context, such as Users, Products, or Organizations.

### Contained Items (CItemApi)
Entities that belong to parent resources and require location context. These represent hierarchical data like Tasks within Projects, OrderItems within Orders, or Comments within Posts.

This design mirrors RESTful API patterns while providing powerful abstractions for complex business operations.

## Core Concepts

### API Configuration
Configure your client with base URLs, authentication headers, and other options:

```typescript
const config = {
  baseUrl: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  timeout: 5000
}
```

### Primary Item API
For independent resources:

```typescript
const userApi = createPItemApi<User, 'user'>('user', ['users'], config)

// CRUD operations
const users = await userApi.all()
const user = await userApi.get(userKey)
const newUser = await userApi.create({ name: 'John', email: 'john@example.com' })
const updatedUser = await userApi.update(userKey, { name: 'John Smith' })
await userApi.remove(userKey)
```

### Contained Item API
For hierarchical resources:

```typescript
const taskApi = createCItemApi<Task, 'task', 'user'>('task', ['users', 'tasks'], config)

// Operations with location context
const userTasks = await taskApi.all({}, [userId])
const task = await taskApi.get(taskKey)
const newTask = await taskApi.create({ title: 'Complete project' }, [userId])
```

### Actions and Facets
Execute business logic and retrieve analytics:

```typescript
// Actions - execute business operations
await userApi.action(userKey, 'activate', { reason: 'manual activation' })
await taskApi.action(taskKey, 'complete', { completedAt: new Date() })

// Facets - retrieve computed data and analytics
const userStats = await userApi.facet(userKey, 'activity-stats')
const taskMetrics = await taskApi.allFacet('completion-metrics', { period: 'monthly' })
```

## Examples

See the `/examples` directory for comprehensive usage patterns:

- **Simple Example**: Basic CRUD operations and client setup
- **Multi-Level Keys**: Complex hierarchical data with nested relationships
- **Enterprise Example**: Complete business application with e-commerce workflows

## TypeScript Support

The Client API is built with TypeScript-first design, providing:

- Full type safety for API operations
- Generic type parameters for custom data models
- Compile-time validation of API method signatures
- IntelliSense support for better developer experience

## Error Handling

Built-in error handling with detailed error information:

```typescript
try {
  const user = await userApi.get(userKey)
} catch (error) {
  console.error('API error:', error.message)
  // Handle specific error types
  if (error.status === 404) {
    // Handle not found
  } else if (error.status === 401) {
    // Handle authentication error
  }
}
```

## Advanced Features

### Authentication
Support for various authentication patterns including Bearer tokens, API keys, and custom headers.

### Request Configuration
Fine-tune requests with timeout settings, retry logic, and custom middleware.

### Response Processing
Automatic response parsing and error handling for consistent API interactions.

### Location-based Operations
Powerful location context system for hierarchical data operations.

## Contributing

This library is part of the Fjell ecosystem. For contributing guidelines and development setup, please refer to the main Fjell documentation.

## License

Licensed under Apache-2.0. See LICENSE file for details.
