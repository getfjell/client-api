import { Item } from "@fjell/types";
import { HttpApi } from "@fjell/http-api";
import { getOperations } from "../../src/ops/index";
import { ClientApiOptions } from "../../src/ClientApiOptions";
import { Utilities } from "../../src/Utilities";
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all operation modules
vi.mock("../../src/ops/all", () => ({
  getAllOperation: vi.fn()
}));
vi.mock("../../src/ops/action", () => ({
  getActionOperation: vi.fn()
}));
vi.mock("../../src/ops/allAction", () => ({
  getAllActionOperation: vi.fn()
}));
vi.mock("../../src/ops/one", () => ({
  getOneOperation: vi.fn()
}));
vi.mock("../../src/ops/create", () => ({
  getCreateOperation: vi.fn()
}));
vi.mock("../../src/ops/update", () => ({
  getUpdateOperation: vi.fn()
}));
vi.mock("../../src/ops/get", () => ({
  getGetOperation: vi.fn()
}));
vi.mock("../../src/ops/remove", () => ({
  getRemoveOperation: vi.fn()
}));
vi.mock("../../src/ops/find", () => ({
  getFindOperation: vi.fn()
}));
vi.mock("../../src/ops/facet", () => ({
  getFacetOperation: vi.fn()
}));
vi.mock("../../src/ops/findOne", () => ({
  getFindOneOperation: vi.fn()
}));
vi.mock("../../src/ops/allFacet", () => ({
  getAllFacetOperation: vi.fn()
}));

// Import the mocked functions
import { getAllOperation } from "../../src/ops/all";
import { getActionOperation } from "../../src/ops/action";
import { getAllActionOperation } from "../../src/ops/allAction";
import { getOneOperation } from "../../src/ops/one";
import { getCreateOperation } from "../../src/ops/create";
import { getUpdateOperation } from "../../src/ops/update";
import { getGetOperation } from "../../src/ops/get";
import { getRemoveOperation } from "../../src/ops/remove";
import { getFindOperation } from "../../src/ops/find";
import { getFacetOperation } from "../../src/ops/facet";
import { getFindOneOperation } from "../../src/ops/findOne";
import { getAllFacetOperation } from "../../src/ops/allFacet";

// Test types
interface TestItem extends Item<"test", "loc1", "loc2"> {
  id: string;
  name: string;
}

