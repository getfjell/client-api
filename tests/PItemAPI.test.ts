import { createPItemApi } from "@/PItemAPI";
import { HttpApi } from "@fjell/http-api";
import { createAItemAPI } from "@/AItemAPI";
import { Item, PriKey, UUID } from "@fjell/core";
import { ClientApi } from "@/ClientApi";

jest.mock('@fjell/logging', () => {
  return {
    get: jest.fn().mockReturnThis(),
    getLogger: jest.fn().mockReturnThis(),
    default: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    emergency: jest.fn(),
    alert: jest.fn(),
    critical: jest.fn(),
    notice: jest.fn(),
    time: jest.fn().mockReturnThis(),
    end: jest.fn(),
    log: jest.fn(),
  }
});
jest.mock("@/AItemAPI", () => ({
  createAItemAPI: jest.fn(),
}));

describe("PItemAPI", () => {
  let api: HttpApi;
  let pItemAPI: ClientApi<Item<"test">, "test">;
  const primaryKey: PriKey<"test"> = { kt: "test", pk: "1-1-1-1-1" as UUID };

  beforeEach(() => {
    api = {
      httpGet: jest.fn(),
      httpPost: jest.fn(),
      httpPut: jest.fn(),
      httpDelete: jest.fn(),
    } as unknown as HttpApi;
  });

  it("should call action method", async () => {

    const actionMethod = jest.fn().mockResolvedValue({} as Item<"test">);
    (createAItemAPI as jest.Mock).mockReturnValue({ action: actionMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.action(primaryKey, "testAction", {}, {});

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    expect(actionMethod).toHaveBeenCalledWith(primaryKey, "testAction", {}, {});
    expect(result).toEqual({});
  });

  it("should call all method", async () => {
    const allMethod = jest.fn().mockResolvedValue([{} as Item<"test">]);
    (createAItemAPI as jest.Mock).mockReturnValue({ all: allMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.all({}, {}, []);

    expect(allMethod).toHaveBeenCalledWith({}, {}, []);
    expect(result).toEqual([{}]);
  });

  it("should call allAction method", async () => {
    const allActionMethod = jest.fn().mockResolvedValue([{} as Item<"test">]);
    (createAItemAPI as jest.Mock).mockReturnValue({ allAction: allActionMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.allAction("testAction", {}, {}, []);

    expect(allActionMethod).toHaveBeenCalledWith("testAction", {}, {}, []);
    expect(result).toEqual([{}]);
  });

  it("should call one method", async () => {
    const oneMethod = jest.fn().mockResolvedValue({} as Item<"test">);
    (createAItemAPI as jest.Mock).mockReturnValue({ one: oneMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.one({}, {}, []);

    expect(oneMethod).toHaveBeenCalledWith({}, {}, []);
    expect(result).toEqual({});
  });

  it("should call get method", async () => {
    const getMethod = jest.fn().mockResolvedValue({} as Item<"test">);
    (createAItemAPI as jest.Mock).mockReturnValue({ get: getMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.get(primaryKey, {});

    expect(getMethod).toHaveBeenCalledWith(primaryKey, {});
    expect(result).toEqual({});
  });

  it("should call create method", async () => {
    const createMethod = jest.fn().mockResolvedValue([{ kt: "test", pk: "1-1-1-1-1" }, {} as Item<"test">]);
    (createAItemAPI as jest.Mock).mockReturnValue({ create: createMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.create({} as Item<"test">, {}, []);

    expect(createMethod).toHaveBeenCalledWith({}, {}, []);
    expect(result).toEqual([{ kt: "test", pk: "1-1-1-1-1" }, {}]);
  });

  it("should call remove method", async () => {
    const removeMethod = jest.fn().mockResolvedValue(true);
    (createAItemAPI as jest.Mock).mockReturnValue({ remove: removeMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.remove(primaryKey, {});

    expect(removeMethod).toHaveBeenCalledWith(primaryKey, {});
    expect(result).toBe(true);
  });

  it("should call update method", async () => {
    const updateMethod = jest.fn().mockResolvedValue({} as Item<"test">);
    (createAItemAPI as jest.Mock).mockReturnValue({ update: updateMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.update(primaryKey, {} as Item<"test">, {});

    expect(updateMethod).toHaveBeenCalledWith(primaryKey, {}, {});
    expect(result).toEqual({});
  });

  it("should handle errors in action method", async () => {
    const actionMethod = jest.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as jest.Mock).mockReturnValue({ action: actionMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.action(primaryKey, "testAction", {}, {})).rejects.toThrow("Test Error");

    expect(actionMethod).toHaveBeenCalledWith(primaryKey, "testAction", {}, {});
  });

  it("should handle errors in all method", async () => {
    const allMethod = jest.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as jest.Mock).mockReturnValue({ all: allMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});
    
    await expect(pItemAPI.all({}, {}, [])).rejects.toThrow("Test Error");

    expect(allMethod).toHaveBeenCalledWith({}, {}, []);
  });

  it("should handle errors in allAction method", async () => {
    const allActionMethod = jest.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as jest.Mock).mockReturnValue({ allAction: allActionMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.allAction("testAction", {}, {}, [])).rejects.toThrow("Test Error");

    expect(allActionMethod).toHaveBeenCalledWith("testAction", {}, {}, []);
  });

  it("should handle errors in one method", async () => {
    const oneMethod = jest.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as jest.Mock).mockReturnValue({ one: oneMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.one({}, {}, [])).rejects.toThrow("Test Error");

    expect(oneMethod).toHaveBeenCalledWith({}, {}, []);
  });

  it("should handle errors in get method", async () => {
    const getMethod = jest.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as jest.Mock).mockReturnValue({ get: getMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.get(primaryKey, {})).rejects.toThrow("Test Error");

    expect(getMethod).toHaveBeenCalledWith(primaryKey, {});
  });

  it("should handle errors in create method", async () => {
    const createMethod = jest.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as jest.Mock).mockReturnValue({ create: createMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.create({} as Item<"test">, {}, [])).rejects.toThrow("Test Error");

    expect(createMethod).toHaveBeenCalledWith({}, {}, []);
  });

  it("should handle errors in remove method", async () => {
    const removeMethod = jest.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as jest.Mock).mockReturnValue({ remove: removeMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.remove(primaryKey, {})).rejects.toThrow("Test Error");

    expect(removeMethod).toHaveBeenCalledWith(primaryKey, {});
  });

  it("should handle errors in update method", async () => {
    const updateMethod = jest.fn().mockRejectedValue(new Error("Test Error"));
    (createAItemAPI as jest.Mock).mockReturnValue({ update: updateMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    await expect(pItemAPI.update(primaryKey, {} as Item<"test">, {})).rejects.toThrow("Test Error");

    expect(updateMethod).toHaveBeenCalledWith(primaryKey, {}, {});
  });

  it('should call super.find and return an array of composite items', async () => {
    const mockItems = [{} as Item<"test">];
    const findMethod = jest.fn().mockResolvedValue(mockItems);
    (createAItemAPI as jest.Mock).mockReturnValue({ find: findMethod });

    pItemAPI = createPItemApi(api, "test", "testPath", {});

    const result = await pItemAPI.find('someFinder', {}, {}, []);

    expect(findMethod).toHaveBeenCalledWith('someFinder', {}, {}, []);
    expect(result).toBe(mockItems);
  });
});
