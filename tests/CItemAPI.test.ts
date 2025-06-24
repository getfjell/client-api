import { createAItemAPI } from '@/AItemAPI';
import { createCItemApi } from '@/CItemAPI';
import { ClientApi } from '@/ClientApi';
import { ComKey, Item, LocKey, TypesProperties, UUID } from '@fjell/core';
import { HttpApi } from '@fjell/http-api';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
vi.mock('@/AItemAPI', () => ({
  createAItemAPI: vi.fn(),
}));

type TestItem = Item<'test', 'container'>;
type TestComKey = ComKey<'test', 'container'>;
type TestLocKey = LocKey<'container'>;

describe('CItemAPI', () => {
  let api: HttpApi;
  let cItemApi: ClientApi<TestItem, 'test', 'container'>;
  const locKey: TestLocKey = { kt: 'container', lk: '1-1-1-1-1' as UUID };

  beforeEach(() => {
    api = {
      httpGet: vi.fn(),
      httpPost: vi.fn(),
      httpPut: vi.fn(),
      httpDelete: vi.fn(),
    } as unknown as HttpApi;
  });

  it('should call super.action and return a composite item', async () => {
    const mockItem = {} as TestItem;

    const actionMethod = vi.fn().mockResolvedValue(mockItem);
    (createAItemAPI as Mock).mockReturnValue({ action: actionMethod });

    cItemApi = createCItemApi<TestItem, 'test', 'container'>(api, 'test', ['tests', 'containers'], {});

    const result = await cItemApi.action({} as TestComKey, 'someAction', {});

    expect(actionMethod).toHaveBeenCalledWith({}, 'someAction', {});
    expect(result).toBe(mockItem);
  });

  it('should call super.all and return an array of composite items', async () => {
    const mockItems = [{} as TestItem];

    const allMethod = vi.fn().mockResolvedValue(mockItems);
    (createAItemAPI as Mock).mockReturnValue({ all: allMethod });

    cItemApi = createCItemApi<TestItem, 'test', 'container'>(api, 'test', ['tests', 'containers'], {});

    const result = await cItemApi.all({}, [locKey]);

    expect(allMethod).toHaveBeenCalledWith({}, [locKey]);
    expect(result).toBe(mockItems);
  });

  it('should call super.allAction and return a composite item', async () => {
    const mockItem = {} as TestItem;

    const allActionMethod = vi.fn().mockResolvedValue([mockItem]);
    (createAItemAPI as Mock).mockReturnValue({ allAction: allActionMethod });

    cItemApi = createCItemApi<TestItem, 'test', 'container'>(api, 'test', ['tests', 'containers'], {});

    const result = await cItemApi.allAction('someAction', {}, [locKey]);

    expect(allActionMethod).toHaveBeenCalledWith('someAction', {}, [locKey]);
    expect(result).toEqual([mockItem]);
  });

  it('should call super.one and return a composite item or null', async () => {
    const mockItem = {} as TestItem;

    const oneMethod = vi.fn().mockResolvedValue(mockItem);
    (createAItemAPI as Mock).mockReturnValue({ one: oneMethod });

    cItemApi = createCItemApi<TestItem, 'test', 'container'>(api, 'test', ['tests', 'containers'], {});

    const result = await cItemApi.one({}, [locKey]);

    expect(oneMethod).toHaveBeenCalledWith({}, [locKey]);
    expect(result).toBe(mockItem);
  });

  it('should call super.get and return a composite item or null', async () => {
    const mockItem = {} as TestItem;

    const getMethod = vi.fn().mockResolvedValue(mockItem);
    (createAItemAPI as Mock).mockReturnValue({ get: getMethod });

    cItemApi = createCItemApi<TestItem, 'test', 'container'>(api, 'test', ['tests', 'containers'], {});

    const result = await cItemApi.get({} as TestComKey);

    expect(getMethod).toHaveBeenCalledWith({});
    expect(result).toBe(mockItem);
  });

  it('should call super.create and return a composite item and its key', async () => {
    const mockItem = {} as TestItem;
    const createMethod = vi.fn().mockResolvedValue(mockItem);
    (createAItemAPI as Mock).mockReturnValue({ create: createMethod });

    cItemApi = createCItemApi<TestItem, 'test', 'container'>(api, 'test', ['tests', 'containers'], {});

    const result = await cItemApi.create({} as TypesProperties<TestItem, 'test', 'container'>, [locKey]);

    expect(createMethod).toHaveBeenCalledWith({}, [locKey]);
    expect(result).toEqual(mockItem);
  });

  it('should call super.remove and return a boolean', async () => {
    const removeMethod = vi.fn().mockResolvedValue(true);
    (createAItemAPI as Mock).mockReturnValue({ remove: removeMethod });

    cItemApi = createCItemApi<TestItem, 'test', 'container'>(api, 'test', ['tests', 'containers'], {});

    const result = await cItemApi.remove({} as TestComKey);

    expect(removeMethod).toHaveBeenCalledWith({});
    expect(result).toBe(true);
  });

  it('should call super.update and return a composite item', async () => {
    const mockItem = {} as TestItem;
    const updateMethod = vi.fn().mockResolvedValue(mockItem);
    (createAItemAPI as Mock).mockReturnValue({ update: updateMethod });

    cItemApi = createCItemApi<TestItem, 'test', 'container'>(api, 'test', ['tests', 'containers'], {});

    const result = await cItemApi.update({} as TestComKey, {} as TypesProperties<TestItem, 'test', 'container'>);

    expect(updateMethod).toHaveBeenCalledWith({}, {});
    expect(result).toBe(mockItem);
  });

  it('should call super.find and return an array of composite items', async () => {
    const mockItems = [{} as TestItem];
    const findMethod = vi.fn().mockResolvedValue(mockItems);
    (createAItemAPI as Mock).mockReturnValue({ find: findMethod });

    cItemApi = createCItemApi<TestItem, 'test', 'container'>(api, 'test', ['tests', 'containers'], {});

    const result = await cItemApi.find('someFinder', {}, [locKey]);

    expect(findMethod).toHaveBeenCalledWith('someFinder', {}, [locKey]);
    expect(result).toBe(mockItems);
  });

});