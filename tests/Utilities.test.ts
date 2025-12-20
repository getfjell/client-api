import { describe, expect, it } from 'vitest';
import { Item, LocKey, LocKeyArray, PriKey, UUID } from "@fjell/types";
import { createUtilities } from "../src/Utilities";

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

    it("should generate path for nested entities with correct order (order -> orderForm -> orderNoseShape)", () => {
      // This tests the case where we have:
      // - order (primary entity, level 1)
      // - orderForm (contained in order, level 2)
      // - orderNoseShape (contained in orderForm, level 3)
      const pkType = "orderNoseShape";
      const pathNames = ["fjell/order", "orderForm", "orderNoseShape"];

      const utilities = createUtilities<Item<"orderNoseShape", "order", "orderForm">, "orderNoseShape", "order", "orderForm">(
        pkType,
        pathNames
      );

      // For a 3-level hierarchy, the loc array contains ALL ancestor keys from outermost to innermost
      const orderKey: LocKey<"order"> = { kt: "order", lk: "26669" };
      const orderFormKey: LocKey<"orderForm"> = { kt: "orderForm", lk: "26693" };
      
      // ComKey for orderNoseShape with full location hierarchy
      const comKey = {
        kt: "orderNoseShape" as const,
        pk: "nose-123" as UUID,
        loc: [orderFormKey, orderKey]  // CHILD -> PARENT order: orderForm first, then order
      };

      const path = utilities.getPath(comKey);
      
      // Expected: /fjell/order/<orderId>/orderForm/<orderFormId>/orderNoseShape/<noseId>
      // The hierarchy should be maintained: order (parent) -> orderForm (child) -> orderNoseShape (grandchild)
      expect(path).toBe("/fjell/order/26669/orderForm/26693/orderNoseShape/nose-123");
    });

    it("should generate path for collection access with location keys only (order -> orderForm -> orderNoseShape collection)", () => {
      // This tests accessing the orderNoseShape COLLECTION within a specific orderForm
      const pkType = "orderNoseShape";
      const pathNames = ["fjell/order", "orderForm", "orderNoseShape"];

      const utilities = createUtilities<Item<"orderNoseShape", "order", "orderForm">, "orderNoseShape", "order", "orderForm">(
        pkType,
        pathNames
      );

      // When accessing a collection, we only pass location keys (no PriKey for the item itself)
      const orderKey: LocKey<"order"> = { kt: "order", lk: "26669" };
      const orderFormKey: LocKey<"orderForm"> = { kt: "orderForm", lk: "26693" };
      
      // CHILD -> PARENT order
      const path = utilities.getPath([orderFormKey, orderKey]);
      
      // Expected: /fjell/order/<orderId>/orderForm/<orderFormId>/orderNoseShape
      // This should follow the pathNames order: order first, then orderForm, then collection name
      expect(path).toBe("/fjell/order/26669/orderForm/26693/orderNoseShape");
    });

    it("should generate path for deeply nested ComKey with multiple location levels", () => {
      const pkType = "child";
      const pathNames = ["parents", "children"];

      const utilities = createUtilities<Item<"child", "parent">, "child", "parent">(
        pkType,
        pathNames
      );

      const parentKey: LocKey<"parent"> = { kt: "parent", lk: "parent-1" };
      const comKey = {
        kt: "child" as const,
        pk: "child-1" as UUID,
        loc: [parentKey]
      };

      const path = utilities.getPath(comKey);
      
      // Expected: /parents/parent-1/children/child-1
      // The hierarchy should be maintained: parent first, then child
      expect(path).toBe("/parents/parent-1/children/child-1");
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
