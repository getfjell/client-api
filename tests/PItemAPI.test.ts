import { createPItemApi } from "../src/PItemAPI";
import { HttpApi } from "@fjell/http-api";
import { createAItemAPI } from "../src/AItemAPI";
import { Item, PriKey, UUID } from "@fjell/core";
import { ClientApi } from "../src/ClientApi";
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
vi.mock("../src/AItemAPI", () => ({
  createAItemAPI: vi.fn(),
}));

describe("PItemAPI", () => {
  let api: HttpApi;
  let pItemAPI: ClientApi<Item<"test">, "test">;
  const primaryKey: PriKey<"test"> = { kt: "test", pk: "1-1-1-1-1" as UUID };

  beforeEach(() => {
    api = {
      httpGet: vi.fn(),
      httpPost: vi.fn(),
      httpPut: vi.fn(),
      httpDelete: vi.fn(),
    } as unknown as HttpApi;
  });

  it("should call action method", async () => {

    const actionMethod = vi.fn().mockResolvedValue([{} as Item<"test">, []]);
    (createAItemAPI as Mock).mockReturnValue({ action: actionMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.action(primaryKey, "testAction", {});

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    expect(actionMethod).toHaveBeenCalledWith(primaryKey, "testAction", {});
    expect(result).toEqual([{}, []]);
  });

  it("should call all method", async () => {
    const mockResult: AllOperationResult<Item<"test">> = {
      items: [{} as Item<"test">],
      metadata: { total: 1, returned: 1, offset: 0, hasMore: false }
    };
    const allMethod = vi.fn().mockResolvedValue(mockResult);
    (createAItemAPI as Mock).mockReturnValue({ all: allMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.all({});

    expect(allMethod).toHaveBeenCalledWith({}, [], undefined);
    expect(result.items).toEqual([{}]);
    expect(result.metadata.total).toBe(1);
  });

  it("should call allAction method", async () => {
    const allActionMethod = vi.fn().mockResolvedValue([[{} as Item<"test">], []]);
    (createAItemAPI as Mock).mockReturnValue({ allAction: allActionMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.allAction("testAction", {});

    expect(allActionMethod).toHaveBeenCalledWith("testAction", {}, []);
    expect(result).toEqual([[{}], []]);
  });

  it("should call one method", async () => {
    const oneMethod = vi.fn().mockResolvedValue({} as Item<"test">);
    (createAItemAPI as Mock).mockReturnValue({ one: oneMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.one({});

    expect(oneMethod).toHaveBeenCalledWith({}, []);
    expect(result).toEqual({});
  });

  it("should call get method", async () => {
    const getMethod = vi.fn().mockResolvedValue({} as Item<"test">);
    (createAItemAPI as Mock).mockReturnValue({ get: getMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.get(primaryKey);

    expect(getMethod).toHaveBeenCalledWith(primaryKey);
    expect(result).toEqual({});
  });

  it("should call create method", async () => {
    const createMethod = vi.fn().mockResolvedValue([{ kt: "test", pk: "1-1-1-1-1" }, {} as Item<"test">]);
    (createAItemAPI as Mock).mockReturnValue({ create: createMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.create({} as Item<"test">);

    // create now passes options object (or undefined) instead of locations array
    expect(createMethod).toHaveBeenCalledWith({}, undefined);
    expect(result).toEqual([{ kt: "test", pk: "1-1-1-1-1" }, {}]);
  });

  it("should call remove method", async () => {
    const removeMethod = vi.fn().mockResolvedValue(true);
    (createAItemAPI as Mock).mockReturnValue({ remove: removeMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.remove(primaryKey);

    expect(removeMethod).toHaveBeenCalledWith(primaryKey);
    expect(result).toBe(true);
  });

  it("should call update method", async () => {
    const updateMethod = vi.fn().mockResolvedValue({} as Item<"test">);
    (createAItemAPI as Mock).mockReturnValue({ update: updateMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.update(primaryKey, {} as Item<"test">);

    expect(updateMethod).toHaveBeenCalledWith(primaryKey, {});
    expect(result).toEqual({});
  });

  it("should handle errors in action method", async () => {
    const actionMethod = vi.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as Mock).mockReturnValue({ action: actionMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.action(primaryKey, "testAction", {})).rejects.toThrow("Test Error");

    expect(actionMethod).toHaveBeenCalledWith(primaryKey, "testAction", {});
  });

  it("should handle errors in all method", async () => {
    const allMethod = vi.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as Mock).mockReturnValue({ all: allMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.all({})).rejects.toThrow("Test Error");

    expect(allMethod).toHaveBeenCalledWith({}, [], undefined);
  });

  it("should handle errors in allAction method", async () => {
    const allActionMethod = vi.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as Mock).mockReturnValue({ allAction: allActionMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.allAction("testAction", {})).rejects.toThrow("Test Error");

    expect(allActionMethod).toHaveBeenCalledWith("testAction", {}, []);
  });

  it("should handle errors in one method", async () => {
    const oneMethod = vi.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as Mock).mockReturnValue({ one: oneMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.one({})).rejects.toThrow("Test Error");

    expect(oneMethod).toHaveBeenCalledWith({}, []);
  });

  it("should handle errors in get method", async () => {
    const getMethod = vi.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as Mock).mockReturnValue({ get: getMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.get(primaryKey)).rejects.toThrow("Test Error");

    expect(getMethod).toHaveBeenCalledWith(primaryKey);
  });

  it("should handle errors in create method", async () => {
    const createMethod = vi.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as Mock).mockReturnValue({ create: createMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.create({} as Item<"test">)).rejects.toThrow("Test Error");

    // create now passes options object (or undefined) instead of locations array
    expect(createMethod).toHaveBeenCalledWith({}, undefined);
  });

  it("should handle errors in remove method", async () => {
    const removeMethod = vi.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as Mock).mockReturnValue({ remove: removeMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.remove(primaryKey)).rejects.toThrow("Test Error");

    expect(removeMethod).toHaveBeenCalledWith(primaryKey);
  });

  it("should handle errors in update method", async () => {
    const updateMethod = vi.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as Mock).mockReturnValue({ update: updateMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.update(primaryKey, {} as Item<"test">)).rejects.toThrow("Test Error");

    expect(updateMethod).toHaveBeenCalledWith(primaryKey, {});
  });

  it('should call super.find and return an array of composite items', async () => {
    const mockItems = [{} as Item<"test">];
    const findMethod = vi.fn().mockResolvedValue(mockItems);
    (createAItemAPI as Mock).mockReturnValue({ find: findMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.find('someFinder', {});

    expect(findMethod).toHaveBeenCalledWith('someFinder', {});
    expect(result).toBe(mockItems);
  });
});
