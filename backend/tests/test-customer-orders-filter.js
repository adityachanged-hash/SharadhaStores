const BASE_URL = 'http://localhost:5000/api';

const runFilterTest = async () => {
  console.log('==========================================================');
  console.log('    SHARADHA STORES - AUTOMATED ORDER FILTERING TESTS');
  console.log('==========================================================\n');

  try {
    // 1. Fetch all orders
    console.log('[1/4] Fetching all orders...');
    const allRes = await fetch(`${BASE_URL}/orders`);
    const allOrders = await allRes.json();
    console.log(`✅ Success. Total orders in system: ${allOrders.length}\n`);

    // 2. Fetch orders for customer@gmail.com
    const email = 'customer@gmail.com';
    console.log(`[2/4] Fetching orders for: ${email}...`);
    const filteredRes = await fetch(`${BASE_URL}/orders?customerEmail=${encodeURIComponent(email)}`);
    const filteredOrders = await filteredRes.json();
    console.log(`✅ Success. Found ${filteredOrders.length} orders for ${email}.`);

    // Verify all returned orders match the email
    const allMatch = filteredOrders.every(o => o.customerEmail.toLowerCase() === email.toLowerCase());
    if (!allMatch) {
      throw new Error(`Filter mismatch! Some returned orders do not belong to ${email}.`);
    }
    console.log(`✅ Verified: All returned orders match customerEmail "${email}".\n`);

    // 3. Fetch orders for non-existent email
    const emptyEmail = 'noorders@sharadha.com';
    console.log(`[3/4] Fetching orders for: ${emptyEmail}...`);
    const emptyRes = await fetch(`${BASE_URL}/orders?customerEmail=${encodeURIComponent(emptyEmail)}`);
    const emptyOrders = await emptyRes.json();
    console.log(`✅ Success. Found ${emptyOrders.length} orders for ${emptyEmail}.`);
    
    if (emptyOrders.length !== 0) {
      throw new Error(`Filter failure! Expected 0 orders for "${emptyEmail}", but got ${emptyOrders.length}.`);
    }
    console.log(`✅ Verified: Correctly returned 0 orders for "${emptyEmail}".\n`);

    // 4. Verify dashboard stats match total order counts
    console.log('[4/4] Verifying dashboard total revenue matches order totals...');
    const dashRes = await fetch(`${BASE_URL}/dashboard`);
    const dashData = await dashRes.json();
    
    const calculatedTotalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);
    console.log(`   - Dashboard Revenue: ₹${dashData.metrics.totalRevenue}`);
    console.log(`   - Calculated Revenue: ₹${calculatedTotalRevenue}`);
    console.log(`   - Dashboard Orders Count: ${dashData.metrics.ordersCount}`);
    console.log(`   - Real Orders Count: ${allOrders.length}`);

    if (dashData.metrics.totalRevenue !== calculatedTotalRevenue || dashData.metrics.ordersCount !== allOrders.length) {
      throw new Error('Dashboard aggregates do not match order records!');
    }
    console.log('✅ Dashboard aggregates verified successfully.\n');

    console.log('==========================================================');
    console.log('🎉 CUSTOMER ORDER FILTERING TESTS PASSED SUCCESSFULLY!');
    console.log('==========================================================');

  } catch (err) {
    console.error('\n❌ FILTER TESTS FAILED:');
    console.error(err);
    process.exit(1);
  }
};

runFilterTest();
