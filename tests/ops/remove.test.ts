import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRemoveOperation } from '../../src/ops/remove';
import type { Item, PriKey } from '@fjell/core';
import type { HttpApi } from '@fjell/http-api';
import type { ClientApiOptions } from '../../src/ClientApiOptions';
import type { Utilities } from '../../src/Utilities';

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

interface TestItem extends Item<'test'> {
  pk: PriKey<'test'>;
  name: string;
}

describe('getRemoveOperation', () => {
  let mockApi: HttpApi;
  let mockApiOptions: ClientApiOptions;
  let mockUtilities: Utilities<TestItem, 'test'>;

  let removeOp: ReturnType<typeof getRemoveOperation<TestItem, 'test'>>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockApi = {
      httpDelete: vi.fn(),
    } as any;

    mockApiOptions = {
      writeAuthenticated: true,
      deleteOptions: { timeout: 2500 },
    };

    mockUtilities = {
      getPath: vi.fn(() => '/tests/1'),
      verifyLocations: vi.fn(),
      processOne: vi.fn(),
      processArray: vi.fn(),
      convertDoc: vi.fn(),
      validatePK: vi.fn((x: any) => x),
    } as any;

    removeOp = getRemoveOperation(mockApi, mockApiOptions, mockUtilities);
  });

  it('should return void when server returns boolean', async () => {
    (mockApi.httpDelete as any) = vi.fn().mockResolvedValue(true);

    const result = await removeOp('id-1' as PriKey<'test'>);
    expect(result).toBeUndefined();
    expect(mockApi.httpDelete).toHaveBeenCalledWith(
      '/tests/1',
      expect.objectContaining({ isAuthenticated: true, timeout: 2500 })
    );
  });

  it('should return item when server returns item', async () => {
    const returnedItem = { pk: 'id-2' as PriKey<'test'>, name: 'to-be-deleted' } as TestItem;
    (mockApi.httpDelete as any) = vi.fn().mockResolvedValue(returnedItem);

    const result = await removeOp('id-2' as PriKey<'test'>);
    expect(result).toEqual(returnedItem);
  });

  it('should pass through authentication option correctly', async () => {
    mockApiOptions = { writeAuthenticated: false, deleteOptions: {} } as any;
    removeOp = getRemoveOperation(mockApi, mockApiOptions, mockUtilities);

    (mockApi.httpDelete as any) = vi.fn().mockResolvedValue(true);

    await removeOp('id-3' as PriKey<'test'>);
    const opts = (mockApi.httpDelete as any).mock.calls[0][1];
    expect(opts).toEqual(expect.objectContaining({ isAuthenticated: false }));
  });
});
