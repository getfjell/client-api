import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUpsertOperation } from '../../src/ops/upsert';
import type { Item, LocKeyArray, PriKey } from '@fjell/core';
import type { HttpApi } from '@fjell/http-api';
import type { ClientApiOptions } from '../../src/ClientApiOptions';
import type { Utilities } from '../../src/Utilities';

// Mock the logger to keep test output clean
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

interface TestItem extends Item<'test', 'loc1'> {
  pk: PriKey<'test'>;
  name: string;
}

describe('getUpsertOperation', () => {
  let mockHttpApi: HttpApi;
  let mockApiOptions: ClientApiOptions;
  let mockUtilities: Utilities<TestItem, 'test', 'loc1'>;

  let upsert: ReturnType<typeof getUpsertOperation<TestItem, 'test', 'loc1'>>;

  const createdItem: TestItem = {
    pk: 'id-1' as PriKey<'test'>,
    name: 'name-1',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHttpApi = {
      httpGet: vi.fn(),
      httpPost: vi.fn(),
      httpPut: vi.fn(),
      httpDelete: vi.fn(),
      httpPostFile: vi.fn(),
      uploadAsync: vi.fn(),
    } as any;

    mockApiOptions = {
      writeAuthenticated: true,
      putOptions: { timeout: 5000 },
    };

    mockUtilities = {
      verifyLocations: vi.fn(),
      getPath: vi.fn().mockReturnValue('/test/path'),
      processOne: vi.fn((p: any) => p),
      validatePK: vi.fn((x: any) => x),
      processArray: vi.fn(),
      convertDoc: vi.fn(),
    } as any;

    upsert = getUpsertOperation(mockHttpApi, mockApiOptions, mockUtilities);
  });

  it('should upsert without locations', async () => {
    (mockHttpApi.httpPut as any) = vi.fn().mockResolvedValue(createdItem);

    const result = await upsert({ pk: 'id-1' as PriKey<'test'>, kt: 'test' }, { name: 'n1' });

    expect(result).toEqual(createdItem);
    expect(mockUtilities.getPath).toHaveBeenCalled();
    expect(mockHttpApi.httpPut).toHaveBeenCalledWith(
      '/test/path',
      expect.objectContaining({ upsert: true }),
      expect.objectContaining({ isAuthenticated: true, timeout: 5000 })
    );
  });

  it('should include locations as query param', async () => {
    (mockHttpApi.httpPut as any) = vi.fn().mockResolvedValue(createdItem);

    const locations: LocKeyArray<'loc1'> = ['loc1-1'];
    await upsert({ pk: 'id-2' as PriKey<'test'>, kt: 'test' }, { name: 'n2' }, locations);

    // URL should contain encoded locations param
    const urlPassed = (mockHttpApi.httpPut as any).mock.calls[0][0] as string;
    expect(urlPassed).toMatch(/\?locations=/);

    // Utilities.processOne should be used
    expect(mockUtilities.processOne).toHaveBeenCalled();
  });

  it('should merge putOptions and writeAuthenticated into request options', async () => {
    (mockHttpApi.httpPut as any) = vi.fn().mockResolvedValue(createdItem);

    await upsert({ pk: 'id-3' as PriKey<'test'>, kt: 'test' }, { name: 'n3' });

    const opts = (mockHttpApi.httpPut as any).mock.calls[0][2];
    expect(opts).toEqual(expect.objectContaining({ isAuthenticated: true, timeout: 5000 }));
  });

  it('should allow unauthenticated when writeAuthenticated is false', async () => {
    mockApiOptions = { writeAuthenticated: false, putOptions: {} } as any;
    upsert = getUpsertOperation(mockHttpApi, mockApiOptions, mockUtilities);

    (mockHttpApi.httpPut as any) = vi.fn().mockResolvedValue(createdItem);

    await upsert({ pk: 'id-4' as PriKey<'test'>, kt: 'test' }, { name: 'n4' });

    const opts = (mockHttpApi.httpPut as any).mock.calls[0][2];
    expect(opts).toEqual(expect.objectContaining({ isAuthenticated: false }));
  });
});
