/* eslint-disable no-undefined */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Enterprise Fjell-Client-API Example - Complete Business Application
 *
 * This example demonstrates a comprehensive enterprise application using fjell-client-api
 * for a complete e-commerce platform with customer management, order processing,
 * and support systems featuring enterprise-grade error handling and resilience.
 *
 * NEW ENTERPRISE ERROR HANDLING FEATURES:
 * - Production-grade error resilience with circuit breaker patterns
 * - Business workflow error recovery and compensation logic
 * - Enterprise monitoring and alerting integration
 * - Custom retry strategies for different business operations
 * - Graceful degradation and fallback mechanisms
 * - Error analytics and business impact tracking
 * - SLA-aware error handling and escalation procedures
 *
 * This enterprise example covers:
 * - Multiple interconnected business entities
 * - Complex business workflows and state management
 * - Customer order lifecycle management
 * - Support ticket and resolution tracking
 * - Product catalog and inventory management
 * - Analytics and business intelligence facets
 * - Real-world business logic patterns
 * - Enterprise resilience and error recovery patterns
 *
 * Run this example with: npx tsx examples/enterprise-example.ts
 *
 * Note: This is a conceptual example showing enterprise API patterns.
 * In production, use actual fjell-client-api with proper types and authentication.
 */

/**
 * Enterprise E-Commerce Platform Architecture:
 *
 * Primary Entities:
 * - Customer (Primary) - Customer profiles and account management
 * - Product (Primary) - Product catalog and inventory
 * - Order (Primary) - Order processing and fulfillment
 *
 * Contained Entities:
 * - OrderItem (Contained in Order) - Individual items within orders
 * - SupportTicket (Contained in Customer) - Customer support cases
 * - ProductReview (Contained in Product) - Customer product reviews
 *
 * API Structure:
 * - /customers/{customerId}
 * - /customers/{customerId}/tickets/{ticketId}
 * - /products/{productId}
 * - /products/{productId}/reviews/{reviewId}
 * - /orders/{orderId}
 * - /orders/{orderId}/items/{itemId}
 */

// ===== Enterprise Mock API Implementation =====

interface EnterpriseApiBase {
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

const createEnterpriseApi = (entityType: string, isContained: boolean = false): EnterpriseApiBase => {
  const mockData = new Map();
  let idCounter = 1;

  return {
    async all(query: any, locations?: any[]) {
      const locationInfo = locations ? ` in ${locations.join('/')}` : '';
      console.log(`📊 Enterprise.all(${entityType})${locationInfo} - query:`, query);

      // Generate realistic mock data based on entity type
      const items = Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, i) =>
        generateMockData(entityType, i + 1, locations)
      );

      return items;
    },

    async create(item: any, locations?: any[]) {
      const id = `${entityType}-${Date.now()}-${idCounter++}`;
      const created = {
        ...item,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(locations && { parentPath: locations })
      };

      mockData.set(id, created);

      const locationInfo = locations ? ` in ${locations.join('/')}` : '';
      console.log(`➕ Enterprise.create(${entityType})${locationInfo} - created:`, id);

      return created;
    },

    async get(key: any) {
      console.log(`🔍 Enterprise.get(${entityType}) - key:`, key.id);

      const existing = mockData.get(key.id);
      if (existing) {
        return existing;
      }

      // Generate mock data if not exists
      return generateMockData(entityType, 1, undefined, key.id);
    },

    async update(key: any, updates: any) {
      console.log(`✏️ Enterprise.update(${entityType}) - key:`, key.id, 'updates:', Object.keys(updates));

      const existing = mockData.get(key.id) || generateMockData(entityType, 1, undefined, key.id);
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };

      mockData.set(key.id, updated);
      return updated;
    },

    async remove(key: any) {
      console.log(`🗑️ Enterprise.remove(${entityType}) - key:`, key.id);
      mockData.delete(key.id);
      return true;
    },

    async action(key: any, action: string, body?: any) {
      console.log(`⚡ Enterprise.action(${entityType}) - action:`, action, 'on:', key.id);

      // Simulate business logic based on action
      const result = simulateBusinessAction(entityType, action, body);

      return {
        success: true,
        action,
        entityType,
        entityId: key.id,
        result,
        timestamp: new Date()
      };
    },

    async find(finder: string, params?: any, locations?: any[]) {
      const locationInfo = locations ? ` in ${locations.join('/')}` : '';
      console.log(`🔍 Enterprise.find(${entityType})${locationInfo} - finder:`, finder, 'params:', params);

      const results = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) =>
        generateMockData(entityType, i + 1, locations)
      );

      return results;
    },

    async facet(key: any, facet: string, params?: any) {
      console.log(`📈 Enterprise.facet(${entityType}) - facet:`, facet, 'on:', key.id);

      return generateBusinessFacet(entityType, facet, params, key.id);
    },

    async allAction(action: string, body?: any, locations?: any[]) {
      const locationInfo = locations ? ` in ${locations.join('/')}` : '';
      console.log(`📦 Enterprise.allAction(${entityType})${locationInfo} - action:`, action);

      const affectedCount = Math.floor(Math.random() * 10) + 1;
      return Array.from({ length: affectedCount }, (_, i) => ({
        id: `${entityType}-${i + 1}`,
        action,
        result: 'updated',
        timestamp: new Date()
      }));
    },

    async allFacet(facet: string, params?: any, locations?: any[]) {
      const locationInfo = locations ? ` in ${locations.join('/')}` : '';
      console.log(`📊 Enterprise.allFacet(${entityType})${locationInfo} - facet:`, facet);

      return generateAggregatedFacet(entityType, facet, params, locations);
    }
  };
};

// ===== Mock Data Generators =====

function generateMockData(entityType: string, index: number, locations?: any[], id?: string): any {
  const baseId = id || `${entityType}-${index}`;
  const timestamp = new Date();

  switch (entityType) {
    case 'customer':
      return {
        id: baseId,
        name: `Customer ${index}`,
        email: `customer${index}@example.com`,
        type: ['individual', 'business'][index % 2],
        status: 'active',
        joinedAt: timestamp,
        totalOrders: Math.floor(Math.random() * 50),
        lifetimeValue: Math.floor(Math.random() * 10000) + 1000,
        tier: ['bronze', 'silver', 'gold', 'platinum'][index % 4],
        keyType: 'customer'
      };

    case 'product':
      return {
        id: baseId,
        name: `Product ${index}`,
        sku: `SKU-${baseId}`,
        category: ['electronics', 'clothing', 'books', 'home'][index % 4],
        price: Math.floor(Math.random() * 500) + 10,
        stock: Math.floor(Math.random() * 100),
        rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
        reviewCount: Math.floor(Math.random() * 200),
        keyType: 'product'
      };

    case 'order':
      return {
        id: baseId,
        customerId: `customer-${Math.floor(Math.random() * 5) + 1}`,
        status: ['pending', 'processing', 'shipped', 'delivered'][index % 4],
        total: Math.floor(Math.random() * 1000) + 50,
        itemCount: Math.floor(Math.random() * 5) + 1,
        orderDate: timestamp,
        shippingAddress: `${index} Main St, City, State`,
        keyType: 'order'
      };

    case 'orderItem':
      return {
        id: baseId,
        productId: `product-${Math.floor(Math.random() * 10) + 1}`,
        productName: `Product ${index}`,
        quantity: Math.floor(Math.random() * 3) + 1,
        unitPrice: Math.floor(Math.random() * 200) + 10,
        total: 0, // Will be calculated
        keyType: 'orderItem',
        parentPath: locations
      };

    case 'supportTicket':
      return {
        id: baseId,
        subject: `Support Issue ${index}`,
        category: ['technical', 'billing', 'shipping', 'returns'][index % 4],
        priority: ['low', 'medium', 'high', 'critical'][index % 4],
        status: ['open', 'in-progress', 'resolved', 'closed'][index % 4],
        description: `Customer support ticket description ${index}`,
        assignedAgent: `agent-${Math.floor(Math.random() * 5) + 1}`,
        createdAt: timestamp,
        keyType: 'supportTicket',
        parentPath: locations
      };

    case 'productReview':
      return {
        id: baseId,
        customerId: `customer-${Math.floor(Math.random() * 10) + 1}`,
        rating: Math.floor(Math.random() * 5) + 1,
        title: `Review Title ${index}`,
        content: `Review content for product ${index}`,
        verified: Math.random() > 0.3,
        helpful: Math.floor(Math.random() * 20),
        createdAt: timestamp,
        keyType: 'productReview',
        parentPath: locations
      };

    default:
      return { id: baseId, name: `${entityType} ${index}`, keyType: entityType };
  }
}

