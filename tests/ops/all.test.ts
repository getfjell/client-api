import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAllOperation } from '../../src/ops/all';
import { HttpApi } from '@fjell/http-api';
import { ClientApiOptions } from '../../src/ClientApiOptions';
import { AllOperationResult, Item, ItemQuery, queryToParams, Utilities } from '@fjell/core';

// Mock the logger
vi.mock('../../src/logger', () => ({
  default: {
    get: vi.fn(() => ({
      default: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    })),
  },
}));

interface TestItem extends Item<'test', 'location1'> {
  name: string;
  submittedAt: Date;
  id: string;
}

describe('getAllOperation', () => {
  let mockApi: HttpApi;
  let mockApiOptions: ClientApiOptions;
  let mockUtilities: Utilities<TestItem, 'test', 'location1'>;
  let all: ReturnType<typeof getAllOperation>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock HttpApi
    mockApi = {
      httpGet: vi.fn(),
      httpPost: vi.fn(),
      httpPut: vi.fn(),
      httpDelete: vi.fn(),
      httpPostFile: vi.fn(),
      uploadAsync: vi.fn(),
      httpOptions: vi.fn(),
      httpConnect: vi.fn(),
      httpTrace: vi.fn(),
      httpPatch: vi.fn(),
    } as any;

    // Mock ClientApiOptions
    mockApiOptions = {
      allAuthenticated: true,
      getOptions: {},
    };

    // Mock Utilities
    mockUtilities = {
      verifyLocations: vi.fn(),
      getPath: vi.fn(() => '/test/path'),
      processArray: vi.fn((promise) => promise),
      validatePK: vi.fn((items) => items),
    } as any;

    all = getAllOperation(mockApi, mockApiOptions, mockUtilities);
  });

  describe('orderBy parameter support', () => {
    test('all() with single orderBy should include orderBy in request params', async () => {
      const mockResponse: AllOperationResult<TestItem> = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false },
      };

      (mockApi.httpGet as any).mockResolvedValue(mockResponse);

      const query: ItemQuery = {
        orderBy: [{ field: 'name', direction: 'asc' }],
      };

      await all(query, []);

      const callArgs = (mockApi.httpGet as any).mock.calls[0];
      const requestOptions = callArgs[1];
      const params = requestOptions.params;

      expect(params.orderBy).toBe(JSON.stringify([{ field: 'name', direction: 'asc' }]));
      expect(mockApi.httpGet).toHaveBeenCalledWith(
        '/test/path',
        expect.objectContaining({
          params: expect.objectContaining({
            orderBy: JSON.stringify([{ field: 'name', direction: 'asc' }]),
          }),
        })
      );
    });

    test('all() with multiple orderBy fields should serialize correctly', async () => {
      const mockResponse: AllOperationResult<TestItem> = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false },
      };

      (mockApi.httpGet as any).mockResolvedValue(mockResponse);

      const query: ItemQuery = {
        orderBy: [
          { field: 'submittedAt', direction: 'desc' },
          { field: 'id', direction: 'asc' },
        ],
      };

      await all(query, []);

      const callArgs = (mockApi.httpGet as any).mock.calls[0];
      const requestOptions = callArgs[1];
      const params = requestOptions.params;

      expect(params.orderBy).toBe(
        JSON.stringify([
          { field: 'submittedAt', direction: 'desc' },
          { field: 'id', direction: 'asc' },
        ])
      );
    });

    test('all() with allOptions (limit/offset) AND orderBy should include both in params', async () => {
      const mockResponse: AllOperationResult<TestItem> = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 10, hasMore: false },
      };

      (mockApi.httpGet as any).mockResolvedValue(mockResponse);

      const query: ItemQuery = {
        orderBy: [{ field: 'name', direction: 'asc' }],
        limit: 20,
        offset: 10,
      };

      await all(query, [], { limit: 25, offset: 15 });

      const callArgs = (mockApi.httpGet as any).mock.calls[0];
      const requestOptions = callArgs[1];
      const params = requestOptions.params;

      // allOptions should override query limit/offset
      expect(params.limit).toBe('25');
      expect(params.offset).toBe('15');
      expect(params.orderBy).toBe(JSON.stringify([{ field: 'name', direction: 'asc' }]));
    });

    test('all() without orderBy should work as before (backward compatibility)', async () => {
      const mockResponse: AllOperationResult<TestItem> = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false },
      };

      (mockApi.httpGet as any).mockResolvedValue(mockResponse);

      const query: ItemQuery = {
        limit: 10,
        offset: 5,
      };

      await all(query, []);

      const callArgs = (mockApi.httpGet as any).mock.calls[0];
      const requestOptions = callArgs[1];
      const params = requestOptions.params;

      expect(params.orderBy).toBeUndefined();
      expect(params.limit).toBe(10);
      expect(params.offset).toBe(5);
    });

    test('all() with orderBy and compoundCondition should include both', async () => {
      const mockResponse: AllOperationResult<TestItem> = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false },
      };

      (mockApi.httpGet as any).mockResolvedValue(mockResponse);

      const query: ItemQuery = {
        orderBy: [{ field: 'submittedAt', direction: 'desc' }],
        compoundCondition: {
          compoundType: 'AND',
          conditions: [{ column: 'status', value: 'active', operator: '==' }],
        },
      };

      await all(query, []);

      const callArgs = (mockApi.httpGet as any).mock.calls[0];
      const requestOptions = callArgs[1];
      const params = requestOptions.params;

      expect(params.orderBy).toBe(JSON.stringify([{ field: 'submittedAt', direction: 'desc' }]));
      expect(params.compoundCondition).toBe(
        JSON.stringify({
          compoundType: 'AND',
          conditions: [{ column: 'status', value: 'active', operator: '==' }],
        })
      );
    });

    test('all() with orderBy should use queryToParams correctly', async () => {
      const mockResponse: AllOperationResult<TestItem> = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false },
      };

      (mockApi.httpGet as any).mockResolvedValue(mockResponse);

      const query: ItemQuery = {
        orderBy: [{ field: 'name', direction: 'asc' }],
        limit: 10,
      };

      await all(query, []);

      // Verify that queryToParams was used (indirectly through the params structure)
      const callArgs = (mockApi.httpGet as any).mock.calls[0];
      const requestOptions = callArgs[1];
      const params = requestOptions.params;

      // The params should match what queryToParams would produce
      const expectedParams = queryToParams(query);
      expect(params.orderBy).toBe(expectedParams.orderBy);
      expect(params.limit).toBe(expectedParams.limit);
    });

    test('all() with empty orderBy array should serialize correctly', async () => {
      const mockResponse: AllOperationResult<TestItem> = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false },
      };

      (mockApi.httpGet as any).mockResolvedValue(mockResponse);

      const query: ItemQuery = {
        orderBy: [],
      };

      await all(query, []);

      const callArgs = (mockApi.httpGet as any).mock.calls[0];
      const requestOptions = callArgs[1];
      const params = requestOptions.params;

      expect(params.orderBy).toBe(JSON.stringify([]));
    });

    test('all() should handle server response with pagination metadata and orderBy', async () => {
      const mockItems: TestItem[] = [
        {
          key: { kt: 'test', pk: '1' },
          name: 'Item 1',
          submittedAt: new Date('2024-01-01'),
          id: '1',
          events: {},
        },
        {
          key: { kt: 'test', pk: '2' },
          name: 'Item 2',
          submittedAt: new Date('2024-01-02'),
          id: '2',
          events: {},
        },
      ];

      const mockResponse: AllOperationResult<TestItem> = {
        items: mockItems,
        metadata: {
          total: 100,
          returned: 2,
          offset: 0,
          hasMore: true,
        },
      };

      (mockApi.httpGet as any).mockResolvedValue(mockResponse);
      (mockUtilities.processArray as any).mockResolvedValue(mockItems);

      const query: ItemQuery = {
        orderBy: [{ field: 'submittedAt', direction: 'desc' }],
        limit: 2,
      };

      const result = await all(query, []);

      expect(result.items).toEqual(mockItems);
      expect(result.metadata.total).toBe(100);
      expect(result.metadata.hasMore).toBe(true);

      // Verify orderBy was sent in the request
      const callArgs = (mockApi.httpGet as any).mock.calls[0];
      const requestOptions = callArgs[1];
      const params = requestOptions.params;
      expect(params.orderBy).toBe(JSON.stringify([{ field: 'submittedAt', direction: 'desc' }]));
    });
  });

  describe('backward compatibility', () => {
    test('all() with empty query should work', async () => {
      const mockResponse: AllOperationResult<TestItem> = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false },
      };

      (mockApi.httpGet as any).mockResolvedValue(mockResponse);

      await all({}, []);

      const callArgs = (mockApi.httpGet as any).mock.calls[0];
      const requestOptions = callArgs[1];
      const params = requestOptions.params;

      expect(params.orderBy).toBeUndefined();
    });

    test('all() with only limit should work', async () => {
      const mockResponse: AllOperationResult<TestItem> = {
        items: [],
        metadata: { total: 0, returned: 0, offset: 0, hasMore: false },
      };

      (mockApi.httpGet as any).mockResolvedValue(mockResponse);

      await all({ limit: 10 }, []);

      const callArgs = (mockApi.httpGet as any).mock.calls[0];
      const requestOptions = callArgs[1];
      const params = requestOptions.params;

      expect(params.orderBy).toBeUndefined();
      expect(params.limit).toBe(10);
    });
  });
});

