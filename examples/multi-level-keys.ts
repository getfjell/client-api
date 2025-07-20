/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Multi-Level Keys Fjell-Client-API Example - Hierarchical Data Operations
 *
 * This example demonstrates advanced usage of fjell-client-api with multi-level
 * hierarchical data structures. It shows how to work with contained items across
 * multiple organizational levels.
 *
 * This example covers:
 * - Multi-level location hierarchies (Organization → Department → Employee)
 * - Nested contained item APIs with location arrays
 * - Cross-hierarchy queries and operations
 * - Location-based data management
 * - Complex API routing with multiple path segments
 *
 * Run this example with: npx tsx examples/multi-level-keys.ts
 *
 * Note: This is a conceptual example showing hierarchical API patterns.
 * In production, use actual fjell-client-api with proper types.
 */

/**
 * Organizational Hierarchy:
 * Organization (Primary) → Department (Contained) → Employee (Contained)
 *
 * API Structure:
 * - /organizations/{orgId}
 * - /organizations/{orgId}/departments/{deptId}
 * - /organizations/{orgId}/departments/{deptId}/employees/{empId}
 */

// ===== Mock Hierarchical API Implementations =====

interface MockHierarchicalApi {
  all(query: any, locations?: any[]): Promise<any[]>;
  create(item: any, locations?: any[]): Promise<any>;
  get(key: any): Promise<any>;
  update(key: any, updates: any): Promise<any>;
  remove(key: any): Promise<boolean>;
  action(key: any, action: string, body?: any): Promise<any>;
  find(finder: string, params?: any, locations?: any[]): Promise<any[]>;
  facet(key: any, facet: string, params?: any): Promise<any>;
  allAction(action: string, body?: any, locations?: any[]): Promise<any[]>;
  allFacet(facet: string, params?: any, locations?: any[]): Promise<any>;
}

const createMockHierarchicalApi = (itemType: string, levelDepth: number): MockHierarchicalApi => ({
  async all(query: any, locations?: any[]) {
    const locationPath = locations ? `/${locations.join('/')}` : '';
    console.log(`📊 HierarchicalApi.all(${itemType}) at level ${levelDepth} - path:${locationPath}, query:`, query);

    const items = Array.from({ length: 3 }, (_, i) => ({
      id: `${itemType}-${i + 1}`,
      name: `${itemType} ${i + 1}`,
      keyType: itemType,
      ...(locations && { parentPath: locations })
    }));

    return items;
  },

  async create(item: any, locations?: any[]) {
    const locationPath = locations ? `/${locations.join('/')}` : '';
    const created = {
      ...item,
      id: `${itemType}-${Date.now()}`,
      parentPath: locations
    };
    console.log(`➕ HierarchicalApi.create(${itemType}) at level ${levelDepth} - path:${locationPath}, created:`, created.id);
    return created;
  },

  async get(key: any) {
    console.log(`🔍 HierarchicalApi.get(${itemType}) at level ${levelDepth} - key:`, key);
    return {
      id: key.id,
      name: `${itemType} ${key.id}`,
      keyType: itemType,
      level: levelDepth
    };
  },

  async update(key: any, updates: any) {
    console.log(`✏️ HierarchicalApi.update(${itemType}) at level ${levelDepth} - key:`, key, 'updates:', updates);
    return { id: key.id, ...updates, keyType: itemType, level: levelDepth };
  },

  async remove(key: any) {
    console.log(`🗑️ HierarchicalApi.remove(${itemType}) at level ${levelDepth} - key:`, key);
    return true;
  },

  async action(key: any, action: string, body?: any) {
    console.log(`⚡ HierarchicalApi.action(${itemType}) at level ${levelDepth} - action:`, action, 'on:', key.id);
    return { success: true, action, result: body, level: levelDepth };
  },

  async find(finder: string, params?: any, locations?: any[]) {
    const locationPath = locations ? `/${locations.join('/')}` : '';
    console.log(`🔍 HierarchicalApi.find(${itemType}) at level ${levelDepth} - finder:`, finder, 'path:', locationPath);
    return [{
      id: '1',
      name: `Found ${itemType}`,
      keyType: itemType,
      level: levelDepth,
      parentPath: locations
    }];
  },

  async facet(key: any, facet: string, params?: any) {
    console.log(`📈 HierarchicalApi.facet(${itemType}) at level ${levelDepth} - facet:`, facet, 'on:', key.id);
    return {
      facet,
      level: levelDepth,
      data: { count: 10 + levelDepth, hierarchy: `Level ${levelDepth}` }
    };
  },

  async allAction(action: string, body?: any, locations?: any[]) {
    const locationPath = locations ? `/${locations.join('/')}` : '';
    console.log(`📦 HierarchicalApi.allAction(${itemType}) at level ${levelDepth} - action:`, action, 'path:', locationPath);
    return [
      { id: '1', result: 'updated', level: levelDepth },
      { id: '2', result: 'updated', level: levelDepth }
    ];
  },

  async allFacet(facet: string, params?: any, locations?: any[]) {
    const locationPath = locations ? `/${locations.join('/')}` : '';
    console.log(`📊 HierarchicalApi.allFacet(${itemType}) at level ${levelDepth} - facet:`, facet, 'path:', locationPath);
    return {
      facet,
      level: levelDepth,
      totalCount: 50 + (levelDepth * 10),
      data: `Level ${levelDepth} aggregated results`,
      locationPath
    };
  }
});

