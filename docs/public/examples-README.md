# Fjell-Client-API Examples

This directory contains examples demonstrating how to use fjell-client-api for HTTP-based data operations and client-side API management with different patterns and complexity levels.

## Examples

### 1. `simple-example.ts` ⭐ **Start Here!**
**Perfect for beginners!** Demonstrates the simplest way to use fjell-client-api for HTTP data operations:
- **Basic CRUD operations** - Create, Read, Update, Delete through HTTP endpoints
- **Primary and Contained APIs** - PItemApi for independent entities, CItemApi for hierarchical data
- **Client API configuration** - HTTP endpoints, authentication, and error handling
- **Actions and facets** - Business logic execution and analytics retrieval
- **🆕 Comprehensive Error Handling** - Automatic retry logic, custom error types, resilience patterns
- **🆕 Retry Configuration** - Exponential backoff, jitter, configurable retry behavior
- **🆕 Error Classification** - Smart detection of retryable vs non-retryable errors
- **🆕 Custom Error Handlers** - Application-specific error processing and monitoring

Great for understanding the fundamentals of fjell-client-api HTTP operations and modern error handling patterns.

### 2. `multi-level-keys.ts`
**Advanced hierarchical data models!** Demonstrates complex data structures with multi-level contained items:
- **Hierarchical models**: Organization → Department → Employee
- **Multi-level location keys**: Complex organizational structure management
- **Nested API routing**: `/organizations/{orgId}/departments/{deptId}/employees/{empId}`
- **Cross-hierarchy operations**: Complex queries spanning multiple organizational levels
- **Location-based analytics**: Department and employee-specific metrics and operations

Shows how fjell-client-api handles enterprise organizational data patterns with deep hierarchies.

### 3. `enterprise-example.ts` 🏗️ **Full Business Application**
**Complete enterprise e-commerce system!** Demonstrates advanced business application patterns:
- **Multiple interconnected entities**: Customer, Product, Order, OrderItem, SupportTicket, ProductReview
- **Business workflow automation**: Order fulfillment, support ticket resolution, inventory management
- **Advanced analytics facets**: Customer analytics, product performance, order metrics
- **Enterprise features**: Multi-tenant configuration, complex business logic, predictive analytics
- **Real business scenarios**: Complete e-commerce platform with customer lifecycle management
- **🆕 Enterprise Error Handling** - Production-grade resilience, monitoring integration, circuit breakers
- **🆕 Business Continuity** - Graceful degradation, fallback strategies, error recovery workflows

Perfect for understanding how to build complete enterprise applications with fjell-client-api.

### 4. `error-handling-example.ts` 🛡️ **Error Handling Deep Dive**
**Comprehensive error handling demonstration!** Shows all error handling capabilities in detail:
- **Error Type Demonstrations** - Network, server, authentication, validation, rate limiting errors
- **Retry Logic Showcase** - Exponential backoff, jitter, custom retry strategies
- **Error Recovery Patterns** - Graceful degradation, fallback mechanisms, circuit breaker patterns
- **Configuration Examples** - Basic and aggressive retry configs, custom error handlers
- **Real-world Scenarios** - Production error handling patterns and best practices
- **Monitoring Integration** - Error tracking, logging, alerting for enterprise environments

Essential for understanding how to build resilient, production-ready applications with fjell-client-api.

## Key Concepts Demonstrated

### Basic Client API Operations (simple-example.ts)
```typescript
// Import fjell-client-api functionality
import { createPItemApi, createCItemApi } from '@fjell/client-api';

// Configure API endpoints
const apiConfig = {
  baseUrl: 'http://localhost:3000/api',
  headers: { 'Authorization': 'Bearer token' }
};

// Create Primary Item API (independent entities)
const userApi = createPItemApi<User, 'user'>('user', ['users'], apiConfig);

// Create Contained Item API (hierarchical entities)
const taskApi = createCItemApi<Task, 'task', 'user'>('task', ['users', 'tasks'], apiConfig);

// Basic operations
const users = await userApi.all(query);
const user = await userApi.create(userData);
const tasks = await taskApi.all(query, [userId]); // Location-based query
```

### Hierarchical Data Management (multi-level-keys.ts)
```typescript
// Multi-level organizational structure
// Organization (Level 0) → Department (Level 1) → Employee (Level 2)

// Organization API (Primary Items)
const orgApi = createPItemApi<Organization, 'organization'>('organization', ['organizations'], config);

// Department API (Contained in Organization)
const deptApi = createCItemApi<Department, 'department', 'organization'>(
  'department',
  ['organizations', 'departments'],
  config
);

// Employee API (Contained in Department within Organization)
const empApi = createCItemApi<Employee, 'employee', 'organization', 'department'>(
  'employee',
  ['organizations', 'departments', 'employees'],
  config
);

// Multi-level operations
const orgLocation = [organizationId];
const deptLocation = [organizationId, departmentId];

await deptApi.all(query, orgLocation);           // All departments in org
await empApi.all(query, deptLocation);          // All employees in dept
```

