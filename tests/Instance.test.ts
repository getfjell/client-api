import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createInstance, Instance } from '../src/Instance';
import { Item } from "@fjell/types";

// Mock the logger
vi.mock('../src/logger', () => ({
  default: {
    get: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

// Mock the @fjell/registry module
vi.mock('@fjell/registry', () => ({
  createInstance: vi.fn((registry, coordinate) => ({
    registry,
    coordinate,
    id: 'mock-base-instance-id',
  })),
}));

interface TestItem extends Item<'test', 'location1'> {
  name: string;
  value: number;
}

describe('Instance', () => {
  const mockRegistry = {
    type: 'test',
    id: 'mock-registry-id',
    register: vi.fn(),
    get: vi.fn(),
    has: vi.fn(),
    remove: vi.fn(),
    getAll: vi.fn(),
    clear: vi.fn(),
  };

  const mockCoordinate = {
    key: 'test' as const,
    locations: ['location1'] as const,
  };

  const mockClientApi = {
    action: vi.fn(),
    all: vi.fn(),
    allAction: vi.fn(),
    allFacet: vi.fn(),
    create: vi.fn(),
    facet: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    get: vi.fn(),
    one: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInstance', () => {
    test('should create an instance with registry, coordinate, and clientApi', () => {
      const instance = createInstance(mockRegistry, mockCoordinate, mockClientApi);

      expect(instance).toBeDefined();
      expect(instance.registry).toBe(mockRegistry);
      expect(instance.coordinate).toBe(mockCoordinate);
      expect(instance.clientApi).toBe(mockClientApi);
    });

    test('should include properties from base instance', () => {
      const instance = createInstance(mockRegistry, mockCoordinate, mockClientApi);

      expect(instance.id).toBe('mock-base-instance-id');
      expect(instance.registry).toBe(mockRegistry);
      expect(instance.coordinate).toBe(mockCoordinate);
    });

    test('should preserve all clientApi methods', () => {
      const instance = createInstance(mockRegistry, mockCoordinate, mockClientApi);

      // Check that all ClientApi methods are available
      expect(typeof instance.clientApi.action).toBe('function');
      expect(typeof instance.clientApi.all).toBe('function');
      expect(typeof instance.clientApi.allAction).toBe('function');
      expect(typeof instance.clientApi.allFacet).toBe('function');
      expect(typeof instance.clientApi.create).toBe('function');
      expect(typeof instance.clientApi.facet).toBe('function');
      expect(typeof instance.clientApi.find).toBe('function');
      expect(typeof instance.clientApi.findOne).toBe('function');
      expect(typeof instance.clientApi.get).toBe('function');
      expect(typeof instance.clientApi.one).toBe('function');
      expect(typeof instance.clientApi.remove).toBe('function');
      expect(typeof instance.clientApi.update).toBe('function');
    });

    test('should create instance successfully with logging', () => {
      // Simple test that verifies the function executes without error
      const instance = createInstance(mockRegistry, mockCoordinate, mockClientApi);

      expect(instance).toBeDefined();
      expect(instance.clientApi).toBe(mockClientApi);
    });

    test('should work with different coordinate types', () => {
      const differentCoordinate = {
        key: 'different' as const,
        locations: ['loc1', 'loc2'] as const,
      };

      const instance = createInstance(mockRegistry, differentCoordinate, mockClientApi);

      expect(instance.coordinate).toBe(differentCoordinate);
    });

    test('should work with different registry instances', () => {
      const differentRegistry = {
        type: 'different',
        id: 'different-registry-id',
        register: vi.fn(),
        get: vi.fn(),
        has: vi.fn(),
        remove: vi.fn(),
        getAll: vi.fn(),
        clear: vi.fn(),
      };

      const instance = createInstance(differentRegistry, mockCoordinate, mockClientApi);

      expect(instance.registry).toBe(differentRegistry);
    });
  });

  describe('Instance interface', () => {
    test('should extend base instance interface correctly', () => {
      const instance: Instance<TestItem, 'test', 'location1'> = createInstance(
        mockRegistry,
        mockCoordinate,
        mockClientApi,
      );

      // Should have base instance properties
      expect(instance).toHaveProperty('registry');
      expect(instance).toHaveProperty('coordinate');
      expect(instance).toHaveProperty('id');

      // Should have clientApi property
      expect(instance).toHaveProperty('clientApi');
    });
  });
});
