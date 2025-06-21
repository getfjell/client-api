import { describe, expect, it } from 'vitest';
import { Item, LocKey, LocKeyArray, PriKey, UUID } from "@fjell/core";
import { createUtilities } from "@/Utilities";

describe("Utilities", () => {
  const pkType = "test";
  const pathNames = ["tests", "containers"];

  const utilities = createUtilities<Item<"test", "container">, "test", "container">(pkType, pathNames);

  const testKey: PriKey<"test"> = { kt: "test", pk: "1-1-1-1-1" as UUID };
  const containerKey: LocKey<"container"> = { kt: "container", lk: "container-1" };

  describe("verifyLocations", () => {
    it("should validate correct number of locations", () => {
      const locations = [containerKey];
      expect(utilities.verifyLocations(locations as LocKeyArray<"container">)).toBe(true);
    });

    it("should throw error if not enough locations", () => {
      const locations: [] = [];
      expect(() => utilities.verifyLocations(locations)).toThrow(
        "Not enough locations for pathNames"
      );
    });
  });

  describe("processOne", () => {
    it("should process single item response", async () => {
      const mockItem: Item<"test", "container"> = {
        key: testKey,
        data: {},
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      };

      const result = await utilities.processOne(Promise.resolve(mockItem));
      expect(result).toEqual(mockItem);
    });
  });

  describe("processArray", () => {
    it("should process array of items", async () => {
      const mockItems: Item<"test", "container">[] = [{
        key: testKey,
        data: {},
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      }];

      const result = await utilities.processArray(Promise.resolve(mockItems));
      expect(result).toEqual(mockItems);
    });

    it("should throw error if response is not array", async () => {
      const invalidResponse = {} as any;
      await expect(utilities.processArray(Promise.resolve(invalidResponse)))
        .rejects.toThrow("Response was not an array");
    });
  });

  describe("convertDoc", () => {
    it("should convert dates in events", () => {
      const now = new Date();
      const doc: Item<"test", "container"> = {
        key: testKey,
        data: {},
        events: {
          created: { at: now },
          updated: { at: now },
          deleted: { at: null }
        }
      };

      const result = utilities.convertDoc(doc);
      expect(result.events.created.at).toBeInstanceOf(Date);
      expect(result.events.updated.at).toBeInstanceOf(Date);
      expect(result.events.deleted.at).toBeNull();
    });
  });

  describe("getPath", () => {
    it("should generate path for PriKey", () => {
      const pkType = "test";
      const pathNames = ["tests"];
      const utilities = createUtilities<Item<"test">, "test">(pkType, pathNames);
      const testKey: PriKey<"test"> = { kt: "test", pk: "1-1-1-1-1" as UUID };

      const path = utilities.getPath(testKey);
      expect(path).toBe("/tests/1-1-1-1-1");
    });

    it("should generate path for LocKey array", () => {
      const pkType = "test";
      const pathNames = ["tests", "containers"];

      const utilities = createUtilities<Item<"test", "container">, "test", "container">(pkType, pathNames);

      const containerKey: LocKey<"container"> = { kt: "container", lk: "container-1" };
      const path = utilities.getPath([containerKey]);
      expect(path).toBe("/containers/container-1/tests");
    });
  });

  describe("validatePK", () => {
    it("should validate single item", () => {
      const item: Item<"test", "container"> = {
        key: testKey,
        data: {},
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      };

      const result = utilities.validatePK(item);
      expect(result).toEqual(item);
    });

    it("should validate array of items", () => {
      const items: Item<"test", "container">[] = [{
        key: testKey,
        data: {},
        events: {
          created: { at: new Date() },
          updated: { at: new Date() },
          deleted: { at: null }
        }
      }];

      const result = utilities.validatePK(items);
      expect(result).toEqual(items);
    });
  });
});