### Enterprise Business Workflows (enterprise-example.ts)
```typescript
// Customer lifecycle management
const customerApi = createPItemApi<Customer, 'customer'>('customer', ['customers'], config);
const supportApi = createCItemApi<SupportTicket, 'supportTicket', 'customer'>(
  'supportTicket',
  ['customers', 'tickets'],
  config
);

// Business workflow example
// 1. Create customer
const customer = await customerApi.create(customerData);

// 2. Create support ticket for customer
const ticket = await supportApi.create(ticketData, [customer.id]);

// 3. Execute business actions
await supportApi.action(ticketKey, 'escalate-ticket', { reason: 'complex issue' });
await supportApi.action(ticketKey, 'resolve-ticket', { resolution: 'provided solution' });

// 4. Get business analytics
const customerMetrics = await customerApi.facet(customerKey, 'loyalty-metrics');
const supportAnalytics = await supportApi.allFacet('resolution-metrics', {}, [customer.id]);
```

## API Types and Patterns

### Primary Item API (PItemApi)
Used for independent entities that exist at the top level:
- **Endpoints**: `/entities/{id}`
- **Use cases**: Customers, Products, Orders, Organizations
- **Operations**: Standard CRUD + actions + facets
- **No location context required**

```typescript
interface PItemApi<V, S> {
  all(query: ItemQuery): Promise<V[]>;
  create(item: Partial<Item<S>>): Promise<V>;
  get(key: PriKey<S>): Promise<V>;
  update(key: PriKey<S>, updates: Partial<Item<S>>): Promise<V>;
  remove(key: PriKey<S>): Promise<boolean>;
  action(key: PriKey<S>, action: string, body?: any): Promise<any>;
  find(finder: string, params?: any): Promise<V[]>;
  facet(key: PriKey<S>, facet: string, params?: any): Promise<any>;
  allAction(action: string, body?: any): Promise<V[]>;
  allFacet(facet: string, params?: any): Promise<any>;
}
```

### Contained Item API (CItemApi)
Used for hierarchical entities that belong to parent locations:
- **Endpoints**: `/parents/{parentId}/entities/{id}`
- **Use cases**: Tasks (in Users), OrderItems (in Orders), Employees (in Departments)
- **Operations**: CRUD + actions + facets with location context
- **Requires location arrays for context**

```typescript
interface CItemApi<V, S, L1, L2, L3, L4, L5> extends ClientApi<V, S, L1, L2, L3, L4, L5> {
  all(query: ItemQuery, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<V[]>;
  create(item: Partial<Item<S>>, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<V>;
  find(finder: string, params?: any, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<V[]>;
  allAction(action: string, body?: any, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<V[]>;
  allFacet(facet: string, params?: any, locations?: LocKeyArray<L1, L2, L3, L4, L5>): Promise<any>;
}
```

## Business Logic Patterns

### Actions - Business Logic Execution
Actions execute business logic on entities or collections:

```typescript
// Single entity actions
await userApi.action(userKey, 'activate', { reason: 'manual activation' });
await orderApi.action(orderKey, 'fulfill-order', { warehouse: 'main' });
await ticketApi.action(ticketKey, 'escalate', { priority: 'urgent' });

// Batch actions on collections
await userApi.allAction('updatePreferences', { newsletter: true });
await productApi.allAction('applyDiscount', { percent: 10 });
await orderApi.allAction('expediteShipping', { method: 'express' });
```

### Facets - Analytics and Data Retrieval
Facets retrieve analytics, computed data, and business insights:

```typescript
// Entity-specific analytics
const userStats = await userApi.facet(userKey, 'purchase-history');
const productMetrics = await productApi.facet(productKey, 'performance-metrics');
const orderStatus = await orderApi.facet(orderKey, 'fulfillment-status');

// Aggregated analytics
const customerAnalytics = await customerApi.allFacet('revenue-analytics', { period: 'quarterly' });
const inventoryReport = await productApi.allFacet('inventory-analytics', { lowStock: true });
const salesMetrics = await orderApi.allFacet('sales-metrics', { region: 'north-america' });
```

## Configuration Patterns

### Basic Configuration
```typescript
const apiConfig = {
  baseUrl: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-token'
  },
  timeout: 5000
};
```

### Enterprise Configuration
```typescript
const enterpriseConfig = {
  baseUrl: 'https://api.enterprise.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer enterprise-token',
    'X-Tenant-ID': 'tenant-001',
    'X-Environment': 'production'
  },
  timeout: 10000,
  retries: 3,
  readAuthenticated: true,
  writeAuthenticated: true
};
```

## Error Handling Patterns

