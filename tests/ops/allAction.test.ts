import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllActionOperation } from '../../src/ops/allAction';
import { HttpApi } from '@fjell/http-api';
import { ClientApiOptions } from '../../src/ClientApiOptions';
import { Utilities } from '../../src/Utilities';
import { ComKey, Item, LocKeyArray, PriKey } from '@fjell/core';

// Mock types
type TestItem = Item<'test', 'loc1', 'loc2'>;

describe('allAction', () => {
  let mockApi: HttpApi;
  let mockApiOptions: ClientApiOptions;
  let mockUtilities: Utilities<TestItem, 'test', 'loc1', 'loc2'>;
  let allAction: ReturnType<typeof getAllActionOperation>;

  beforeEach(() => {
    // Mock HttpApi
    mockApi = {
      httpPost: vi.fn(),
      httpGet: vi.fn(),
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
      postOptions: {},
      writeAuthenticated: true,
    };

    // Mock Utilities
    mockUtilities = {
      verifyLocations: vi.fn(),
      getPath: vi.fn(() => '/test/path'),
      validatePK: vi.fn((items) => items),
      processArray: vi.fn((promise) => promise),
    } as any;

    allAction = getAllActionOperation(mockApi, mockApiOptions, mockUtilities);
  });

  it('should handle normal array response correctly', async () => {
    const mockResponse: [TestItem[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>] = [
      [{ id: '1', type: 'test' } as TestItem],
      ['key1', 'key2']
    ];

    (mockApi.httpPost as any).mockResolvedValue(mockResponse);

    const result = await allAction('testAction', {}, []);

    expect(result).toEqual(mockResponse);
    expect(mockApi.httpPost).toHaveBeenCalledWith('/test/path/testAction', {}, { isAuthenticated: true });
  });

  it('should handle empty object response and convert to [[],[]]', async () => {
    // Mock the server returning an empty object (Express edge case)
    const mockEmptyObjectResponse = {};
    const expectedResponse: [TestItem[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>] = [[], []];

    (mockApi.httpPost as any).mockResolvedValue(mockEmptyObjectResponse);

    const result = await allAction('testAction', {}, []);

    expect(result).toEqual(expectedResponse);
    expect(mockApi.httpPost).toHaveBeenCalledWith('/test/path/testAction', {}, { isAuthenticated: true });
  });

  it('should handle array response correctly', async () => {
    const mockArrayResponse = ['item1', 'item2'];

    (mockApi.httpPost as any).mockResolvedValue(mockArrayResponse);

    const result = await allAction('testAction', {}, []);

    expect(result).toEqual(mockArrayResponse);
  });

  it('should call utilities methods correctly', async () => {
    const mockResponse: [TestItem[], Array<PriKey<any> | ComKey<any, any, any, any, any, any> | LocKeyArray<any, any, any, any, any>>] = [
      [{ id: '1', type: 'test' } as TestItem],
      ['key1']
    ];

    (mockApi.httpPost as any).mockResolvedValue(mockResponse);

    await allAction('testAction', { param: 'value' }, ['loc1', 'loc2']);

    expect(mockUtilities.verifyLocations).toHaveBeenCalledWith(['loc1', 'loc2']);
    expect(mockUtilities.getPath).toHaveBeenCalledWith(['loc1', 'loc2']);
    expect(mockUtilities.validatePK).toHaveBeenCalled();
    expect(mockUtilities.processArray).toHaveBeenCalled();
  });
});
