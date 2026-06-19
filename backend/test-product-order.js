console.log('==========================================================');
console.log('    SHARADHA STORES - AUTOMATED DIRECT PRODUCT ORDER TESTS');
console.log('==========================================================\n');

const BASE_URL = 'http://localhost:5000/api';

const runProductOrderTest = async () => {
  let testProductId = null;
  let initialStock = 0;
  let testOrderId = null;
  let productPrice = 0;

  try {
    // 1. Fetch products
    console.log('[1/5] Fetching products list...');
    const prodRes = await fetch(`${BASE_URL}/products`);
    const products = await prodRes.json();
    if (products.length > 0) {
      // Find a product that has stock
      const sampleProduct = products.find(p => p.stock >= 5) || products[0];
      testProductId = sampleProduct._id;
      initialStock = sampleProduct.stock;
      productPrice = sampleProduct.price;
      console.log(`✅ Success. Selected sample product: "${sampleProduct.name}" (Stock: ${initialStock}, Price: ₹${productPrice})\n`);
    } else {
      throw new Error('No products returned.');
    }

    // 2. Place an order for 2 units of this product (direct checkout)
    const qty = 2;
    console.log(`[2/5] Placing direct product order for ${qty} units...`);
    const orderPayload = {
      customerName: 'Aditya Birla',
      customerEmail: 'customer@gmail.com',
      productId: testProductId,
      quantity: qty,
      shippingAddress: '789 Heritage Road, Mysore, KA - 570001',
      paymentMethod: 'UPI'
    };

    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    if (!orderRes.ok) {
      const errData = await orderRes.json();
      throw new Error(`Order placement failed: ${errData.message}`);
    }

    const orderData = await orderRes.json();
    testOrderId = orderData.order._id;
    console.log(`✅ Success. Direct product order created with ID: ${testOrderId}`);
    console.log(`   - Subtotal (Product price * qty): ₹${orderData.order.subtotal}`);
    console.log(`   - Tax (5% GST): ₹${orderData.order.tax}`);
    console.log(`   - Shipping Fee: ₹${orderData.order.shipping}`);
    console.log(`   - Grand Total: ₹${orderData.order.total}`);
    console.log(`   - Backwards-compatible comboName: "${orderData.order.comboName}"\n`);

    // 3. Verify Calculations
    const expectedSubtotal = productPrice * qty;
    const expectedTax = Math.round(expectedSubtotal * 0.05);
    const expectedShipping = expectedSubtotal >= 1000 ? 0 : 80;
    const expectedTotal = expectedSubtotal + expectedTax + expectedShipping;

    if (orderData.order.subtotal !== expectedSubtotal || 
        orderData.order.tax !== expectedTax || 
        orderData.order.shipping !== expectedShipping || 
        orderData.order.total !== expectedTotal) {
      throw new Error(`Calculation mismatch! Expected total ₹${expectedTotal}, got ₹${orderData.order.total}`);
    }
    console.log('✅ Billing calculations verified successfully.\n');

    // 4. Verify Stock Deduction
    console.log('[3/5] Verifying stock count deduction...');
    const verifyProdRes = await fetch(`${BASE_URL}/products`);
    const verifyProds = await verifyProdRes.json();
    const updatedProduct = verifyProds.find(p => p._id === testProductId);
    const expectedStock = initialStock - qty;
    console.log(`   - Original Stock: ${initialStock}`);
    console.log(`   - Current Stock: ${updatedProduct.stock}`);
    
    if (updatedProduct.stock !== expectedStock) {
      throw new Error(`Stock deduction mismatch! Expected ${expectedStock}, got ${updatedProduct.stock}`);
    }
    console.log('✅ Stock deduction verified successfully.\n');

    // 5. Verify order is listed in dashboard stats
    console.log('[4/5] Verifying recent order appears in dashboard statistics...');
    const dashRes = await fetch(`${BASE_URL}/dashboard`);
    const dashData = await dashRes.json();
    const foundInDashboard = dashData.recentOrders.find(o => o._id === testOrderId);
    
    if (!foundInDashboard) {
      throw new Error('Order not found in recent orders lists of dashboard!');
    }
    console.log(`✅ Success. Order found in dashboard list under: "${foundInDashboard.comboName}".\n`);

    // 6. Complete Order status changes
    console.log('[5/5] Testing order dispatch status transition to "Packed"...');
    const statusRes = await fetch(`${BASE_URL}/orders/${testOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Packed' })
    });
    const statusData = await statusRes.json();
    console.log(`✅ Success. Status updated to: ${statusData.order.status}.\n`);

    console.log('==========================================================');
    console.log('🎉 DIRECT PRODUCT ORDER TESTS PASSED SUCCESSFULLY!');
    console.log('==========================================================');

  } catch (err) {
    console.error('\n❌ DIRECT PRODUCT ORDER TESTS FAILED:');
    console.error(err);
    process.exit(1);
  }
};

runProductOrderTest();
