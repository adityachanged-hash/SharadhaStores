import { db } from './config/db.js';

console.log('==========================================================');
console.log('      SHARADHA STORES - AUTOMATED ORDER & BILLING TESTS');
console.log('==========================================================\n');

const BASE_URL = 'http://localhost:5000/api';

const runOrderTests = async () => {
  console.log('[1/8] Checking if local backend API server is running...');
  try {
    const res = await fetch('http://localhost:5000/');
    if (!res.ok) throw new Error();
    console.log('✅ Server connection established.\n');
  } catch (err) {
    console.error('❌ ERROR: Local backend server is not running on http://localhost:5000.');
    process.exit(1);
  }

  let testComboId = null;
  let testProductId = null;
  let initialStock = 0;
  let testOrderId = null;

  try {
    // 1. Fetch products
    console.log('[2/8] Testing: GET /api/products (Fetch Catalog)');
    const prodRes = await fetch(`${BASE_URL}/products`);
    const products = await prodRes.json();
    if (products.length > 0) {
      const sampleProduct = products[0];
      testProductId = sampleProduct._id;
      initialStock = sampleProduct.stock;
      console.log(`✅ Success. Selected sample product: "${sampleProduct.name}" (Stock: ${initialStock}, Price: ₹${sampleProduct.price})\n`);
    } else {
      throw new Error('No products returned.');
    }

    // 2. Create a temporary combo (Draft)
    console.log('[3/8] Testing: POST /api/combos (Create Temporary Hamper)');
    const newComboPayload = {
      comboName: 'Order Test Hamper',
      festivalType: 'Diwali',
      items: [
        { product: testProductId, quantity: 3 }
      ],
      basePrice: 500,
      discount: 10,
      giftNote: 'Order test greeting note!',
      status: 'Draft'
    };

    const createRes = await fetch(`${BASE_URL}/combos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComboPayload)
    });
    const createData = await createRes.json();
    testComboId = createData.combo._id;
    const finalPrice = createData.combo.finalPrice;
    console.log(`✅ Success. Created combo ID: ${testComboId} with finalPrice ₹${finalPrice}.\n`);

    // 3. Publish the Combo Hamper
    console.log('[4/8] Testing: PUT /api/combos/:id (Publish Hamper)');
    const publishRes = await fetch(`${BASE_URL}/combos/${testComboId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Published' })
    });
    const publishData = await publishRes.json();
    console.log(`✅ Success. Combo status updated to: ${publishData.combo.status}.\n`);

    // 4. Place an order (Checkout Billing)
    console.log('[5/8] Testing: POST /api/orders (Place Order & Checkout)');
    const orderPayload = {
      customerName: 'Aditya Birla',
      customerEmail: 'customer@gmail.com',
      comboId: testComboId,
      shippingAddress: '456 Royal Enclave, Bengaluru, KA - 560001',
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
    console.log(`✅ Success. Order created with ID: ${testOrderId}`);
    console.log(`   - Subtotal (Hamper Price): ₹${orderData.order.subtotal}`);
    console.log(`   - Tax (5% GST): ₹${orderData.order.tax}`);
    console.log(`   - Shipping: ₹${orderData.order.shipping}`);
    console.log(`   - Grand Total: ₹${orderData.order.total}`);
    console.log(`   - Status: ${orderData.order.status}\n`);

    // Verify billing calculations
    const expectedSubtotal = finalPrice;
    const expectedTax = Math.round(expectedSubtotal * 0.05);
    const expectedShipping = expectedSubtotal >= 1000 ? 0 : 80;
    const expectedTotal = expectedSubtotal + expectedTax + expectedShipping;

    if (orderData.order.subtotal !== expectedSubtotal || 
        orderData.order.tax !== expectedTax || 
        orderData.order.shipping !== expectedShipping || 
        orderData.order.total !== expectedTotal) {
      throw new Error(`Pricing calculations mismatch! Expected total ₹${expectedTotal}, got ₹${orderData.order.total}`);
    }
    console.log('✅ Billing calculations verified successfully.\n');

    // 5. Verify product stock deduction
    console.log('[6/8] Verifying Product Stock Deduction...');
    const verifyProdRes = await fetch(`${BASE_URL}/products`);
    const verifyProds = await verifyProdRes.json();
    const updatedProduct = verifyProds.find(p => p._id === testProductId);
    const expectedStock = initialStock - 3;
    console.log(`   - Original Stock: ${initialStock}`);
    console.log(`   - Current Stock: ${updatedProduct.stock}`);
    console.log(`   - Expected Stock: ${expectedStock}`);
    
    if (updatedProduct.stock !== expectedStock) {
      throw new Error(`Stock deduction mismatch! Expected ${expectedStock}, got ${updatedProduct.stock}`);
    }
    console.log('✅ Stock deduction verified successfully.\n');

    // 6. Verify Combo audit log history
    console.log('[7/8] Verifying Combo Audit Log History...');
    const verifyComboRes = await fetch(`${BASE_URL}/combos/${testComboId}`);
    const verifyCombo = await verifyComboRes.json();
    const orderLog = verifyCombo.history.find(h => h.action === 'Hamper Ordered');
    
    if (!orderLog) {
      throw new Error('No "Hamper Ordered" audit history entry found on the combo pack!');
    }
    console.log(`✅ Success. Audit entry found: "${orderLog.details}"\n`);

    // 7. Update order dispatch status
    console.log('[8/8] Testing: PUT /api/orders/:id/status (Update Dispatch Status)');
    const statusRes = await fetch(`${BASE_URL}/orders/${testOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Shipped' })
    });
    const statusData = await statusRes.json();
    console.log(`✅ Success. Order status updated to: "${statusData.order.status}"\n`);

    // Clean up: delete the temporary combo pack
    console.log('🧹 Cleaning up temporary combo...');
    await fetch(`${BASE_URL}/combos/${testComboId}`, { method: 'DELETE' });
    console.log('✅ Temporary combo cleaned up.\n');

    console.log('==========================================================');
    console.log('🎉 ALL ORDER & BILLING INTEGRATION TESTS PASSED!');
    console.log('==========================================================');

  } catch (error) {
    console.error('\n❌ ORDER TESTS SUITE FAILED with error:');
    console.error(error);
    
    // Clean up on failure if combo was created
    if (testComboId) {
      console.log('🧹 Cleaning up temporary combo on failure...');
      await fetch(`${BASE_URL}/combos/${testComboId}`, { method: 'DELETE' });
    }
    process.exit(1);
  }
};

runOrderTests();
