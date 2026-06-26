const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('==========================================================');
  console.log('      SHARADHA STORES - PRODUCT RESTOCKING TESTS');
  console.log('==========================================================');

  try {
    // 1. Fetch products
    console.log('\n[1/3] Fetching products list...');
    const resProducts = await fetch(`${API_URL}/products`);
    if (!resProducts.ok) throw new Error('Failed to fetch products');
    const products = await resProducts.json();
    const product = products[0];
    console.log(`✅ Selected product: "${product.name}" (Current Stock: ${product.stock})`);

    // 2. Restock product
    console.log(`\n[2/3] Restocking product "${product.name}" by 15 units...`);
    const resRestock = await fetch(`${API_URL}/products/${product._id}/restock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 15 })
    });
    if (!resRestock.ok) {
      const errorData = await resRestock.json();
      throw new Error(`Restock request failed: ${errorData.message}`);
    }
    const restockData = await resRestock.json();
    console.log(`✅ Success. Updated product stock: ${restockData.product.stock}`);

    // 3. Verify stock
    console.log('\n[3/3] Verifying stock level in database...');
    const resVerify = await fetch(`${API_URL}/products`);
    const verifiedProducts = await resVerify.json();
    const verifiedProduct = verifiedProducts.find(p => p._id === product._id);
    
    const expectedStock = Number(product.stock) + 15;
    if (Number(verifiedProduct.stock) === expectedStock) {
      console.log(`✅ Success. Verified stock matches expected level: ${verifiedProduct.stock}`);
    } else {
      throw new Error(`Stock verification mismatch! Expected: ${expectedStock}, Found: ${verifiedProduct.stock}`);
    }

    console.log('\n==========================================================');
    console.log('🎉 PRODUCT RESTOCKING INTEGRATION TESTS PASSED!');
    console.log('==========================================================');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  }
};

runTests();