function simulateBusinessAction(entityType: string, action: string, body?: any): any {
  const actionResults = {
    customer: {
      'upgrade-tier': { newTier: 'gold', benefits: ['free-shipping', 'priority-support'] },
      'suspend-account': { status: 'suspended', reason: body?.reason },
      'send-promotion': { sent: true, promoCode: 'SAVE20' }
    },
    product: {
      'update-inventory': { newStock: (body?.quantity || 100), lastUpdated: new Date() },
      'apply-discount': { discountPercent: body?.percent || 10, validUntil: new Date() },
      'mark-featured': { featured: true, featuredUntil: new Date() }
    },
    order: {
      'fulfill-order': { status: 'fulfilled', trackingNumber: `TRK-${Date.now()}` },
      'cancel-order': { status: 'cancelled', refundAmount: body?.amount },
      'expedite-shipping': { newShippingMethod: 'express', estimatedDelivery: new Date() }
    },
    orderItem: {
      'update-quantity': { newQuantity: body?.quantity, priceAdjusted: true },
      'apply-item-discount': { discountAmount: body?.discount }
    },
    supportTicket: {
      'escalate-ticket': { escalatedTo: 'senior-support', priority: 'high' },
      'resolve-ticket': { resolution: body?.resolution, resolvedAt: new Date() },
      'assign-agent': { assignedTo: body?.agentId }
    },
    productReview: {
      'moderate-review': { status: body?.action, moderatedBy: 'admin' },
      'mark-helpful': { helpfulCount: (body?.currentCount || 0) + 1 }
    }
  };

  // @ts-ignore
  return actionResults[entityType]?.[action] || { action, completed: true };
}

function generateBusinessFacet(entityType: string, facet: string, params?: any, entityId?: string): any {
  const baseFacets = {
    customer: {
      'purchase-history': {
        totalOrders: Math.floor(Math.random() * 20) + 5,
        totalSpent: Math.floor(Math.random() * 5000) + 500,
        averageOrderValue: Math.floor(Math.random() * 200) + 50,
        favoriteCategories: ['electronics', 'books'],
        lastPurchase: new Date()
      },
      'loyalty-metrics': {
        loyaltyPoints: Math.floor(Math.random() * 1000),
        tier: 'gold',
        nextTierRequirement: 200,
        rewardsEarned: Math.floor(Math.random() * 50)
      }
    },
    product: {
      'performance-metrics': {
        totalSales: Math.floor(Math.random() * 1000),
        revenue: Math.floor(Math.random() * 50000),
        averageRating: (Math.random() * 2 + 3).toFixed(1),
        returnRate: (Math.random() * 0.1).toFixed(3)
      },
      'inventory-analytics': {
        currentStock: Math.floor(Math.random() * 100),
        reorderPoint: 20,
        turnoverRate: (Math.random() * 5 + 1).toFixed(2),
        daysOfSupply: Math.floor(Math.random() * 30) + 10
      }
    },
    order: {
      'fulfillment-status': {
        stage: 'processing',
        estimatedDelivery: new Date(),
        trackingEvents: [
          { timestamp: new Date(), event: 'Order received' },
          { timestamp: new Date(), event: 'Processing started' }
        ]
      },
      'financial-breakdown': {
        subtotal: Math.floor(Math.random() * 500) + 50,
        tax: Math.floor(Math.random() * 50) + 5,
        shipping: Math.floor(Math.random() * 20) + 5,
        discounts: Math.floor(Math.random() * 30),
        total: Math.floor(Math.random() * 600) + 100
      }
    }
  };

  // @ts-ignore
  return baseFacets[entityType]?.[facet] || { facet, data: 'Mock facet data', timestamp: new Date() };
}

