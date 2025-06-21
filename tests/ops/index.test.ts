import { Item } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";
import { getOperations } from "@/ops/index";
import { ClientApiOptions } from "@/ClientApiOptions";
import { Utilities } from "@/Utilities";
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all operation modules
vi.mock("@/ops/all");
vi.mock("@/ops/action");
vi.mock("@/ops/allAction");
vi.mock("@/ops/one");
vi.mock("@/ops/create");
vi.mock("@/ops/update");
vi.mock("@/ops/get");
vi.mock("@/ops/remove");
vi.mock("@/ops/find");
vi.mock("@/ops/facet");
vi.mock("@/ops/findOne");

// Import the mocked functions
import { getAllOperation } from "@/ops/all";
import { getActionOperation } from "@/ops/action";
import { getAllActionOperation } from "@/ops/allAction";
import { getOneOperation } from "@/ops/one";
import { getCreateOperation } from "@/ops/create";
import { getUpdateOperation } from "@/ops/update";
import { getGetOperation } from "@/ops/get";
import { getRemoveOperation } from "@/ops/remove";
import { getFindOperation } from "@/ops/find";
import { getFacetOperation } from "@/ops/facet";
import { getFindOneOperation } from "@/ops/findOne";

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
  });

  describe("getOperations function", () => {
    it("should return a ClientApi object with working operations", () => {
      const clientApi = getOperations(mockHttpApi, mockApiOptions, mockUtilities);

      // Test the operations that are currently working
      expect(clientApi).toHaveProperty('action');
      expect(clientApi).toHaveProperty('all');
      expect(clientApi).toHaveProperty('allAction');
      expect(clientApi).toHaveProperty('create');
      expect(clientApi).toHaveProperty('find');
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
      expect(typeof clientApi.create).toBe('function');
      expect(typeof clientApi.find).toBe('function');
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

      // Verify that we get a consistent set of operations
      expect(operationKeys.length).toBe(11); // Current count of working operations
      expect(operationKeys).toContain('all');
      expect(operationKeys).toContain('action');
      expect(operationKeys).toContain('create');
      expect(operationKeys).toContain('get');
      expect(operationKeys).toContain('update');
      expect(operationKeys).toContain('remove');
      expect(operationKeys).toContain('find');
      expect(operationKeys).toContain('one');
      expect(operationKeys).toContain('allAction');
      expect(operationKeys).toContain('facet');
      expect(operationKeys).toContain('findOne');
    });

    it("should return exactly the expected operations", () => {
      const clientApi = getOperations(mockHttpApi, mockApiOptions, mockUtilities);
      const operationKeys = Object.keys(clientApi).sort();

      // Test the exact current behavior
      const expectedOperations = [
        'action', 'all', 'allAction', 'create',
        'find', 'get', 'one', 'remove', 'update',
        'facet', 'findOne'
      ].sort();

      expect(operationKeys).toEqual(expectedOperations);
    });
  });
});
