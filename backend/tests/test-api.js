import { db } from './config/db.js';

// Standalone automated verification script
console.log('==========================================================');
console.log('      SHARADHA STORES - AUTOMATED API SMOKE TESTS');
console.log('==========================================================\n');

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('[1/10] Checking if local backend API server is running...');
  try {
    const res = await fetch('http://localhost:5000/');
    if (!res.ok) throw new Error();
    console.log('✅ Server connection established.\n');
  } catch (err) {
    console.error('❌ ERROR: Local backend server is not running on http://localhost:5000.');
    console.log('Please start the server first (e.g., run npm run dev) and run this test again.');
    process.exit(1);
  }

  let testComboId = null;
  let testProductId = null;

  try {
    // 1. Fetch products catalog
    console.log('[2/10] Testing: GET /api/products (Fetch Catalog)');
    const prodRes = await fetch(`${BASE_URL}/products`);
    const products = await prodRes.json();
    if (products.length > 0) {
      testProductId = products[0]._id;
      console.log(`✅ Success. Retained ${products.length} products. Sample: "${products[0].name}"\n`);
    } else {
      throw new Error('No products returned. Catalog seeding failed.');
    }

    // 2. Fetch dashboard stats
    console.log('[3/10] Testing: GET /api/dashboard (Dashboard Aggregates)');
    const dashRes = await fetch(`${BASE_URL}/dashboard`);
    const dashData = await dashRes.json();
    console.log(`✅ Success. Total Combos: ${dashData.metrics.totalCombos}, Low Stock Items: ${dashData.lowStockAlerts.length}\n`);

    // 3. Fetch smart suggestions
    console.log('[4/10] Testing: GET /api/combos/suggest?festivalType=Diwali (Smart Suggester)');
    const suggRes = await fetch(`${BASE_URL}/combos/suggest?festivalType=Diwali`);
    const suggestion = await suggRes.json();
    console.log(`✅ Success. Suggested Name: "${suggestion.comboName}" with ${suggestion.discount}% discount recommendation.\n`);

    // 4. Create combo hamper (Draft)
    console.log('[5/10] Testing: POST /api/combos (Create Draft Hamper)');
    const newComboPayload = {
      comboName: 'Smoke Test Hamper',
      festivalType: 'Diwali',
      items: [
        { product: testProductId, quantity: 2 }
      ],
      basePrice: 500,
      discount: 10,
      giftNote: 'Automated smoke test greeting note!',
      status: 'Draft'
    };

    const createRes = await fetch(`${BASE_URL}/combos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComboPayload)
    });
    const createData = await createRes.json();
    testComboId = createData.combo._id;
    console.log(`✅ Success. Created combo ID: ${testComboId} with finalPrice ₹${createData.combo.finalPrice}.\n`);

    // 5. Fetch single combo details
    console.log('[6/10] Testing: GET /api/combos/:id (Retrieve Hamper Detail)');
    const detailRes = await fetch(`${BASE_URL}/combos/${testComboId}`);
    const detail = await detailRes.json();
    console.log(`✅ Success. Fetched combo: "${detail.comboName}" (${detail.status} - ${detail.stockStatus}).\n`);

    // 6. Process combo pack (stock verification, recommendations & audit logs)
    console.log('[7/10] Testing: POST /api/combos/:id/process (Process & Validate Stock)');
    const procRes = await fetch(`${BASE_URL}/combos/${testComboId}/process`, {
      method: 'POST'
    });
    const procData = await procRes.json();
    console.log(`✅ Success. Action suggestion output: "${procData.suggestionText}"\n`);

    // 7. Update combo to published status
    console.log('[8/10] Testing: PUT /api/combos/:id (Publish Hamper)');
    const updatePayload = {
      status: 'Published'
    };
    const updateRes = await fetch(`${BASE_URL}/combos/${testComboId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    const updateData = await updateRes.json();
    console.log(`✅ Success. Combo status updated to: ${updateData.combo.status}.\n`);

    // 8. Test publish block for out-of-stock quantity
    console.log('[9/10] Testing: PUT /api/combos/:id (Validate Out-of-Stock publishing block)');
    const badUpdatePayload = {
      items: [
        { product: testProductId, quantity: 9999 } // Ridiculous quantity exceeding stock
      ],
      status: 'Published'
    };
    const badUpdateRes = await fetch(`${BASE_URL}/combos/${testComboId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badUpdatePayload)
    });
    
    if (badUpdateRes.status === 400) {
      const badUpdateData = await badUpdateRes.json();
      console.log(`✅ Success. Server correctly rejected publication. Reason: "${badUpdateData.message}"\n`);
    } else {
      throw new Error(`Server should have returned 400 Bad Request but returned ${badUpdateRes.status}`);
    }

    // 9. Delete combo hamper
    console.log('[10/10] Testing: DELETE /api/combos/:id (Hamper Deletion)');
    const delRes = await fetch(`${BASE_URL}/combos/${testComboId}`, {
      method: 'DELETE'
    });
    const delData = await delRes.json();
    console.log(`✅ Success. Deleted combo ID: ${delData.id}.\n`);

    console.log('==========================================================');
    console.log('🎉 ALL SMOKE TESTS COMPLETED SUCCESSFULLY!');
    console.log('==========================================================');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED with error:');
    console.error(error);
    process.exit(1);
  }
};

runTests();