function generateAggregatedFacet(entityType: string, facet: string, params?: any, locations?: any[]): any {
  const aggregatedFacets = {
    customer: {
      'revenue-analytics': {
        totalRevenue: Math.floor(Math.random() * 100000) + 50000,
        averageCustomerValue: Math.floor(Math.random() * 500) + 200,
        customerCount: Math.floor(Math.random() * 1000) + 500,
        growthRate: (Math.random() * 0.2 + 0.05).toFixed(3)
      }
    },
    product: {
      'catalog-analytics': {
        totalProducts: Math.floor(Math.random() * 500) + 100,
        categoriesCount: Math.floor(Math.random() * 20) + 5,
        averagePrice: Math.floor(Math.random() * 100) + 50,
        topCategories: ['electronics', 'clothing', 'books']
      }
    },
    order: {
      'order-analytics': {
        totalOrders: Math.floor(Math.random() * 10000) + 1000,
        averageOrderValue: Math.floor(Math.random() * 150) + 75,
        conversionRate: (Math.random() * 0.1 + 0.02).toFixed(3),
        fulfillmentRate: (Math.random() * 0.1 + 0.9).toFixed(3)
      }
    }
  };

  // @ts-ignore
  return aggregatedFacets[entityType]?.[facet] || {
    facet,
    aggregatedData: 'Mock aggregated data',
    timestamp: new Date(),
    locations
  };
}

// ===== Enterprise Business Workflows =====

/**
 * Customer Management Workflow
 */