### Basic Error Handling
```typescript
try {
  const user = await userApi.get(userKey);
  if (!user) {
    console.log('User not found');
    return;
  }
  // Process user...
} catch (error) {
  console.error('API error:', error);
  // Handle specific error types
  if (error.status === 404) {
    // Handle not found
  } else if (error.status === 401) {
    // Handle authentication error
  }
}
```

### Enterprise Error Handling
```typescript
try {
  const result = await customerApi.action(customerKey, 'process-order', orderData);
  return result;
} catch (error) {
  // Log error with context
  console.error('Order processing failed:', {
    customerId: customerKey.id,
    error: error.message,
    timestamp: new Date()
  });

  // Implement retry logic for transient errors
  if (error.isRetryable) {
    return await retryOperation(() =>
      customerApi.action(customerKey, 'process-order', orderData)
    );
  }

  throw error;
}
```

## Testing Patterns

The examples include comprehensive integration tests in `tests/examples/` that demonstrate:

- **API operation testing** - Verifying CRUD operations work correctly
- **Business workflow testing** - Testing complete business processes
- **Error scenario testing** - Handling various error conditions
- **Performance testing** - Measuring API response times
- **Mock API testing** - Testing with mock backend services

### Running Tests
```bash
# Run all example tests
npm test -- tests/examples

# Run specific example tests
npm test -- tests/examples/simple-example.integration.test.ts
npm test -- tests/examples/multi-level-keys.integration.test.ts
npm test -- tests/examples/enterprise-example.integration.test.ts

# Run with coverage
npm run test:coverage -- tests/examples
```

## Real-World Usage

### When to Use PItemApi
- **Independent entities**: Users, Products, Orders, Organizations
- **Top-level resources**: Resources that don't belong to other entities
- **Simple CRUD needs**: Basic create, read, update, delete operations
- **Global operations**: Operations that span across the entire system

### When to Use CItemApi
- **Hierarchical data**: Tasks in Projects, OrderItems in Orders, Comments in Posts
- **Location-based operations**: Operations within specific parent contexts
- **Multi-tenant scenarios**: Data that belongs to specific tenants or organizations
- **Nested resources**: Resources that logically belong to parent resources

### Enterprise Considerations
- **Authentication**: Use proper bearer tokens or API keys
- **Rate limiting**: Implement client-side rate limiting for high-volume operations
- **Caching**: Cache frequently accessed data to reduce API calls
- **Monitoring**: Log API calls and performance metrics
- **Error recovery**: Implement retry logic and circuit breakers
- **Data validation**: Validate data before sending to API

## Running the Examples

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure TypeScript is available
npm install -g tsx
```

### Run Individual Examples
```bash
# Simple example (start here)
npx tsx examples/simple-example.ts

# Multi-level keys example
npx tsx examples/multi-level-keys.ts

# Enterprise example (most comprehensive)
npx tsx examples/enterprise-example.ts
```

### Run All Examples
```bash
# Run all examples in sequence
npx tsx -e "
import { runSimpleExample } from './examples/simple-example.js';
import { runMultiLevelKeysExample } from './examples/multi-level-keys.js';
import { runEnterpriseExample } from './examples/enterprise-example.js';
import { runErrorHandlingExample } from './examples/error-handling-example.js';

console.log('🚀 Running All Fjell-Client-API Examples\\n');

await runSimpleExample();
console.log('\\n' + '='.repeat(50) + '\\n');

await runMultiLevelKeysExample();
console.log('\\n' + '='.repeat(50) + '\\n');

await runEnterpriseExample();
console.log('\\n' + '='.repeat(50) + '\\n');

await runErrorHandlingExample();

console.log('\\n✅ All examples completed successfully!');
"
```

### Run Error Handling Example
```bash
# Run the comprehensive error handling demonstration
npx tsx examples/error-handling-example.ts
```

## Next Steps

After exploring these examples:

1. **Read the API Documentation** - Understand the full fjell-client-api specification
2. **Set up your HTTP backend** - Implement corresponding server endpoints
3. **Configure authentication** - Set up proper API authentication for your application
4. **Implement error handling** - Add comprehensive error handling for production use
5. **Add monitoring** - Implement logging and monitoring for API operations
6. **Write tests** - Create tests for your specific API usage patterns
7. **Optimize performance** - Add caching, pagination, and other performance optimizations

## Contributing

To add new examples or improve existing ones:

1. Create your example file in `examples/`
2. Add corresponding integration tests in `tests/examples/`
3. Update this README with documentation
4. Ensure examples follow the established patterns
5. Test thoroughly with both success and error scenarios

## Support

For questions about these examples or fjell-client-api usage:

- Check the main fjell-client-api documentation
- Review the integration tests for detailed usage patterns
- Look at the enterprise example for complex workflow patterns
- Examine the source code for specific API method signatures
