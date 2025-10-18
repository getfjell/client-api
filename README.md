# @fjell/client-api

HTTP client for Fjell operations.

## Installation

```bash
npm install @fjell/client-api @fjell/http-api @fjell/core
```

## Overview

`@fjell/client-api` provides HTTP client implementations for Fjell's Operations interface. It enables you to interact with Fjell-based APIs over HTTP using the same consistent interface as local operations.

## v4.5.0+ Breaking Changes

The `ClientApi` interface now directly extends `@fjell/core` Operations. This means:
- Consistent interface across all transport layers
- Better type safety
- Smaller bundle size
- Full compatibility with other Operations implementations

### Key Changes

1. **Core Operations Interface**: `ClientApi` now extends the core `Operations` interface
2. **Upsert Support**: Added missing `upsert` operation
3. **CreateOptions**: The `create` method now accepts `CreateOptions` for more flexibility
4. **Action Parameters**: Action methods now use `params` (OperationParams) instead of `body`

## Usage

### Basic Example

```typescript
import { createClientApi } from '@fjell/client-api';
import { HttpApi } from '@fjell/http-api';
import type { Item } from '@fjell/core';

// Define your item type
interface User extends Item<'user'> {
  name: string;
  email: string;
}

// Create HTTP API instance
const httpApi = new HttpApi({ baseUrl: 'https://api.example.com' });

// Create client API
const userApi = createClientApi<User, 'user'>(
  httpApi,
  'user',
  ['user']
);

// Use the operations
const users = await userApi.all({});
const user = await userApi.get({ kt: 'user', pk: 'user-123' });
const created = await userApi.create({ name: 'Alice', email: 'alice@example.com' });
const updated = await userApi.update({ kt: 'user', pk: 'user-123' }, { name: 'Alice Smith' });
```

### Contained Items

```typescript
import { createCItemApi } from '@fjell/client-api';

interface Comment extends Item<'comment', 'post'> {
  text: string;
  author: string;
}

const commentApi = createCItemApi<Comment, 'comment', 'post'>(
  httpApi,
  'comment',
  ['post', 'comment']
);

// Operations scoped to a specific location
const comments = await commentApi.all({}, [{ kt: 'post', lk: 'post-123' }]);
const comment = await commentApi.create(
  { text: 'Great post!', author: 'alice' },
  { locations: [{ kt: 'post', lk: 'post-123' }] }
);
```

### All Operations

The ClientApi implements all standard Operations:

- **CRUD**: `get`, `create`, `update`, `upsert`, `remove`
- **Query**: `all`, `one`, `find`, `findOne`
- **Actions**: `action`, `allAction`
- **Facets**: `facet`, `allFacet`

## Migration from v4.4.x

### Update Dependencies

```bash
npm install @fjell/core@latest @fjell/client-api@latest
```

### Code Changes

The API is mostly backward compatible. Key changes:

#### 1. Create Method Signature

```typescript
// Before (v4.4.x)
await api.create(item, locations);

// After (v4.5.0+) - still works
await api.create(item, { locations });

// New options
await api.create(item, { key: { kt: 'user', pk: 'custom-id' } });
```

#### 2. Action Parameters

```typescript
// Before (v4.4.x) - "body" parameter
await api.action(key, 'promote', { role: 'admin' });

// After (v4.5.0+) - "params" parameter (works the same)
await api.action(key, 'promote', { role: 'admin' });
```

#### 3. Upsert Operation

```typescript
// Now available
const user = await api.upsert(
  { kt: 'user', pk: 'user-123' },
  { name: 'Alice', email: 'alice@example.com' }
);
```

## Type Exports

```typescript
import type { 
  ClientApi,
  CItemApi,
  OperationParams,
  AffectedKeys,
  CreateOptions
} from '@fjell/client-api';
```

## Benefits

- **Consistent API**: Same Operations interface as `@fjell/lib`, `@fjell/lib-firestore`, etc.
- **Type Safety**: Full TypeScript support with generic types
- **Interchangeable**: Can be used anywhere that accepts Operations
- **HTTP Transport**: Built on `@fjell/http-api` for reliable HTTP communication

## Documentation

For detailed documentation, see:
- [API Reference](./docs/public/api-reference.md)
- [Examples](./examples/README.md)
- [Migration Guide](./MIGRATION_v3.md)

## License

Apache-2.0

