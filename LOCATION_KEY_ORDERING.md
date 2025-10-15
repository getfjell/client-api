# Location Key Ordering in Client API

## Overview

When accessing nested/contained entities in Fjell, the **order of location keys matters**. The client API now includes **automatic validation** that will throw an error if location keys are passed in the wrong order, preventing malformed URL paths from being generated.

## Automatic Validation (New Feature)

As of this update, the client API automatically validates location key ordering and will throw a descriptive error if keys are out of order. This prevents silent failures where malformed paths would result in 404 errors.

### What Gets Validated

- Location keys must appear in ascending order according to the `pathNames` hierarchy
- The validation compares each key's type (`kt`) against the `pathNames` array
- If a key appears "earlier" in the hierarchy than the previous key, an error is thrown

### Example Validation Error

```typescript
Error: Location keys must be ordered from parent to child according to the entity hierarchy.
Expected order based on pathNames: [fjell/order, orderForm, orderNoseShape].
Received key types in order: [orderForm, order].
Key "order" is out of order - it should appear earlier in the hierarchy.
```

## How It Works

The `getPath()` function in `Utilities.ts` processes keys in the order they are provided. The new `validateLocationKeyOrder()` function checks that location keys match the expected hierarchy before building the path.

### Example: Three-Level Hierarchy

Given this entity hierarchy:
```
order (primary)
  └─ orderForm (contained in order)
      └─ orderNoseShape (contained in orderForm)
```

With `pathNames: ["fjell/order", "orderForm", "orderNoseShape"]`

### ✅ Correct Usage

```typescript
const orderKey: LocKey<"order"> = { kt: "order", lk: "26669" };
const orderFormKey: LocKey<"orderForm"> = { kt: "orderForm", lk: "26693" };

// Keys must be ordered from PARENT to CHILD
const locations = [orderKey, orderFormKey];

api.one({}, locations);
// Result: /fjell/order/26669/orderForm/26693/orderNoseShape ✅
```

### ❌ Wrong Usage (Now Throws Error)

```typescript
// WRONG: orderForm before order
const locations = [orderFormKey, orderKey];

api.one({}, locations);
// Throws Error: Location keys must be ordered from parent to child according to the entity hierarchy.
// Expected order based on pathNames: [fjell/order, orderForm, orderNoseShape].
// Received key types in order: [orderForm, order].
// Key "order" is out of order - it should appear earlier in the hierarchy.
```

**Before this update:** This would have silently created a malformed path: `/orderForm/26693/fjell/order/26669/orderNoseShape`

**Now:** An error is thrown immediately, making the issue obvious and preventing network requests with bad paths.

## Rules for Location Key Ordering

1. **Always order from outermost to innermost**: `[grandparent, parent, child]`
2. **Match the hierarchy defined by your data model**: The order should reflect how entities are nested
3. **For ComKeys**: The `loc` array should also follow this ordering

### ComKey Example

```typescript
// For accessing a specific orderNoseShape item
const comKey = {
  kt: "orderNoseShape",
  pk: "nose-123",
  loc: [
    { kt: "order", lk: "26669" },        // Parent first
    { kt: "orderForm", lk: "26693" }     // Child second
  ]
};

api.get(comKey);
// Result: /fjell/order/26669/orderForm/26693/orderNoseShape/nose-123 ✅
```

## Debugging Tips

1. **Enable logging**: The `Utilities.ts` logger logs the keys and pathNames being processed
2. **Check the generated path**: Use browser DevTools Network tab to see the actual HTTP request
3. **Verify key order**: Print/log your `locations` array before passing it to API methods
4. **Use the type system**: TypeScript generics enforce the location types but not their order

## Common Mistakes

### Mistake 1: Building keys in reverse
```typescript
// Building keys as you traverse from child to parent
const keys = [];
keys.push(orderFormKey);  // ❌ Adding child first
keys.push(orderKey);      // ❌ Adding parent second
```

**Fix**: Build keys from parent to child
```typescript
const keys = [];
keys.push(orderKey);      // ✅ Parent first
keys.push(orderFormKey);  // ✅ Child second
```

### Mistake 2: Not considering the full hierarchy
```typescript
// Only providing the immediate parent
const locations = [orderFormKey];  // ❌ Missing orderKey
```

**Fix**: Include all ancestors
```typescript
const locations = [orderKey, orderFormKey];  // ✅ Complete hierarchy
```

## Test Coverage

See `tests/Utilities.test.ts` for comprehensive examples:
- ✅ Correct ordering: "should generate path for collection access with location keys only"
- ✅ Error on wrong ordering: "should throw error when location keys are in wrong order"
- ✅ ComKey usage: "should generate path for nested entities with correct order"
- ✅ Error message validation: "should throw error with helpful message explaining the issue"

## Benefits of Validation

1. **Fail fast**: Errors are caught immediately at the API call site, not after a failed HTTP request
2. **Clear error messages**: The error tells you exactly what went wrong and what the correct order should be
3. **Prevents debugging confusion**: No more hunting through logs to figure out why you're getting 404 errors
4. **Type-safe**: Works seamlessly with TypeScript's type system
5. **Zero runtime cost for correct code**: Validation only runs when keys are actually used

## Implementation Details

The validation function (`validateLocationKeyOrder` in `Utilities.ts`):
- Extracts location keys from the provided keys array
- Builds a map of key types to their expected position in the hierarchy
- Validates that location keys appear in strictly ascending order
- Throws a detailed error if validation fails
- Handles path segments with slashes (e.g., "fjell/order" matches key type "order")

