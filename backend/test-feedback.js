// Using native fetch in Node.js

const API_BASE = 'http://localhost:5000/api';

const runFeedbackTests = async () => {
  console.log('==========================================================');
  console.log('      SHARADHA STORES - AUTOMATED FEEDBACK TESTS');
  console.log('==========================================================\n');

  try {
    // 1. Submit a Review
    console.log('[1/4] Testing: POST /api/feedback (Submit Customer Review)...');
    const reviewRes = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Aditya Birla',
        customerEmail: 'customer@gmail.com',
        orderId: 'ord_test_123',
        comboName: 'Diwali Premium Sweet Box',
        rating: 5,
        type: 'review',
        comment: 'Absolutely delicious! The Ghee Laddu was so fresh and soft. Recommended!'
      })
    });

    const reviewData = await reviewRes.json();
    if (!reviewRes.ok) {
      throw new Error(`Review submit failed: ${reviewData.message}`);
    }
    console.log('✅ Success. Submitted review ID:', reviewData.feedback._id);

    // 2. Submit a Suggestion
    console.log('\n[2/4] Testing: POST /api/feedback (Submit Customer Suggestion)...');
    const suggestionRes = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Aditya Birla',
        customerEmail: 'customer@gmail.com',
        type: 'suggestion',
        comment: 'Please add a "Gluten-Free Sweet Hamper" option for health-conscious sweet lovers next festival!'
      })
    });

    const suggestionData = await suggestionRes.json();
    if (!suggestionRes.ok) {
      throw new Error(`Suggestion submit failed: ${suggestionData.message}`);
    }
    console.log('✅ Success. Submitted suggestion ID:', suggestionData.feedback._id);

    // 3. Retrieve all feedback
    console.log('\n[3/4] Testing: GET /api/feedback (Retrieve All Feedback)...');
    const getRes = await fetch(`${API_BASE}/feedback`);
    const list = await getRes.json();

    if (!getRes.ok) {
      throw new Error(`Retrieve feedback failed: ${list.message}`);
    }
    console.log(`✅ Success. Retrieved ${list.length} feedback items.`);

    // 4. Verify contents
    console.log('\n[4/4] Verifying content details...');
    const hasReview = list.some(item => item.type === 'review' && item.rating === 5);
    const hasSuggestion = list.some(item => item.type === 'suggestion' && item.comment.includes('Gluten-Free'));

    if (hasReview && hasSuggestion) {
      console.log('✅ Success. Content verification passed.');
    } else {
      throw new Error('Verification failed. Created entries not found or incorrect.');
    }

    console.log('\n==========================================================');
    console.log('🎉 ALL FEEDBACK & SUGGESTIONS INTEGRATION TESTS PASSED!');
    console.log('==========================================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
};

runFeedbackTests();