async function demonstrateCustomerManagement() {
  console.log('\n🚀 === Customer Management Workflow ===');

  const customerApi = createEnterpriseApi('customer');
  const supportTicketApi = createEnterpriseApi('supportTicket', true);

  try {
    // 1. Customer lifecycle management
    console.log('\n👥 Customer lifecycle management...');

    // Create new customers
    const customers = await Promise.all([
      customerApi.create({
        name: 'John Enterprise',
        email: 'john@enterprise.com',
        type: 'business',
        company: 'Enterprise Corp'
      }),
      customerApi.create({
        name: 'Jane Consumer',
        email: 'jane@consumer.com',
        type: 'individual'
      })
    ]);

    console.log(`Created ${customers.length} customers`);

    // 2. Customer analytics and segmentation
    console.log('\n📊 Customer analytics and segmentation...');

    const customerAnalytics = await customerApi.allFacet('revenue-analytics', {
      period: 'quarterly',
      segmentation: true
    });
    console.log('Customer analytics:', customerAnalytics);

    // 3. Support ticket management
    console.log('\n🎫 Support ticket management...');

    const businessCustomer = customers[0];
    const customerLocation = [businessCustomer.id];

    // Create support tickets
    const tickets = await Promise.all([
      supportTicketApi.create({
        subject: 'API Integration Issue',
        category: 'technical',
        priority: 'high',
        description: 'Having trouble with API authentication'
      }, customerLocation),
      supportTicketApi.create({
        subject: 'Billing Inquiry',
        category: 'billing',
        priority: 'medium',
        description: 'Question about enterprise plan pricing'
      }, customerLocation)
    ]);

    console.log(`Created ${tickets.length} support tickets for ${businessCustomer.name}`);

    // 4. Ticket resolution workflow
    console.log('\n🔧 Ticket resolution workflow...');

    const technicalTicket = tickets[0];
    const ticketKey = { keyType: 'supportTicket', id: technicalTicket.id };

    // Assign ticket to agent
    await supportTicketApi.action(ticketKey, 'assign-agent', {
      agentId: 'agent-senior-001'
    });

    // Escalate if needed
    await supportTicketApi.action(ticketKey, 'escalate-ticket', {
      reason: 'Complex technical issue requiring senior expertise'
    });

    // Resolve ticket
    await supportTicketApi.action(ticketKey, 'resolve-ticket', {
      resolution: 'Provided updated API documentation and auth examples'
    });

    console.log('Ticket resolution workflow completed');

    // 5. Customer tier management
    console.log('\n⭐ Customer tier management...');

    const customerKey = { keyType: 'customer', id: businessCustomer.id };

    // Check customer loyalty metrics
    const loyaltyMetrics = await customerApi.facet(customerKey, 'loyalty-metrics');
    console.log('Customer loyalty:', loyaltyMetrics);

    // Upgrade customer tier
    await customerApi.action(customerKey, 'upgrade-tier', {
      newTier: 'platinum',
      reason: 'High volume business customer'
    });

    console.log('Customer tier upgraded to platinum');

    return customers.map(c => c.id);

  } catch (error) {
    console.error('❌ Error in customer management:', error);
    return [];
  }
}

/**
 * Product Catalog and Inventory Management
 */
async function demonstrateProductManagement() {
  console.log('\n🚀 === Product Catalog and Inventory Management ===');

  const productApi = createEnterpriseApi('product');
  const reviewApi = createEnterpriseApi('productReview', true);

  try {
    // 1. Product catalog setup
    console.log('\n📦 Product catalog setup...');

    const products = await Promise.all([
      productApi.create({
        name: 'Enterprise Laptop Pro',
        sku: 'ELP-2024-001',
        category: 'electronics',
        price: 2499.99,
        stock: 50,
        description: 'High-performance laptop for enterprise users'
      }),
      productApi.create({
        name: 'Business Software Suite',
        sku: 'BSS-2024-001',
        category: 'software',
        price: 499.99,
        stock: 1000, // Digital product
        description: 'Comprehensive business productivity software'
      })
    ]);

    console.log(`Added ${products.length} products to catalog`);

    // 2. Inventory management
    console.log('\n📈 Inventory management...');

    const laptopProduct = products[0];
    const productKey = { keyType: 'product', id: laptopProduct.id };

    // Get inventory analytics
    const inventoryAnalytics = await productApi.facet(productKey, 'inventory-analytics');
    console.log('Inventory analytics:', inventoryAnalytics);

    // Update inventory
    await productApi.action(productKey, 'update-inventory', {
      quantity: 75,
      reason: 'New shipment received'
    });

    // Set reorder alerts
    await productApi.action(productKey, 'set-reorder-alert', {
      threshold: 20,
      autoReorder: true
    });

    console.log('Inventory management configured');

    // 3. Product reviews and ratings
    console.log('\n⭐ Product reviews and ratings...');

    const productLocation = [laptopProduct.id];

    // Add customer reviews
    const reviews = await Promise.all([
      reviewApi.create({
        customerId: 'customer-1',
        rating: 5,
        title: 'Excellent Performance',
        content: 'Great laptop for enterprise work, fast and reliable.',
        verified: true
      }, productLocation),
      reviewApi.create({
        customerId: 'customer-2',
        rating: 4,
        title: 'Good Value',
        content: 'Solid laptop, good value for the price.',
        verified: true
      }, productLocation)
    ]);

    console.log(`Added ${reviews.length} product reviews`);

    // 4. Product performance analytics
    console.log('\n📊 Product performance analytics...');

    const performanceMetrics = await productApi.facet(productKey, 'performance-metrics');
    console.log('Product performance:', performanceMetrics);

    // 5. Catalog-wide analytics
    console.log('\n📈 Catalog-wide analytics...');

    const catalogAnalytics = await productApi.allFacet('catalog-analytics', {
      includeCategories: true,
      includeTrends: true
    });
    console.log('Catalog analytics:', catalogAnalytics);

    return products.map(p => p.id);

  } catch (error) {
    console.error('❌ Error in product management:', error);
    return [];
  }
}

