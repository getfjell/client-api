# Migration Guide: v4.4.x to v4.5.0

## Overview

Version 4.5.0 adopts the Operations interface from `@fjell/core`, providing a consistent API across all Fjell packages.

## Breaking Changes Summary

1. **Core Operations Interface**: `ClientApi` now extends `Operations` from `@fjell/core`
2. **Create Method**: Changed signature to use `CreateOptions`
3. **Action Methods**: Parameter name changed from `body` to `params`
4. **Upsert Operation**: Added missing `upsert` method

## Dependency Updates

Update your `package.json`:

```bash
npm install @fjell/core@latest @fjell/client-api@latest
```

## Code Migration

### 1. Create Method

The `create` method now uses `CreateOptions` instead of a simple `locations` parameter.

#### Before (v4.4.x)

```typescript
// With locations
const item = await api.create(
  { name: 'Alice' },
  [{ kt: 'org', lk: 'org-123' }]
);

// Without locations
const item = await api.create({ name: 'Alice' });
```

#### After (v4.5.0)

```typescript
// With locations - wrap in options object
const item = await api.create(
  { name: 'Alice' },
  { locations: [{ kt: 'org', lk: 'org-123' }] }
);

// Without locations - omit options or pass undefined
const item = await api.create({ name: 'Alice' });

// NEW: With specific key
const item = await api.create(
  { name: 'Alice' },
  { key: { kt: 'user', pk: 'custom-id' } }
);
```

### 2. Action Methods

The parameter name changed from `body` to `params` to match the core Operations interface. **Functionally, it's the same** - just a naming change.

#### Before (v4.4.x)

```typescript
const [item, affectedKeys] = await api.action(
  key,
  'promote',
  { role: 'admin' } // called "body"
);

const [items, affectedKeys] = await api.allAction(
  'archive',
  { reason: 'expired' }, // called "body"
  locations
);
```

#### After (v4.5.0)

```typescript
// Same code - just know it's now called "params" internally
const [item, affectedKeys] = await api.action(
  key,
  'promote',
  { role: 'admin' } // now called "params"
);

const [items, affectedKeys] = await api.allAction(
  'archive',
  { reason: 'expired' }, // now called "params"
  locations
);
```

### 3. Upsert Operation (New)

A new `upsert` operation is now available:

```typescript
// Creates if doesn't exist, updates if it does
const user = await api.upsert(
  { kt: 'user', pk: 'user-123' },
  { name: 'Alice', email: 'alice@example.com' }
);

// With locations (for contained items)
const comment = await api.upsert(
  { kt: 'comment', pk: 'comment-456', loc: [{ kt: 'post', lk: 'post-123' }] },
  { text: 'Updated comment' },
  [{ kt: 'post', lk: 'post-123' }]
);
```

### 4. Type Imports

Import types from the appropriate package:

#### Before (v4.4.x)

```typescript
import { ClientApi } from '@fjell/client-api';
// No OperationParams or AffectedKeys available
```

#### After (v4.5.0)

```typescript
import { ClientApi, OperationParams, AffectedKeys, CreateOptions } from '@fjell/client-api';
// Or import directly from core
import { Operations, OperationParams, AffectedKeys } from '@fjell/core';
```

## Type Compatibility

The `ClientApi` interface is now fully compatible with the core `Operations` interface:

```typescript
import type { Operations } from '@fjell/core';
import type { ClientApi } from '@fjell/client-api';

// These are now compatible
function processItems(ops: Operations<User, 'user'>) {
  // Can pass either ClientApi or any other Operations implementation
}

const clientApi: ClientApi<User, 'user'> = ...;
processItems(clientApi); // ✅ Works!
```

## Benefits of Migration

### 1. Consistent Interface

All Fjell packages now share the same Operations interface:

```typescript
// All implement the same Operations interface
import { Operations } from '@fjell/lib';
import { ClientApi } from '@fjell/client-api';
import { Operations as FirestoreOps } from '@fjell/lib-firestore';

// Can be used interchangeably
function workWithOperations(ops: Operations<Item, string>) {
  // Works with any implementation
}
```

### 2. Better Type Safety

```typescript
import { OperationParams, AffectedKeys, CreateOptions } from '@fjell/core';

// Strongly typed parameters
const params: OperationParams = {
  status: 'active',
  limit: 10
};

// Type-safe create options
const options: CreateOptions<'user'> = {
  key: { kt: 'user', pk: 'user-123' }
};
```

### 3. Future Compatibility

By adopting the core interface, your code will be compatible with future Fjell enhancements and new operation implementations.

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors after upgrading:

1. **Clear your TypeScript cache**: Delete `node_modules/.cache` and `dist/` directories
2. **Rebuild**: Run `npm run build`
3. **Update imports**: Ensure you're importing types from the correct packages

### Runtime Errors

If you encounter runtime errors:

1. **Check create calls**: Wrap `locations` in options object: `{ locations: [...] }`
2. **Verify dependencies**: Ensure `@fjell/core` is at the latest version
3. **Clear node_modules**: Delete and reinstall if necessary

## Migration Checklist

- [ ] Update package.json dependencies
- [ ] Run `npm install`
- [ ] Update `create` calls to use options object
- [ ] Update any type imports
- [ ] Test upsert operations if needed
- [ ] Run tests: `npm test`
- [ ] Build: `npm run build`
- [ ] Check for TypeScript errors: `npm run lint`

## Questions or Issues?

If you encounter any problems during migration:

1. Check the [API Reference](./docs/public/api-reference.md)
2. Review the [examples](./examples/)
3. File an issue on GitHub

## Previous Migrations

- For migrations from older versions, see previous migration guides

