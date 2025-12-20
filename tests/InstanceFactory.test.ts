import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createInstanceFactory } from '../src/InstanceFactory';
import { Item } from "@fjell/types";

// Mock the dependencies
vi.mock('../src/Instance', () => ({
  createInstance: vi.fn((registry, coordinate, clientApi) => ({
    coordinate,
    registry,
    clientApi,
    id: 'mock-instance-id',
  })),
}));

vi.mock('@fjell/registry', () => ({
  InstanceFactory: class MockInstanceFactory {},
  Registry: class MockRegistry {},
  RegistryHub: class MockRegistryHub {},
  Coordinate: class MockCoordinate {},
}));

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
  list: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
};

const mockRegistry = {
  type: 'test-registry',
  id: 'mock-registry-id',
  register: vi.fn(),
  get: vi.fn(),
  has: vi.fn(),
  remove: vi.fn(),
  getAll: vi.fn(),
  clear: vi.fn(),
};

const mockCoordinate = {
  service: 'test' as const,
  locations: ['location1'] as const,
  toString: vi.fn(() => 'test:location1'),
};

describe('InstanceFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('InstanceFactory type', () => {
    test('should export InstanceFactory type', () => {
      // This is a type-only export, so we just verify it can be imported
      expect(typeof createInstanceFactory).toBe('function');
    });
  });

  describe('createInstanceFactory', () => {
    test('should return a function', () => {
      const factory = createInstanceFactory(mockClientApi);
      expect(typeof factory).toBe('function');
    });

    test('should create a factory that returns an instance', () => {
      const factory = createInstanceFactory(mockClientApi);
      const context = {
        registry: mockRegistry,
        registryHub: { id: 'test-hub' }
      };

      const instance = factory(mockCoordinate, context);

      expect(instance).toBeDefined();
      expect(instance.coordinate).toBe(mockCoordinate);
      expect(instance.registry).toBe(mockRegistry);
      expect(instance.clientApi).toBe(mockClientApi);
    });

    test('should work without registryHub in context', () => {
      const factory = createInstanceFactory(mockClientApi);
      const context = { registry: mockRegistry };

      const instance = factory(mockCoordinate, context);

      expect(instance).toBeDefined();
      expect(instance.coordinate).toBe(mockCoordinate);
      expect(instance.registry).toBe(mockRegistry);
      expect(instance.clientApi).toBe(mockClientApi);
    });

    test('should call createInstance with correct parameters', async () => {
      const factory = createInstanceFactory(mockClientApi);
      const context = { registry: mockRegistry };

      factory(mockCoordinate, context);

      const { createInstance } = await import('../src/Instance');
      expect(createInstance).toHaveBeenCalledWith(
        mockRegistry,
        mockCoordinate,
        mockClientApi
      );
    });

    test('should handle different coordinate types', () => {
      const coordinateWithMultipleLocations = {
        service: 'test' as const,
        locations: ['location1', 'location2'] as const,
        toString: vi.fn(() => 'test:location1:location2'),
      };

      const factory = createInstanceFactory(mockClientApi);
      const context = { registry: mockRegistry };

      const instance = factory(coordinateWithMultipleLocations, context);

      expect(instance).toBeDefined();
      expect(instance.coordinate).toBe(coordinateWithMultipleLocations);
    });

    test('should pass through all client api methods', () => {
      const factory = createInstanceFactory(mockClientApi);
      const context = { registry: mockRegistry };

      const instance = factory(mockCoordinate, context);

      // Verify all ClientApi methods are available
      expect(instance.clientApi.action).toBe(mockClientApi.action);
      expect(instance.clientApi.all).toBe(mockClientApi.all);
      expect(instance.clientApi.allAction).toBe(mockClientApi.allAction);
      expect(instance.clientApi.allFacet).toBe(mockClientApi.allFacet);
      expect(instance.clientApi.create).toBe(mockClientApi.create);
      expect(instance.clientApi.facet).toBe(mockClientApi.facet);
      expect(instance.clientApi.find).toBe(mockClientApi.find);
      expect(instance.clientApi.findOne).toBe(mockClientApi.findOne);
      expect(instance.clientApi.get).toBe(mockClientApi.get);
      expect(instance.clientApi.list).toBe(mockClientApi.list);
      expect(instance.clientApi.remove).toBe(mockClientApi.remove);
      expect(instance.clientApi.update).toBe(mockClientApi.update);
    });

    test('should work with different generic type parameters', () => {
      interface CustomItem extends Item<'custom', 'org', 'team'> {
        customField: string;
      }

      const customClientApi = {
        ...mockClientApi,
        customMethod: vi.fn(),
      };

      const customCoordinate = {
        service: 'custom' as const,
        locations: ['org', 'team'] as const,
        toString: vi.fn(() => 'custom:org:team'),
      };

      const factory = createInstanceFactory<CustomItem, 'custom', 'org', 'team'>(customClientApi);
      const context = { registry: mockRegistry };

      const instance = factory(customCoordinate, context);

      expect(instance).toBeDefined();
      expect(instance.coordinate).toBe(customCoordinate);
      expect(instance.clientApi).toBe(customClientApi);
    });
  });
});