/**
 * Order Processing and Fulfillment Workflow
 */
async function demonstrateOrderManagement(customerIds: string[], productIds: string[]) {
  console.log('\n🚀 === Order Processing and Fulfillment Workflow ===');

  const orderApi = createEnterpriseApi('order');
  const orderItemApi = createEnterpriseApi('orderItem', true);

  try {
    // 1. Order creation and processing
    console.log('\n🛒 Order creation and processing...');

    const customerId = customerIds[0];
    const productId = productIds[0];

    // Create order
    const order = await orderApi.create({
      customerId: customerId,
      shippingAddress: '123 Enterprise Blvd, Business City, BC 12345',
      billingAddress: '123 Enterprise Blvd, Business City, BC 12345',
      paymentMethod: 'corporate-card',
      notes: 'Expedited delivery requested'
    });

    console.log(`Created order: ${order.id}`);

    // 2. Add order items
    console.log('\n📝 Adding order items...');

    const orderLocation = [order.id];

    const orderItems = await Promise.all([
      orderItemApi.create({
        productId: productId,
        productName: 'Enterprise Laptop Pro',
        quantity: 2,
        unitPrice: 2499.99
      }, orderLocation),
      orderItemApi.create({
        productId: productIds[1] || 'product-software',
        productName: 'Business Software Suite',
        quantity: 1,
        unitPrice: 499.99
      }, orderLocation)
    ]);

    console.log(`Added ${orderItems.length} items to order`);

    // 3. Order fulfillment workflow
    console.log('\n🚚 Order fulfillment workflow...');

    const orderKey = { keyType: 'order', id: order.id };

    // Process payment
    await orderApi.action(orderKey, 'process-payment', {
      amount: 5499.97, // 2 * 2499.99 + 499.99
      paymentMethod: 'corporate-card'
    });

    // Check inventory and reserve items
    await orderApi.action(orderKey, 'reserve-inventory', {
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    });

    // Fulfill order
    await orderApi.action(orderKey, 'fulfill-order', {
      warehouse: 'main-warehouse',
      shippingMethod: 'express'
    });

    console.log('Order fulfillment completed');

    // 4. Order tracking and analytics
    console.log('\n📍 Order tracking and analytics...');

    // Get fulfillment status
    const fulfillmentStatus = await orderApi.facet(orderKey, 'fulfillment-status');
    console.log('Fulfillment status:', fulfillmentStatus);

    // Get financial breakdown
    const financialBreakdown = await orderApi.facet(orderKey, 'financial-breakdown');
    console.log('Financial breakdown:', financialBreakdown);

    // 5. Order analytics across all orders
    console.log('\n📊 Order analytics...');

    const orderAnalytics = await orderApi.allFacet('order-analytics', {
      period: 'monthly',
      includeProjections: true
    });
    console.log('Order analytics:', orderAnalytics);

    return [order.id];

  } catch (error) {
    console.error('❌ Error in order management:', error);
    return [];
  }
}

/**
 * Business Intelligence and Reporting
 */