/**
 * Demonstrates Organization operations (Primary Items - Level 0)
 */
async function demonstrateOrganizationOperations() {
  console.log('\n🚀 === Organization Operations (Primary Items - Level 0) ===');

  // Conceptual: const orgApi = createPItemApi<Organization, 'organization'>('organization', ['organizations'], config);
  const orgApi = createMockHierarchicalApi('organization', 0);

  try {
    // 1. Get all organizations
    console.log('\n📊 Getting all organizations...');
    const organizations = await orgApi.all({});
    console.log(`Found ${organizations.length} organizations`);

    // 2. Create a new organization
    console.log('\n➕ Creating a new organization...');
    const newOrg = {
      name: 'TechCorp International',
      type: 'Technology',
      founded: '2020',
      keyType: 'organization'
    };
    const createdOrg = await orgApi.create(newOrg);
    console.log(`Created organization: ${createdOrg.name} (${createdOrg.id})`);

    // 3. Get organization analytics
    console.log('\n📈 Getting organization analytics...');
    const orgKey = { keyType: 'organization', id: createdOrg.id };
    const analytics = await orgApi.facet(orgKey, 'analytics', {
      metrics: ['employees', 'departments', 'revenue']
    });
    console.log(`Organization analytics:`, analytics);

    return createdOrg.id;

  } catch (error) {
    console.error('❌ Error in organization operations:', error);
    return null;
  }
}

/**
 * Demonstrates Department operations (Contained Items - Level 1)
 */
async function demonstrateDepartmentOperations(organizationId: string) {
  console.log('\n🚀 === Department Operations (Contained Items - Level 1) ===');

  // Conceptual: const deptApi = createCItemApi<Department, 'department', 'organization'>('department', ['organizations', 'departments'], config);
  const deptApi = createMockHierarchicalApi('department', 1);

  try {
    // Organization location for departments
    const orgLocation = [organizationId];

    // 1. Get all departments in organization
    console.log('\n📊 Getting all departments in organization...');
    const departments = await deptApi.all({ active: true }, orgLocation);
    console.log(`Found ${departments.length} departments in organization`);

    // 2. Create multiple departments
    console.log('\n➕ Creating departments...');
    const departmentData = [
      { name: 'Engineering', type: 'Development', budget: 1000000 },
      { name: 'Marketing', type: 'Business', budget: 500000 },
      { name: 'Sales', type: 'Revenue', budget: 750000 }
    ];

    const createdDepartments = [];
    for (const deptData of departmentData) {
      const newDept = { ...deptData, keyType: 'department' };
      const created = await deptApi.create(newDept, orgLocation);
      createdDepartments.push(created);
      console.log(`Created department: ${created.name} (${created.id})`);
    }

    // 3. Execute batch operations on departments
    console.log('\n📦 Executing batch budget update...');
    await deptApi.allAction('updateBudgets', {
      adjustment: 0.10, // 10% increase
      reason: 'Annual review'
    }, orgLocation);
    console.log('Batch budget update completed');

    // 4. Get department analytics
    console.log('\n📊 Getting department analytics...');
    const deptAnalytics = await deptApi.allFacet('budgetAnalysis', {
      period: 'quarterly',
      includeProjections: true
    }, orgLocation);
    console.log(`Department analytics:`, deptAnalytics);

    // 5. Find departments by criteria
    console.log('\n🔍 Finding high-budget departments...');
    const highBudgetDepts = await deptApi.find('byBudgetRange', {
      minBudget: 600000,
      maxBudget: 2000000
    }, orgLocation);
    console.log(`Found ${highBudgetDepts.length} high-budget departments`);

    return createdDepartments.map(d => d.id);

  } catch (error) {
    console.error('❌ Error in department operations:', error);
    return [];
  }
}

