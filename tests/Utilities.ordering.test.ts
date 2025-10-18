import { describe, expect, it } from 'vitest';
import { ComKey, LocKeyArray, PriKey } from '@fjell/core';
import { createUtilities } from '../src/Utilities';

/**
 * INTEGRATION TESTS: Location Key to REST Path Building
 *
 * These tests validate that location key arrays are correctly transformed
 * into REST API paths. Location keys come in child->parent order from core,
 * and need to be reversed to build parent->child REST paths.
 *
 * Note: Location key validation is handled by @fjell/core before these
 * utilities are called. These tests focus solely on path building.
 */
describe('Utilities - REST Path Building', () => {

  describe('Path Building with Hierarchical Location Keys', () => {
    it('should build correct paths for 3-level hierarchy: Order > OrderPhase > OrderStep', () => {
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      // Location array from core (CHILD -> PARENT order)
      const parentLocations: LocKeyArray<'orderPhase', 'order'> = [
        { kt: 'orderPhase', lk: 25826 },
        { kt: 'order', lk: 26513 }
      ];

      // Should build: /orders/26513/orderPhases/25826/orderSteps
      const path = utilities.getPath(parentLocations);

      expect(path).toBe('/orders/26513/orderPhases/25826/orderSteps');
      
      // Verify that order comes before orderPhase in the path (parent->child)
      const orderIndex = path.indexOf('/orders/26513');
      const phaseIndex = path.indexOf('/orderPhases/25826');
      expect(orderIndex).toBeLessThan(phaseIndex);
    });

    it('should build paths for single-level containment', () => {
      const utilities = createUtilities('orderPhase', ['orders', 'orderPhases']);

      const parentLocations: LocKeyArray<'order'> = [
        { kt: 'order', lk: 26513 }
      ];

      const path = utilities.getPath(parentLocations);

      expect(path).toBe('/orders/26513/orderPhases');
    });

    it('should build paths for 2-level containment', () => {
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      // CHILD -> PARENT order from core
      const parentLocations: LocKeyArray<'orderPhase', 'order'> = [
        { kt: 'orderPhase', lk: 456 },
        { kt: 'order', lk: 123 }
      ];

      const path = utilities.getPath(parentLocations);

      expect(path).toBe('/orders/123/orderPhases/456/orderSteps');
    });
  });

  describe('Path Building with ComKey (Full Item Key)', () => {
    it('should build correct path from ComKey with hierarchical locations', () => {
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      // A full orderStep key with its parent locations (CHILD -> PARENT in loc array)
      const orderStepKey: ComKey<'orderStep', 'orderPhase', 'order'> = {
        pk: 25825,
        kt: 'orderStep',
        loc: [
          { kt: 'orderPhase', lk: 25826 },
          { kt: 'order', lk: 26513 }
        ]
      };

      const path = utilities.getPath(orderStepKey);

      // Should produce: /orders/26513/orderPhases/25826/orderSteps/25825
      expect(path).toBe('/orders/26513/orderPhases/25826/orderSteps/25825');
      
      // Verify hierarchical ordering in path (parent->child->item)
      expect(path.indexOf('orders')).toBeLessThan(path.indexOf('orderPhases'));
      expect(path.indexOf('orderPhases')).toBeLessThan(path.indexOf('orderSteps'));
    });

    it('should handle ComKey for single-level containment', () => {
      const utilities = createUtilities('orderPhase', ['orders', 'orderPhases']);

      const orderPhaseKey: ComKey<'orderPhase', 'order'> = {
        pk: 25826,
        kt: 'orderPhase',
        loc: [
          { kt: 'order', lk: 26513 }
        ]
      };

      const path = utilities.getPath(orderPhaseKey);

      expect(path).toBe('/orders/26513/orderPhases/25826');
    });

    it('should handle PriKey (no containment)', () => {
      const utilities = createUtilities('order', ['orders']);

      const orderKey: PriKey<'order'> = {
        pk: 26513,
        kt: 'order'
      };

      const path = utilities.getPath(orderKey);

      expect(path).toBe('/orders/26513');
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should work correctly when querying contained items (all operation)', () => {
      // Simulating: api.all(query, parentLocations) for orderSteps
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      // Parent locations from an orderPhase item (CHILD -> PARENT)
      const parentLocations: LocKeyArray<'orderPhase', 'order'> = [
        { kt: 'orderPhase', lk: 25826 },
        { kt: 'order', lk: 26513 }
      ];

      // This is what gets called internally in the 'all' operation
      const path = utilities.getPath(parentLocations);

      // Should produce the collection path
      expect(path).toBe('/orders/26513/orderPhases/25826/orderSteps');
    });

    it('should work correctly when getting a specific contained item', () => {
      // Simulating: api.get(itemKey) for a specific orderStep
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      // CHILD -> PARENT order in loc array
      const orderStepKey: ComKey<'orderStep', 'orderPhase', 'order'> = {
        pk: 25825,
        kt: 'orderStep',
        loc: [
          { kt: 'orderPhase', lk: 25826 },
          { kt: 'order', lk: 26513 }
        ]
      };

      const path = utilities.getPath(orderStepKey);

      // Should produce the item path
      expect(path).toBe('/orders/26513/orderPhases/25826/orderSteps/25825');
    });

    it('should work with deeply nested hierarchies (5 levels)', () => {
      const utilities = createUtilities('level5', [
        'level1s',
        'level2s',
        'level3s',
        'level4s',
        'level5s'
      ]);

      // CHILD -> PARENT order (level4 is most immediate parent of level5)
      const deepKey: ComKey<'level5', 'level4', 'level3', 'level2', 'level1'> = {
        pk: 'l5-id',
        kt: 'level5',
        loc: [
          { kt: 'level4', lk: 'l4-id' },
          { kt: 'level3', lk: 'l3-id' },
          { kt: 'level2', lk: 'l2-id' },
          { kt: 'level1', lk: 'l1-id' }
        ]
      };

      const path = utilities.getPath(deepKey);

      expect(path).toBe('/level1s/l1-id/level2s/l2-id/level3s/l3-id/level4s/l4-id/level5s/l5-id');
      
      // Verify ordering (parent->child in path)
      expect(path.indexOf('level1s')).toBeLessThan(path.indexOf('level2s'));
      expect(path.indexOf('level2s')).toBeLessThan(path.indexOf('level3s'));
      expect(path.indexOf('level3s')).toBeLessThan(path.indexOf('level4s'));
      expect(path.indexOf('level4s')).toBeLessThan(path.indexOf('level5s'));
    });
  });

  describe('Path Building Edge Cases', () => {
    it('should handle empty location array', () => {
      const utilities = createUtilities('order', ['orders']);
      
      const path = utilities.getPath([]);
      
      expect(path).toBe('/orders');
    });

    it('should accept correctly ordered locations with gaps in hierarchy', () => {
      // Sometimes not all levels are present in pathNames
      const utilities = createUtilities('child', ['grandparent', 'child']);

      const locations: LocKeyArray<'grandparent'> = [
        { kt: 'grandparent', lk: 'gp-id' }
      ];

      const path = utilities.getPath(locations);

      expect(path).toBe('/grandparent/gp-id/child');
    });
  });

  describe('Contract: Location Arrays Are Child-to-Parent', () => {
    /**
     * These tests document the fundamental contract:
     * Location arrays from core ARE ALWAYS ordered from child to parent (leaf to root).
     * The utilities reverse them to build parent->child REST paths.
     */
    
    it('should handle simple parent-child relationship', () => {
      const utilities = createUtilities('child', ['parents', 'children']);

      const correct: LocKeyArray<'parent'> = [
        { kt: 'parent', lk: 'p-id' }
      ];

      const path = utilities.getPath(correct);
      expect(path).toBe('/parents/p-id/children');
    });

    it('should handle grandparent-parent-child relationship', () => {
      const utilities = createUtilities('child', ['grandparents', 'parents', 'children']);

      // Core provides: parent, then grandparent (child -> parent order)
      const correct: LocKeyArray<'parent', 'grandparent'> = [
        { kt: 'parent', lk: 'p-id' },
        { kt: 'grandparent', lk: 'gp-id' }
      ];

      const path = utilities.getPath(correct);
      
      // Path should be: grandparent -> parent -> children (reversed)
      expect(path).toBe('/grandparents/gp-id/parents/p-id/children');
    });
  });

  describe('Path Component Matching', () => {
    it('should correctly match key types to path names', () => {
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      const locations: LocKeyArray<'orderPhase', 'order'> = [
        { kt: 'orderPhase', lk: 100 },
        { kt: 'order', lk: 200 }
      ];

      const path = utilities.getPath(locations);

      // Verify correct matching: order -> orders, orderPhase -> orderPhases
      expect(path).toContain('/orders/200');
      expect(path).toContain('/orderPhases/100');
    });

    it('should handle different path name formats', () => {
      const utilities = createUtilities('item', ['categories', 'items']);

      const locations: LocKeyArray<'category'> = [
        { kt: 'category', lk: 'cat-1' }
      ];

      const path = utilities.getPath(locations);

      expect(path).toBe('/categories/cat-1/items');
    });
  });
});