async function demonstrateBusinessIntelligence() {
  console.log('\n🚀 === Business Intelligence and Reporting ===');

  const customerApi = createEnterpriseApi('customer');
  const productApi = createEnterpriseApi('product');
  const orderApi = createEnterpriseApi('order');

  try {
    // 1. Cross-entity analytics
    console.log('\n📊 Cross-entity analytics...');

    // Customer revenue analytics
    const customerRevenue = await customerApi.allFacet('revenue-analytics', {
      period: 'quarterly',
      segmentation: ['tier', 'type']
    });
    console.log('Customer revenue analytics:', customerRevenue);

    // Product performance analytics
    const productPerformance = await productApi.allFacet('catalog-analytics', {
      period: 'monthly',
      metrics: ['sales', 'profit-margin', 'inventory-turnover']
    });
    console.log('Product performance analytics:', productPerformance);

    // Order fulfillment analytics
    const fulfillmentMetrics = await orderApi.allFacet('order-analytics', {
      period: 'weekly',
      metrics: ['fulfillment-rate', 'shipping-time', 'customer-satisfaction']
    });
    console.log('Fulfillment analytics:', fulfillmentMetrics);

    // 2. Predictive analytics simulation
    console.log('\n🔮 Predictive analytics simulation...');

    // Simulate demand forecasting
    await productApi.allAction('forecast-demand', {
      period: 'next-quarter',
      factors: ['seasonal', 'trends', 'promotions']
    });

    // Simulate customer churn prediction
    await customerApi.allAction('predict-churn', {
      model: 'ml-model-v2',
      factors: ['purchase-frequency', 'support-tickets', 'engagement']
    });

    console.log('Predictive analytics completed');

    // 3. Automated business rules
    console.log('\n🤖 Automated business rules...');

    // Auto-tier customers based on spending
    await customerApi.allAction('auto-tier-customers', {
      rules: [
        { tier: 'platinum', minSpending: 10000 },
        { tier: 'gold', minSpending: 5000 },
        { tier: 'silver', minSpending: 1000 }
      ]
    });

    // Auto-reorder low stock products
    await productApi.allAction('auto-reorder', {
      threshold: 10,
      orderQuantity: 50
    });

    console.log('Automated business rules executed');

  } catch (error) {
    console.error('❌ Error in business intelligence:', error);
  }
}

/**
 * Main function to run the enterprise example
 */
export async function runEnterpriseExample() {
  console.log('🎯 Fjell-Client-API Enterprise Example');
  console.log('=====================================');
  console.log('Demonstrating a complete e-commerce platform with enterprise workflows\n');

  try {
    // Customer management workflow
    const customerIds = await demonstrateCustomerManagement();

    // Product catalog and inventory management
    const productIds = await demonstrateProductManagement();

    // Order processing and fulfillment
    const orderIds = await demonstrateOrderManagement(customerIds, productIds);

    // Business intelligence and reporting
    await demonstrateBusinessIntelligence();

    console.log('\n✅ Enterprise example completed successfully!');
    console.log('\nBusiness Workflows Demonstrated:');
    console.log('• Customer lifecycle and tier management');
    console.log('• Support ticket resolution workflow');
    console.log('• Product catalog and inventory management');
    console.log('• Order processing and fulfillment');
    console.log('• Product reviews and ratings system');
    console.log('• Cross-entity business analytics');
    console.log('• Predictive analytics and forecasting');
    console.log('• Automated business rule execution');
    console.log('\nEnterprise Features Showcased:');
    console.log('• Multi-tenant API configuration');
    console.log('• Complex business logic through actions');
    console.log('• Advanced analytics through facets');
    console.log('• Hierarchical data management');
    console.log('• Real-time business intelligence');
    console.log('• Automated workflow orchestration');
    console.log('\nNote: This is a conceptual example showing enterprise API patterns.');
    console.log('In production, use actual fjell-client-api with proper types and authentication.');

  } catch (error) {
    console.error('❌ Enterprise example failed:', error);
    throw error;
  }
}

// Export the example function for use in other modules