/**
 * Demonstrates Employee operations (Contained Items - Level 2)
 */
async function demonstrateEmployeeOperations(organizationId: string, departmentIds: string[]) {
  console.log('\n🚀 === Employee Operations (Contained Items - Level 2) ===');

  // Conceptual: const empApi = createCItemApi<Employee, 'employee', 'organization', 'department'>('employee', ['organizations', 'departments', 'employees'], config);
  const empApi = createMockHierarchicalApi('employee', 2);

  try {
    const engineeringDeptId = departmentIds[0]; // Engineering department
    const marketingDeptId = departmentIds[1];   // Marketing department

    // Multi-level location paths
    const engineeringLocation = [organizationId, engineeringDeptId];
    const marketingLocation = [organizationId, marketingDeptId];

    // 1. Add employees to Engineering department
    console.log('\n👨‍💻 Adding employees to Engineering department...');
    const engineeringEmployees = [
      { name: 'Alice Johnson', role: 'Senior Developer', salary: 120000, skills: ['React', 'Node.js'] },
      { name: 'Bob Smith', role: 'DevOps Engineer', salary: 110000, skills: ['AWS', 'Docker'] },
      { name: 'Carol Chen', role: 'Tech Lead', salary: 140000, skills: ['Architecture', 'Mentoring'] }
    ];

    for (const empData of engineeringEmployees) {
      const newEmp = { ...empData, keyType: 'employee' };
      const created = await empApi.create(newEmp, engineeringLocation);
      console.log(`Added to Engineering: ${created.name} - ${created.role}`);
    }

    // 2. Add employees to Marketing department
    console.log('\n📢 Adding employees to Marketing department...');
    const marketingEmployees = [
      { name: 'David Wilson', role: 'Marketing Manager', salary: 95000, skills: ['Strategy', 'Analytics'] },
      { name: 'Emma Davis', role: 'Content Creator', salary: 70000, skills: ['Writing', 'Design'] }
    ];

    for (const empData of marketingEmployees) {
      const newEmp = { ...empData, keyType: 'employee' };
      const created = await empApi.create(newEmp, marketingLocation);
      console.log(`Added to Marketing: ${created.name} - ${created.role}`);
    }

    // 3. Get all employees in Engineering
    console.log('\n📊 Getting all Engineering employees...');
    const engineeringTeam = await empApi.all({ active: true }, engineeringLocation);
    console.log(`Engineering team has ${engineeringTeam.length} employees`);

    // 4. Cross-department analytics
    console.log('\n📈 Getting cross-department employee analytics...');

    // Analytics for Engineering department
    const engAnalytics = await empApi.allFacet('teamMetrics', {
      metrics: ['performance', 'skills', 'satisfaction']
    }, engineeringLocation);
    console.log(`Engineering metrics:`, engAnalytics);

    // Analytics for Marketing department
    const mktAnalytics = await empApi.allFacet('teamMetrics', {
      metrics: ['campaigns', 'creativity', 'results']
    }, marketingLocation);
    console.log(`Marketing metrics:`, mktAnalytics);

    // 5. Find employees by skills across departments
    console.log('\n🔍 Finding employees with specific skills...');

    // Find React developers in Engineering
    const reactDevs = await empApi.find('bySkill', { skill: 'React' }, engineeringLocation);
    console.log(`Found ${reactDevs.length} React developers in Engineering`);

    // Find creative talent in Marketing
    const creatives = await empApi.find('bySkill', { skill: 'Design' }, marketingLocation);
    console.log(`Found ${creatives.length} creative employees in Marketing`);

    // 6. Execute department-specific actions
    console.log('\n⚡ Executing department-specific actions...');

    // Performance review for Engineering
    await empApi.allAction('startPerformanceReview', {
      type: 'technical',
      reviewCycle: 'quarterly'
    }, engineeringLocation);
    console.log('Started technical performance reviews for Engineering');

    // Campaign planning for Marketing
    await empApi.allAction('planCampaign', {
      type: 'product-launch',
      budget: 50000
    }, marketingLocation);
    console.log('Started campaign planning for Marketing');

    // 7. Individual employee operations
    console.log('\n👤 Individual employee operations...');
    const empKey = { keyType: 'employee', id: 'employee-1' };

    // Update employee
    const updatedEmp = await empApi.update(empKey, {
      salary: 125000,
      role: 'Principal Developer'
    });
    console.log(`Updated employee: ${updatedEmp.name}`);

    // Employee-specific action
    await empApi.action(empKey, 'assignProject', {
      projectId: 'proj-123',
      role: 'Technical Lead'
    });
    console.log('Assigned employee to project');

  } catch (error) {
    console.error('❌ Error in employee operations:', error);
  }
}

