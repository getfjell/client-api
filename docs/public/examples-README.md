# Fjell-Client-API Examples

This directory contains examples demonstrating how to use fjell-client-api for HTTP-based data operations and client-side API management with different patterns and complexity levels.

## Examples

### 1. `simple-example.ts` ⭐ **Start Here!**
**Perfect for beginners!** Demonstrates the simplest way to use fjell-client-api for HTTP data operations:
- **Basic CRUD operations** - Create, Read, Update, Delete through HTTP endpoints
- **Primary and Contained APIs** - PItemApi for independent entities, CItemApi for hierarchical data
- **Client API configuration** - HTTP endpoints, authentication, and error handling
- **Actions and facets** - Business logic execution and analytics retrieval

Great for understanding the fundamentals of fjell-client-api HTTP operations.

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

Perfect for understanding how to build complete enterprise applications with fjell-client-api.

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

## Next Steps

After exploring these examples:

1. **Read the API Documentation** - Understand the full fjell-client-api specification
2. **Set up your HTTP backend** - Implement corresponding server endpoints
3. **Configure authentication** - Set up proper API authentication for your application
4. **Implement error handling** - Add comprehensive error handling for production use
5. **Add monitoring** - Implement logging and monitoring for API operations
6. **Write tests** - Create tests for your specific API usage patterns
7. **Optimize performance** - Add caching, pagination, and other performance optimizations