describe("getOperations", () => {
  let mockHttpApi: HttpApi;
  let mockApiOptions: ClientApiOptions;
  let mockUtilities: Utilities<TestItem, "test", "loc1", "loc2">;

  // Mock operation functions
  const mockAllOperation = vi.fn();
  const mockActionOperation = vi.fn();
  const mockAllActionOperation = vi.fn();
  const mockOneOperation = vi.fn();
  const mockCreateOperation = vi.fn();
  const mockUpdateOperation = vi.fn();
  const mockGetOperation = vi.fn();
  const mockRemoveOperation = vi.fn();
  const mockFindOperation = vi.fn();
  const mockFacetOperation = vi.fn();
  const mockFindOneOperation = vi.fn();
  const mockAllFacetOperation = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock HttpApi
    mockHttpApi = {
      httpGet: vi.fn(),
      httpPost: vi.fn(),
      httpPut: vi.fn(),
      httpDelete: vi.fn(),
      httpPostFile: vi.fn(),
      uploadAsync: vi.fn()
    } as unknown as HttpApi;

    // Mock ClientApiOptions
    mockApiOptions = {
      allAuthenticated: true
    };

    // Mock Utilities
    mockUtilities = {
      verifyLocations: vi.fn(),
      processOne: vi.fn().mockImplementation((promise) => promise),
      processArray: vi.fn().mockImplementation((promise) => promise),
      convertDoc: vi.fn().mockImplementation((doc) => doc),
      getPath: vi.fn().mockReturnValue("/test/path"),
      validatePK: vi.fn().mockImplementation((arr) => arr)
    } as any;

    // Setup operation function mocks
    vi.mocked(getAllOperation).mockReturnValue(mockAllOperation);
    vi.mocked(getActionOperation).mockReturnValue(mockActionOperation);
    vi.mocked(getAllActionOperation).mockReturnValue(mockAllActionOperation);
    vi.mocked(getOneOperation).mockReturnValue(mockOneOperation);
    vi.mocked(getCreateOperation).mockReturnValue(mockCreateOperation);
    vi.mocked(getUpdateOperation).mockReturnValue(mockUpdateOperation);
    vi.mocked(getGetOperation).mockReturnValue(mockGetOperation);
    vi.mocked(getRemoveOperation).mockReturnValue(mockRemoveOperation);
    vi.mocked(getFindOperation).mockReturnValue(mockFindOperation);
    vi.mocked(getFacetOperation).mockReturnValue(mockFacetOperation);
    vi.mocked(getFindOneOperation).mockReturnValue(mockFindOneOperation);
    vi.mocked(getAllFacetOperation).mockReturnValue(mockAllFacetOperation);
  });

  describe("getOperations function", () => {
    it("should return a ClientApi object with working operations", () => {
      const clientApi = getOperations(mockHttpApi, mockApiOptions, mockUtilities);

      // Test the operations that are currently working
      expect(clientApi).toHaveProperty('action');
      expect(clientApi).toHaveProperty('all');
      expect(clientApi).toHaveProperty('allAction');
      expect(clientApi).toHaveProperty('allFacet');
      expect(clientApi).toHaveProperty('create');
      expect(clientApi).toHaveProperty('facet');
      expect(clientApi).toHaveProperty('find');
      expect(clientApi).toHaveProperty('findOne');
      expect(clientApi).toHaveProperty('get');
      expect(clientApi).toHaveProperty('one');
      expect(clientApi).toHaveProperty('remove');
      expect(clientApi).toHaveProperty('update');
    });

    it("should return functions for all working operations", () => {
      const clientApi = getOperations(mockHttpApi, mockApiOptions, mockUtilities);

      expect(typeof clientApi.action).toBe('function');
      expect(typeof clientApi.all).toBe('function');
      expect(typeof clientApi.allAction).toBe('function');
      expect(typeof clientApi.allFacet).toBe('function');
      expect(typeof clientApi.create).toBe('function');
      expect(typeof clientApi.facet).toBe('function');
      expect(typeof clientApi.find).toBe('function');
      expect(typeof clientApi.findOne).toBe('function');
      expect(typeof clientApi.get).toBe('function');
      expect(typeof clientApi.one).toBe('function');
      expect(typeof clientApi.remove).toBe('function');
      expect(typeof clientApi.update).toBe('function');
    });

    it("should handle different HttpApi implementations", () => {
      const differentHttpApi = {
        httpGet: vi.fn(),
        httpPost: vi.fn(),
        httpPut: vi.fn(),
        httpDelete: vi.fn(),
        httpPostFile: vi.fn(),
        uploadAsync: vi.fn(),
        customMethod: vi.fn() // Additional method
      } as unknown as HttpApi;

      const clientApi = getOperations(differentHttpApi, mockApiOptions, mockUtilities);
      expect(clientApi).toHaveProperty('all');
      expect(typeof clientApi.all).toBe('function');
    });

    it("should handle different ClientApiOptions", () => {
      const differentApiOptions: ClientApiOptions = {
        allAuthenticated: false
      };

      const clientApi = getOperations(mockHttpApi, differentApiOptions, mockUtilities);
      expect(clientApi).toHaveProperty('all');
      expect(typeof clientApi.all).toBe('function');
    });

    it("should handle different Utilities implementations", () => {
      const differentUtilities = {
        verifyLocations: vi.fn(),
        processOne: vi.fn().mockImplementation((promise) => promise),
        processArray: vi.fn().mockImplementation((promise) => promise),
        convertDoc: vi.fn().mockImplementation((doc) => doc),
        getPath: vi.fn().mockReturnValue("/different/path"),
        validatePK: vi.fn().mockImplementation((arr) => arr),
        customUtility: vi.fn() // Additional utility
      } as any;

      const clientApi = getOperations(mockHttpApi, mockApiOptions, differentUtilities);
      expect(clientApi).toHaveProperty('all');
      expect(typeof clientApi.all).toBe('function');
    });

    it("should work with complex generic type parameters", () => {
      interface ComplexTestItem extends Item<"complex", "loc1", "loc2", "loc3", "loc4", "loc5"> {
        id: string;
        name: string;
        metadata: Record<string, any>;
      }

      const complexUtilities = {
        verifyLocations: vi.fn(),
        processOne: vi.fn().mockImplementation((promise) => promise),
        processArray: vi.fn().mockImplementation((promise) => promise),
        convertDoc: vi.fn().mockImplementation((doc) => doc),
        getPath: vi.fn().mockReturnValue("/complex/path"),
        validatePK: vi.fn().mockImplementation((arr) => arr)
      } as Utilities<ComplexTestItem, "complex", "loc1", "loc2", "loc3", "loc4", "loc5">;

      const clientApi = getOperations<ComplexTestItem, "complex", "loc1", "loc2", "loc3", "loc4", "loc5">(
        mockHttpApi,
        mockApiOptions,
        complexUtilities
      );

      expect(clientApi).toHaveProperty('all');
      expect(typeof clientApi.all).toBe('function');
    });

    it("should return operations in a consistent structure", () => {
      const clientApi = getOperations(mockHttpApi, mockApiOptions, mockUtilities);
      const operationKeys = Object.keys(clientApi);

      // Verify that we get a consistent set of operations (including upsert)
      expect(operationKeys.length).toBe(13); // Count includes upsert operation
      expect(operationKeys).toContain('all');
      expect(operationKeys).toContain('action');
      expect(operationKeys).toContain('create');
      expect(operationKeys).toContain('get');
      expect(operationKeys).toContain('update');
      expect(operationKeys).toContain('upsert');
      expect(operationKeys).toContain('remove');
      expect(operationKeys).toContain('find');
      expect(operationKeys).toContain('one');
      expect(operationKeys).toContain('allAction');
      expect(operationKeys).toContain('facet');
      expect(operationKeys).toContain('findOne');
      expect(operationKeys).toContain('allFacet');
    });

    it("should return exactly the expected operations", () => {
      const clientApi = getOperations(mockHttpApi, mockApiOptions, mockUtilities);
      const operationKeys = Object.keys(clientApi).sort();

      // Test the exact current behavior (including upsert)
      const expectedOperations = [
        'action', 'all', 'allAction', 'allFacet', 'create',
        'facet', 'find', 'findOne', 'get', 'one', 'remove', 'update', 'upsert'
      ].sort();

      expect(operationKeys).toEqual(expectedOperations);
    });
  });
});
