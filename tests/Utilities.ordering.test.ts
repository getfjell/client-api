import { describe, expect, it } from 'vitest';
import { ComKey, LocKeyArray, PriKey } from '@fjell/core';
import { createUtilities } from '../src/Utilities';

/**
 * INTEGRATION TESTS: Location Key Ordering in Path Building
 *
 * These tests validate that location key arrays are correctly ordered
 * when used to build REST API paths. This is where the bug manifested:
 * the validation in getPath() was catching incorrectly ordered keys.
 */
describe('Utilities - Location Key Ordering Integration', () => {

  describe('Path Building with Hierarchical Location Keys', () => {
    it('should build correct paths for 3-level hierarchy: Order > OrderPhase > OrderStep', () => {
      // This is the exact scenario that caused the bug
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      // Location array representing: /orders/26513/orderPhases/25826
      const parentLocations: LocKeyArray<'order', 'orderPhase'> = [
        { kt: 'order', lk: 26513 },
        { kt: 'orderPhase', lk: 25826 }
      ];

      // Should build: /orders/26513/orderPhases/25826/orderSteps
      const path = utilities.getPath(parentLocations);

      expect(path).toBe('/orders/26513/orderPhases/25826/orderSteps');
      
      // Verify that order comes before orderPhase in the path
      const orderIndex = path.indexOf('/orders/26513');
      const phaseIndex = path.indexOf('/orderPhases/25826');
      expect(orderIndex).toBeLessThan(phaseIndex);
    });

    it('should fail gracefully with clear error for incorrectly ordered location keys', () => {
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      // WRONG ORDER: child before parent
      const wrongOrderLocations: LocKeyArray<'orderPhase', 'order'> = [
        { kt: 'orderPhase', lk: 25826 }, // WRONG: should come second
        { kt: 'order', lk: 26513 }        // WRONG: should come first
      ];

      // This should throw with a clear error message
      expect(() => {
        utilities.getPath(wrongOrderLocations);
      }).toThrow(/Location keys must be ordered from parent to child/);
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

      // Representing: /orders/123/orderPhases/456
      const parentLocations: LocKeyArray<'order', 'orderPhase'> = [
        { kt: 'order', lk: 123 },
        { kt: 'orderPhase', lk: 456 }
      ];

      const path = utilities.getPath(parentLocations);

      expect(path).toBe('/orders/123/orderPhases/456/orderSteps');
    });
  });

  describe('Path Building with ComKey (Full Item Key)', () => {
    it('should build correct path from ComKey with proper ordering', () => {
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      // A full orderStep key with its parent locations
      const orderStepKey: ComKey<'orderStep', 'order', 'orderPhase'> = {
        pk: 25825,
        kt: 'orderStep',
        loc: [
          { kt: 'order', lk: 26513 },
          { kt: 'orderPhase', lk: 25826 }
        ]
      };

      const path = utilities.getPath(orderStepKey);

      // Should produce: /orders/26513/orderPhases/25826/orderSteps/25825
      expect(path).toBe('/orders/26513/orderPhases/25826/orderSteps/25825');
      
      // Verify hierarchical ordering in path
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

      // Parent locations from an orderPhase item
      const parentLocations: LocKeyArray<'order', 'orderPhase'> = [
        { kt: 'order', lk: 26513 },
        { kt: 'orderPhase', lk: 25826 }
      ];

      // This is what gets called internally in the 'all' operation
      const path = utilities.getPath(parentLocations);

      // Should produce the collection path
      expect(path).toBe('/orders/26513/orderPhases/25826/orderSteps');
    });

    it('should work correctly when getting a specific contained item', () => {
      // Simulating: api.get(itemKey) for a specific orderStep
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      const orderStepKey: ComKey<'orderStep', 'order', 'orderPhase'> = {
        pk: 25825,
        kt: 'orderStep',
        loc: [
          { kt: 'order', lk: 26513 },
          { kt: 'orderPhase', lk: 25826 }
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

      const deepKey: ComKey<'level5', 'level1', 'level2', 'level3', 'level4'> = {
        pk: 'l5-id',
        kt: 'level5',
        loc: [
          { kt: 'level1', lk: 'l1-id' },
          { kt: 'level2', lk: 'l2-id' },
          { kt: 'level3', lk: 'l3-id' },
          { kt: 'level4', lk: 'l4-id' }
        ]
      };

      const path = utilities.getPath(deepKey);

      expect(path).toBe('/level1s/l1-id/level2s/l2-id/level3s/l3-id/level4s/l4-id/level5s/l5-id');
      
      // Verify ordering
      expect(path.indexOf('level1s')).toBeLessThan(path.indexOf('level2s'));
      expect(path.indexOf('level2s')).toBeLessThan(path.indexOf('level3s'));
      expect(path.indexOf('level3s')).toBeLessThan(path.indexOf('level4s'));
      expect(path.indexOf('level4s')).toBeLessThan(path.indexOf('level5s'));
    });
  });

  describe('Order Validation Edge Cases', () => {
    it('should reject locations in reverse order', () => {
      const utilities = createUtilities('level3', ['level1s', 'level2s', 'level3s']);

      // Completely reversed order
      const reversedLocations: LocKeyArray<'level2', 'level1'> = [
        { kt: 'level2', lk: 'l2-id' },
        { kt: 'level1', lk: 'l1-id' }
      ];

      expect(() => {
        utilities.getPath(reversedLocations);
      }).toThrow();
    });

    it('should reject partially misordered locations', () => {
      const utilities = createUtilities('level4', ['level1s', 'level2s', 'level3s', 'level4s']);

      // level1 and level3 are swapped
      const misordered: LocKeyArray<'level3', 'level2', 'level1'> = [
        { kt: 'level3', lk: 'l3-id' }, // Wrong position
        { kt: 'level2', lk: 'l2-id' },
        { kt: 'level1', lk: 'l1-id' }  // Wrong position
      ];

      expect(() => {
        utilities.getPath(misordered);
      }).toThrow();
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

  describe('Validation Error Messages', () => {
    it('should provide clear error message with diagnostic info', () => {
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      const wrongOrder: LocKeyArray<'orderPhase', 'order'> = [
        { kt: 'orderPhase', lk: 25826 },
        { kt: 'order', lk: 26513 }
      ];

      try {
        utilities.getPath(wrongOrder);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const errorMessage = (error as Error).message;
        
        // Error should mention ordering
        expect(errorMessage.toLowerCase()).toContain('order');
        
        // Error should mention hierarchy
        expect(errorMessage.toLowerCase()).toMatch(/hierarch|parent|child/);
        
        // Error should mention the problematic key type
        expect(errorMessage).toContain('order');
      }
    });
  });

  describe('Pathological Cases That Should Have Failed Before Fix', () => {
    it('should fail the exact bug scenario before fix: orderPhase before order', () => {
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      // This is what the BUG was producing: child before parent
      const buggyOrder: LocKeyArray<'orderPhase', 'order'> = [
        { kt: 'orderPhase', lk: 25826 }, // BUG: child first
        { kt: 'order', lk: 26513 }        // BUG: parent second
      ];

      // This MUST throw an error
      expect(() => {
        utilities.getPath(buggyOrder);
      }).toThrow(/Location keys must be ordered from parent to child/);
    });

    it('should document what the old buggy implementation would have produced', () => {
      // This test documents the bug for posterity
      const utilities = createUtilities('orderStep', ['orders', 'orderPhases', 'orderSteps']);

      // The OLD buggy itemKeyToLocKeyArray would have produced this from a ComKey:
      // [{ kt: 'orderStep' }, { kt: 'orderPhase' }, { kt: 'order' }]
      // Which is COMPLETELY BACKWARDS
      
      const oldBuggyOutput: LocKeyArray<'orderStep', 'orderPhase', 'order'> = [
        { kt: 'orderStep', lk: 25825 },   // Most nested (leaf) - WRONG to be first
        { kt: 'orderPhase', lk: 25826 },  // Middle - WRONG order
        { kt: 'order', lk: 26513 }        // Root - WRONG to be last
      ];

      // This should fail validation
      expect(() => {
        utilities.getPath(oldBuggyOutput);
      }).toThrow();
    });
  });

  describe('Contract Validation: Location Arrays Must Be Root-to-Leaf', () => {
    /**
     * These tests encode the fundamental contract:
     * Location arrays MUST be ordered from root to leaf (parent to child)
     */
    
    it('should validate the contract for simple parent-child relationship', () => {
      const utilities = createUtilities('child', ['parents', 'children']);

      // CORRECT: parent first, child second
      const correct: LocKeyArray<'parent'> = [
        { kt: 'parent', lk: 'p-id' }
      ];

      expect(() => {
        utilities.getPath(correct);
      }).not.toThrow();

      const path = utilities.getPath(correct);
      expect(path).toBe('/parents/p-id/children');
    });

    it('should enforce the contract for grandparent-parent-child relationship', () => {
      const utilities = createUtilities('child', ['grandparents', 'parents', 'children']);

      // CORRECT: grandparent, then parent, then child location
      const correct: LocKeyArray<'grandparent', 'parent'> = [
        { kt: 'grandparent', lk: 'gp-id' },
        { kt: 'parent', lk: 'p-id' }
      ];

      expect(() => {
        utilities.getPath(correct);
      }).not.toThrow();

      // WRONG: parent before grandparent
      const wrong: LocKeyArray<'parent', 'grandparent'> = [
        { kt: 'parent', lk: 'p-id' },
        { kt: 'grandparent', lk: 'gp-id' }
      ];

      expect(() => {
        utilities.getPath(wrong);
      }).toThrow();
    });
  });
});