/**
 * Demonstrates cross-hierarchy operations and complex queries
 */
async function demonstrateCrossHierarchyOperations(organizationId: string) {
  console.log('\n🚀 === Cross-Hierarchy Operations ===');

  const orgApi = createMockHierarchicalApi('organization', 0);
  const deptApi = createMockHierarchicalApi('department', 1);
  const empApi = createMockHierarchicalApi('employee', 2);

  try {
    // 1. Organization-wide analytics
    console.log('\n📊 Organization-wide analytics...');
    const orgKey = { keyType: 'organization', id: organizationId };
    const orgAnalytics = await orgApi.facet(orgKey, 'hierarchicalAnalytics', {
      includeSublevels: true,
      metrics: ['totalEmployees', 'departmentCount', 'averageSalary', 'skillsDistribution']
    });
    console.log(`Organization analytics:`, orgAnalytics);

    // 2. Department-level aggregations
    console.log('\n📈 Department-level aggregations...');
    const orgLocation = [organizationId];
    const deptAggregations = await deptApi.allFacet('aggregatedMetrics', {
      groupBy: ['type', 'budget'],
      calculations: ['sum', 'average', 'count']
    }, orgLocation);
    console.log(`Department aggregations:`, deptAggregations);

    // 3. Cross-department employee search
    console.log('\n🔍 Cross-department employee search...');
    // Note: In a real implementation, this might be a special endpoint or query
    console.log('Searching for employees across all departments...');
    console.log('(In production, this would use a cross-hierarchy search endpoint)');

    // 4. Organizational restructuring simulation
    console.log('\n🔄 Organizational restructuring simulation...');
    await orgApi.action(orgKey, 'simulateRestructure', {
      changes: [
        { type: 'mergeDepartments', source: 'dept-1', target: 'dept-2' },
        { type: 'createDepartment', name: 'Innovation' }
      ]
    });
    console.log('Restructuring simulation completed');

  } catch (error) {
    console.error('❌ Error in cross-hierarchy operations:', error);
  }
}

/**
 * Main function to run the multi-level keys example
 */
export async function runMultiLevelKeysExample() {
  console.log('🎯 Fjell-Client-API Multi-Level Keys Example');
  console.log('============================================');
  console.log('Demonstrating hierarchical data operations with multi-level location keys\n');

  try {
    // Level 0: Create and manage organizations
    const organizationId = await demonstrateOrganizationOperations();

    if (!organizationId) {
      throw new Error('Failed to create organization');
    }

    // Level 1: Create and manage departments within organization
    const departmentIds = await demonstrateDepartmentOperations(organizationId);

    if (departmentIds.length === 0) {
      throw new Error('Failed to create departments');
    }

    // Level 2: Create and manage employees within departments
    await demonstrateEmployeeOperations(organizationId, departmentIds);

    // Cross-hierarchy operations
    await demonstrateCrossHierarchyOperations(organizationId);

    console.log('\n✅ Multi-level keys example completed successfully!');
    console.log('\nKey Concepts Demonstrated:');
    console.log('• Hierarchical data organization (Organization → Department → Employee)');
    console.log('• Multi-level location keys for contained items');
    console.log('• Complex API routing with nested path segments');
    console.log('• Cross-hierarchy queries and analytics');
    console.log('• Department and employee-specific operations');
    console.log('• Organizational data management patterns');
    console.log('\nLocation Key Patterns:');
    console.log('• Level 0 (Primary): /organizations/{orgId}');
    console.log('• Level 1 (Contained): /organizations/{orgId}/departments/{deptId}');
    console.log('• Level 2 (Contained): /organizations/{orgId}/departments/{deptId}/employees/{empId}');
    console.log('\nNote: This is a conceptual example showing hierarchical API patterns.');
    console.log('In production, use actual fjell-client-api with proper types.');

  } catch (error) {
    console.error('❌ Multi-level keys example failed:', error);
    throw error;
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiLevelKeysExample().catch(console.error);
}
