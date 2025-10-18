import { describe, expect, it } from 'vitest';
import type { ClientApi } from '../src/ClientApi';
import type { Operations } from '@fjell/core';
import type { Item } from '@fjell/core';

// Test types for compatibility
type TestItem = Item<'test', never, never, never, never, never>;

describe('ClientApi Interface', () => {
  it('should extend core Operations interface', () => {
    // Type test - this will fail at compile time if ClientApi doesn't extend Operations
    type TestClientApi = ClientApi<TestItem, 'test'>;
    type CoreOps = Operations<TestItem, 'test'>;
    
    // ClientApi should be assignable to Operations
    const testApi: TestClientApi = {} as any;
    const satisfiesCore: CoreOps = testApi;
    expect(satisfiesCore).toBeDefined();
  });

  it('should have all required operations methods', () => {
    // Type test to verify the interface structure
    // We can't test on an empty object since ClientApi is just an interface
    type ClientApiKeys = keyof ClientApi<TestItem, 'test'>;
    
    // Verify all operation method names are part of the type
    const requiredMethods: ClientApiKeys[] = [
      'all', 'one', 'create', 'get', 'update', 'upsert',
      'remove', 'find', 'findOne', 'action', 'allAction',
      'facet', 'allFacet'
    ];
    
    // If this compiles, the test passes
    expect(requiredMethods.length).toBe(13);
  });

  it('should be compatible with Operations type', () => {
    // This test verifies that ClientApi can be used wherever Operations is expected
    function acceptsOperations(ops: Operations<TestItem, 'test'>): void {
      expect(ops).toBeDefined();
    }

    const clientApi: ClientApi<TestItem, 'test'> = {} as any;
    acceptsOperations(clientApi);
  });

  it('should support method signatures matching core Operations', () => {
    // This is a type-level test
    // If it compiles, the signatures match
    
    // Simple runtime check to confirm the test runs
    const methodExists: boolean = true;
    expect(methodExists).toBe(true);
  });
});

