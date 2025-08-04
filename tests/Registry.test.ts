import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createRegistry, createRegistryFactory } from '../src/Registry';

// Mock the @fjell/registry module
vi.mock('@fjell/registry', () => ({
  createRegistry: vi.fn((type: string, registryHub?: any) => ({
    type,
    id: 'mock-registry-id',
    registryHub,
    // Mock base registry methods
    register: vi.fn(),
    get: vi.fn(),
    has: vi.fn(),
    remove: vi.fn(),
    getAll: vi.fn(),
    clear: vi.fn(),
  })),
  Registry: class MockRegistry {},
}));

describe('Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRegistryFactory', () => {
    test('should create a factory function', () => {
      const factory = createRegistryFactory();
      expect(typeof factory).toBe('function');
    });

    test('should create client-api registry when type is client-api', () => {
      const factory = createRegistryFactory();
      const registry = factory('client-api');

      expect(registry).toBeDefined();
      expect(registry.type).toBe('client-api');
    });

    test('should pass registryHub to base registry creation', () => {
      const factory = createRegistryFactory();
      const mockHub = { id: 'test-hub' };
      const registry = factory('client-api', mockHub);

      expect(registry).toBeDefined();
      expect(registry.registryHub).toBe(mockHub);
    });

    test('should throw error for invalid registry type', () => {
      const factory = createRegistryFactory();

      expect(() => factory('invalid-type')).toThrow(
        "Client API registry factory can only create 'client-api' type registries, got: invalid-type"
      );
    });

    test('should throw error for empty string type', () => {
      const factory = createRegistryFactory();

      expect(() => factory('')).toThrow(
        "Client API registry factory can only create 'client-api' type registries, got: "
      );
    });

    test('should throw error for null type', () => {
      const factory = createRegistryFactory();

      expect(() => factory(null as any)).toThrow(
        "Client API registry factory can only create 'client-api' type registries, got: null"
      );
    });
  });

  describe('createRegistry', () => {
    test('should create a client-api registry', () => {
      const registry = createRegistry();

      expect(registry).toBeDefined();
      expect(registry.type).toBe('client-api');
    });

    test('should create registry with registryHub when provided', () => {
      const mockHub = { id: 'test-hub', name: 'Test Hub' };
      const registry = createRegistry(mockHub);

      expect(registry).toBeDefined();
      expect(registry.registryHub).toBe(mockHub);
    });

    test('should create registry without registryHub when not provided', () => {
      const registry = createRegistry();

      expect(registry).toBeDefined();
      // Should work without throwing
    });

    test('should return Registry interface with base registry methods', () => {
      const registry = createRegistry();

      expect(registry).toBeDefined();
      expect(typeof registry.register).toBe('function');
      expect(typeof registry.get).toBe('function');
      expect(typeof registry.has).toBe('function');
      expect(typeof registry.remove).toBe('function');
      expect(typeof registry.getAll).toBe('function');
      expect(typeof registry.clear).toBe('function');
    });
  });

  describe('Registry interface', () => {
    test('should extend base registry with client-api type', () => {
      const registry = createRegistry();

      // Type check that it has the required properties
      expect(registry.type).toBe('client-api');

      // Verify it has base registry functionality
      expect(registry).toHaveProperty('register');
      expect(registry).toHaveProperty('get');
      expect(registry).toHaveProperty('has');
      expect(registry).toHaveProperty('remove');
      expect(registry).toHaveProperty('getAll');
      expect(registry).toHaveProperty('clear');
    });
  });

  describe('integration with logging', () => {
    test('should not throw errors during registry creation', () => {
      // Since logging is mocked globally, this should work without issues
      expect(() => createRegistry()).not.toThrow();
      expect(() => createRegistryFactory()).not.toThrow();
    });

    test('should handle multiple registry creations', () => {
      const registry1 = createRegistry();
      const registry2 = createRegistry();
      const factory = createRegistryFactory();
      const registry3 = factory('client-api');

      expect(registry1).toBeDefined();
      expect(registry2).toBeDefined();
      expect(registry3).toBeDefined();

      // Each should be a separate instance
      expect(registry1).not.toBe(registry2);
      expect(registry2).not.toBe(registry3);
    });
  });
});
