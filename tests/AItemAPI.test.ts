import { createAItemAPI } from "@/AItemAPI";
import { ClientApi } from "@/ClientApi";
import { Item, PriKey, UUID } from "@fjell/core";
import { HttpApi } from "@fjell/http-api";
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock("@fjell/http-api");

describe("AItemAPI", () => {
  let api: HttpApi;
  let containersAPI: ClientApi<Item<"container">, "container">;

  const key: PriKey<"container"> = { kt: 'container', pk: "1-1-1-1-1" as UUID };
  const key2: PriKey<"container"> = { kt: 'container', pk: "2-2-2-2-2" as UUID };

  beforeEach(() => {

    api = {
      httpGet: vi.fn(),
      httpPost: vi.fn(),
      httpPut: vi.fn(),
      httpDelete: vi.fn(),
    } as unknown as HttpApi;
    containersAPI = createAItemAPI<Item<"container">, "container">(api, "container", ["containers"]);
  });

  describe("action", () => {
    it("should perform action correctly", async () => {
      const item: Item<'container'> = {
        key,
        data: {}, events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        },
      };
      api.httpPost = vi.fn().mockResolvedValue(item);
      const result = await containersAPI.action(key, "action", {});
      expect(result).toEqual(item);
    });
  });

  describe("all", () => {
    it("should get all items correctly", async () => {
      const items: Item<'container'>[] = [{
        key,
        data: {}, events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      }, {
        key: key2,
        data: {}, events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      }];
      api.httpGet = vi.fn().mockResolvedValue(items);
      const result = await containersAPI.all({}, []);
      expect(result).toEqual(items);
    });
  });

  describe("allAction", () => {
    it("should perform all action correctly", async () => {
      const item: Item<'container'> = {
        key,
        data: {},
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      };
      api.httpPost = vi.fn().mockResolvedValue([item]);
      const result = await containersAPI.allAction("action", {}, []);
      expect(result).toEqual([item]);
    });
  });

  describe("get", () => {
    it("should get item correctly", async () => {
      const item: Item<'container'> = {
        key,
        data: {}, events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      };
      api.httpGet = vi.fn().mockResolvedValue(item);
      const result = await containersAPI.get(key);
      expect(result).toEqual(item);
    });
  });

  describe("one", () => {
    it("should get one item correctly", async () => {
      const items: Item<'container'>[] = [{
        key,
        data: {},
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      }];
      api.httpGet = vi.fn().mockResolvedValue(items);
      const result = await containersAPI.one({}, []);
      expect(result).toEqual(items[0]);
    });
  });

  describe("create", () => {
    it("should create item correctly", async () => {
      const item: Item<'container'> = {
        key,
        data: {},
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      };
      api.httpPost = vi.fn().mockResolvedValue(item);
      const result = await containersAPI.create(item, []);
      expect(result).toEqual(item);
    });
  });

  describe("remove", () => {
    it("should remove item correctly", async () => {
      api.httpDelete = vi.fn().mockResolvedValue(true);
      const result = await containersAPI.remove(key);
      expect(result).toBe(true);
    });
  });

  describe("update", () => {
    it("should update item correctly", async () => {
      const item: Item<'container'> = {
        key,
        data: {},
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      };
      api.httpPut = vi.fn().mockResolvedValue(item);
      const result = await containersAPI.update(key, {
        key: "key", data: {}, events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      });
      expect(result).toEqual(item);
    });
  });

  describe("find", () => {
    it("should find items correctly", async () => {
      const items: Item<'container'>[] = [{
        key,
        data: {},
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      }, {
        key: key2,
        data: {},
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      }];
      api.httpGet = vi.fn().mockResolvedValue(items);
      const result = await containersAPI.find("testFinder", {
        param1: "value1",
        param2: 123,
        param3: true,
        param4: new Date(),
        param5: ["a", "b", "c"]
      }, []);
      expect(result).toEqual(items);
      expect(api.httpGet).toHaveBeenCalledWith(
        "/containers",
        expect.objectContaining({
          params: {
            finder: "testFinder",
            finderParams: expect.any(String)
          }
        })
      );
    });
  });
});