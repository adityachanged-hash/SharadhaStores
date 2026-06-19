import { db } from '../config/db.js';

// Helper: Validate items stock & calculate status
const checkStockForItems = async (items) => {
  let stockStatus = 'In Stock';
  const warnings = [];
  let canPublish = true;

  for (const item of items) {
    const productId = typeof item.product === 'object' ? item.product._id : item.product;
    const product = await db.Products.findById(productId);
    
    if (!product) {
      warnings.push(`Product with ID ${productId} not found.`);
      canPublish = false;
      stockStatus = 'Out of Stock';
      continue;
    }

    if (!product.availability) {
      warnings.push(`${product.name} is currently marked as unavailable.`);
      canPublish = false;
      stockStatus = 'Out of Stock';
      continue;
    }

    if (product.stock < item.quantity) {
      warnings.push(`${product.name} is Out of Stock (Required: ${item.quantity}, Available: ${product.stock})`);
      canPublish = false;
      stockStatus = 'Out of Stock';
    } else if (product.stock < 10) {
      warnings.push(`${product.name} is Low in Stock (Available: ${product.stock})`);
      if (stockStatus !== 'Out of Stock') {
        stockStatus = 'Low Stock';
      }
    }
  }

  return { stockStatus, warnings, canPublish };
};

// Create Combo Pack
export const createCombo = async (req, res) => {
  try {
    const { comboName, festivalType, items, basePrice, discount, giftNote, image, status } = req.body;

    // Validation
    if (!comboName || !festivalType || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing required fields. Name, Festival, and at least one item are required.' });
    }

    // Validate quantities
    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: 'Each item must have a valid product and a quantity of at least 1.' });
      }
    }

    // Check stock status
    const { stockStatus, warnings, canPublish } = await checkStockForItems(items);

    // Enforce publication rule
    if (status === 'Published' && !canPublish) {
      return res.status(400).json({ 
        message: 'Cannot publish combo. One or more items are out of stock.',
        warnings 
      });
    }

    // Calculate prices
    const numBasePrice = Number(basePrice) || 0;
    const numDiscount = Number(discount) || 0;
    const finalPrice = Math.round(numBasePrice * (1 - numDiscount / 100));

    // Prepare initial history log
    const history = [
      { action: 'Combo Created', details: `Created combo with initial price ₹${finalPrice} (${numDiscount}% off ₹${numBasePrice}).` },
      { action: 'Stock Status Evaluated', details: `Stock evaluation resulted in: ${stockStatus}. ${warnings.length} warning(s) found.` }
    ];

    if (status === 'Published') {
      history.push({ action: 'Status Updated', details: 'Combo published to storefront.' });
    }

    const newCombo = await db.ComboPacks.create({
      comboName,
      festivalType,
      items,
      basePrice: numBasePrice,
      discount: numDiscount,
      finalPrice,
      giftNote: giftNote || '',
      image: image || '',
      status: status || 'Draft',
      stockStatus,
      history
    });

    res.status(201).json({ combo: newCombo, warnings });
  } catch (error) {
    console.error('Error creating combo:', error);
    res.status(500).json({ message: 'Server error while creating combo pack', error: error.message });
  }
};

// Get All Combos (with filtering)
export const getCombos = async (req, res) => {
  try {
    const { festivalType, status } = req.query;
    const filter = {};
    if (festivalType) filter.festivalType = festivalType;
    if (status) filter.status = status;

    const combos = await db.ComboPacks.find(filter);
    res.json(combos);
  } catch (error) {
    console.error('Error fetching combos:', error);
    res.status(500).json({ message: 'Server error while fetching combo packs', error: error.message });
  }
};

// Get Combo by ID
export const getComboById = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await db.ComboPacks.findById(id);
    
    if (!combo) {
      return res.status(404).json({ message: 'Combo pack not found' });
    }

    res.json(combo);
  } catch (error) {
    console.error('Error fetching combo detail:', error);
    res.status(500).json({ message: 'Server error while fetching combo details', error: error.message });
  }
};

// Update Combo Pack
export const updateCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const { comboName, festivalType, items, basePrice, discount, giftNote, image, status } = req.body;

    const existingCombo = await db.ComboPacks.findById(id);
    if (!existingCombo) {
      return res.status(404).json({ message: 'Combo pack not found' });
    }

    // Determine target items for stock evaluation
    const targetItems = items || existingCombo.items;
    const { stockStatus, warnings, canPublish } = await checkStockForItems(targetItems);

    const targetStatus = status || existingCombo.status;
    if (targetStatus === 'Published' && !canPublish) {
      return res.status(400).json({ 
        message: 'Cannot publish combo. One or more items are out of stock.',
        warnings 
      });
    }

    // Price updates
    const targetBasePrice = basePrice !== undefined ? Number(basePrice) : existingCombo.basePrice;
    const targetDiscount = discount !== undefined ? Number(discount) : existingCombo.discount;
    const finalPrice = Math.round(targetBasePrice * (1 - targetDiscount / 100));

    // Audit logs
    const history = [...(existingCombo.history || [])];
    
    if (comboName && comboName !== existingCombo.comboName) {
      history.push({ action: 'Name Updated', details: `Changed name from "${existingCombo.comboName}" to "${comboName}".` });
    }

    if (items) {
      history.push({ action: 'Items Updated', details: 'Combo items selection updated.' });
    }

    if (targetBasePrice !== existingCombo.basePrice || targetDiscount !== existingCombo.discount) {
      history.push({ 
        action: 'Price Updated', 
        details: `Updated price to ₹${finalPrice} (Base: ₹${targetBasePrice}, Discount: ${targetDiscount}%). Was: ₹${existingCombo.finalPrice}.` 
      });
    }

    if (targetStatus !== existingCombo.status) {
      history.push({ action: 'Status Updated', details: `Status transitioned from ${existingCombo.status} to ${targetStatus}.` });
    }

    if (stockStatus !== existingCombo.stockStatus) {
      history.push({ action: 'Stock Status Updated', details: `Stock status updated from ${existingCombo.stockStatus} to ${stockStatus}.` });
    }

    const updatedCombo = await db.ComboPacks.findByIdAndUpdate(id, {
      comboName: comboName || existingCombo.comboName,
      festivalType: festivalType || existingCombo.festivalType,
      items: targetItems,
      basePrice: targetBasePrice,
      discount: targetDiscount,
      finalPrice,
      giftNote: giftNote !== undefined ? giftNote : existingCombo.giftNote,
      image: image !== undefined ? image : existingCombo.image,
      status: targetStatus,
      stockStatus,
      history
    });

    res.json({ combo: updatedCombo, warnings });
  } catch (error) {
    console.error('Error updating combo:', error);
    res.status(500).json({ message: 'Server error while updating combo pack', error: error.message });
  }
};

// Delete Combo Pack
export const deleteCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.ComboPacks.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Combo pack not found' });
    }

    res.json({ message: 'Combo pack deleted successfully', id });
  } catch (error) {
    console.error('Error deleting combo:', error);
    res.status(500).json({ message: 'Server error while deleting combo pack', error: error.message });
  }
};

// Process Combo (Check stock, save history, record recommendations)
export const processCombo = async (req, res) => {
  try {
    const { id } = req.params;
    const combo = await db.ComboPacks.findById(id);

    if (!combo) {
      return res.status(404).json({ message: 'Combo pack not found' });
    }

    // 1. Re-validate stock
    const { stockStatus, warnings, canPublish } = await checkStockForItems(combo.items);

    // 2. Adjust status if stock was depleted and it was published
    let targetStatus = combo.status;
    let autoDrafted = false;
    if (!canPublish && combo.status === 'Published') {
      targetStatus = 'Draft';
      autoDrafted = true;
    }

    // 3. Recalculate price
    const finalPrice = Math.round(combo.basePrice * (1 - combo.discount / 100));

    // 4. Generate suggestion output
    let suggestionText = `Processed check on ${new Date().toLocaleDateString()}. `;
    if (stockStatus === 'Out of Stock') {
      suggestionText += `⚠️ FAILED: Combo has out-of-stock items. Recommended action: Restock products immediately: ${warnings.join(', ')}.`;
    } else if (stockStatus === 'Low Stock') {
      suggestionText += `⚠️ WARNING: Combo stock is active but low. Products warning: ${warnings.join(', ')}. Recommended action: Limit publishing count to avoid orders backlogs.`;
    } else {
      suggestionText += `✅ SUCCESS: Combo is fully in stock. Recommended action: Prominently feature this on home screen for festival boost.`;
    }

    // Add historical notes
    const history = [...(combo.history || [])];
    history.push({
      action: 'Processed Validation',
      details: `Stock verification: ${stockStatus}. Final Price: ₹${finalPrice}. ${autoDrafted ? 'Auto-drafted due to out-of-stock items.' : ''}`
    });

    // 5. Update combo
    const updatedCombo = await db.ComboPacks.findByIdAndUpdate(id, {
      stockStatus,
      status: targetStatus,
      finalPrice,
      history
    });

    // 6. Save Recommendation History
    await db.RecommendationHistory.create({
      comboId: combo._id,
      suggestionText
    });

    res.json({
      combo: updatedCombo,
      stockStatus,
      warnings,
      autoDrafted,
      suggestionText
    });
  } catch (error) {
    console.error('Error processing combo:', error);
    res.status(500).json({ message: 'Server error while processing combo pack', error: error.message });
  }
};

// Generate rule-based smart suggestion
export const generateSuggestions = async (req, res) => {
  try {
    const { festivalType } = req.query;
    if (!festivalType) {
      return res.status(400).json({ message: 'Festival type is required' });
    }

    // Fetch all products to match IDs
    const products = await db.Products.find();

    // Helper to find a product ID by name matches
    const findProd = (keywords) => {
      const match = products.find(p => 
        keywords.some(k => p.name.toLowerCase().includes(k.toLowerCase()))
      );
      return match ? match : null;
    };

    let suggestion = {
      comboName: '',
      festivalType,
      discount: 0,
      description: '',
      giftNote: '',
      items: []
    };

    if (festivalType === 'Diwali') {
      suggestion.comboName = 'Grand Diwali Sweet & Snack Utsav';
      suggestion.discount = 15;
      suggestion.description = 'A perfect combination of premium ghee sweets and savory snacks, representing the light and joy of deepavali.';
      suggestion.giftNote = 'Wishing you a bright, safe, and sweet Diwali! Enjoy this delicious spread of authentic traditional treats.';
      
      const laddu = findProd(['laddu']);
      const mysore = findProd(['mysore', 'pak']);
      const murukku = findProd(['murukku']);
      const mixture = findProd(['mixture']);

      if (laddu) suggestion.items.push({ product: laddu, quantity: 2 });
      if (mysore) suggestion.items.push({ product: mysore, quantity: 1 });
      if (murukku) suggestion.items.push({ product: murukku, quantity: 2 });
      if (mixture) suggestion.items.push({ product: mixture, quantity: 2 });

    } else if (festivalType === 'Pongal') {
      suggestion.comboName = 'Pongal Harvest Traditional Pack';
      suggestion.discount = 10;
      suggestion.description = 'Celebrate the harvest festival of Tamil Nadu with traditional organic jaggery sweets and crispy golden snacks.';
      suggestion.giftNote = 'Happy Pongal! May the sweet rice boil over and bring abundance, prosperity, and delight to your family.';
      
      const jaggery = findProd(['jaggery', 'katli']);
      const murukku = findProd(['murukku']);
      const banana = findProd(['banana', 'chips']);

      if (jaggery) suggestion.items.push({ product: jaggery, quantity: 2 });
      if (murukku) suggestion.items.push({ product: murukku, quantity: 2 });
      if (banana) suggestion.items.push({ product: banana, quantity: 2 });

    } else if (festivalType === 'Sankranti') {
      suggestion.comboName = 'Sankranti Harvest Festival Combo';
      suggestion.discount = 12;
      suggestion.description = 'Celebrate the harvest with traditional Jaggery sweets, crispy Murukku, and delicious Ghee Laddus.';
      suggestion.giftNote = 'Wishing you a harvest of joy, prosperity, and sweet moments this Makar Sankranti!';
      
      const jaggery = findProd(['jaggery', 'katli']);
      const murukku = findProd(['murukku']);
      const laddu = findProd(['laddu']);

      if (jaggery) suggestion.items.push({ product: jaggery, quantity: 2 });
      if (murukku) suggestion.items.push({ product: murukku, quantity: 2 });
      if (laddu) suggestion.items.push({ product: laddu, quantity: 1 });

    } else if (festivalType === 'Holi') {
      suggestion.comboName = 'Holi Rangwali Sweet & Snack Box';
      suggestion.discount = 10;
      suggestion.description = 'Brighten your celebrations with a colorful spread of Mysore Pak, Ghee Laddus, and crunchy Murukku.';
      suggestion.giftNote = 'Wishing you a vibrant, joyful, and sweet Holi filled with colorful memories!';
      
      const laddu = findProd(['laddu']);
      const mysore = findProd(['mysore', 'pak']);
      const murukku = findProd(['murukku']);

      if (laddu) suggestion.items.push({ product: laddu, quantity: 2 });
      if (mysore) suggestion.items.push({ product: mysore, quantity: 1 });
      if (murukku) suggestion.items.push({ product: murukku, quantity: 2 });

    } else if (festivalType === 'Raksha Bandhan') {
      suggestion.comboName = 'Rakhi Premium Sibling Bond Box';
      suggestion.discount = 15;
      suggestion.description = 'Celebrate the cherished bond of siblings with a premium collection of Dry Fruits, Mysore Pak, and Ghee Laddus.';
      suggestion.giftNote = 'Happy Raksha Bandhan! Wishing a lifetime of love, protection, and sweet bonding.';
      
      const mysore = findProd(['mysore', 'pak']);
      const laddu = findProd(['laddu']);
      const dryFruits = findProd(['dry', 'fruit']);

      if (mysore) suggestion.items.push({ product: mysore, quantity: 2 });
      if (laddu) suggestion.items.push({ product: laddu, quantity: 2 });
      if (dryFruits) suggestion.items.push({ product: dryFruits, quantity: 1 });

    } else if (festivalType === 'Eid') {
      suggestion.comboName = 'Eid Mubarak Shahi Blessings Box';
      suggestion.discount = 18;
      suggestion.description = 'A royal collection of special Ghee Laddus, Mysore Pak, and Premium Dry Fruits to celebrate Eid.';
      suggestion.giftNote = 'Eid Mubarak! May this festive occasion bring peace, happiness, and sweet blessings to your home.';
      
      const laddu = findProd(['laddu']);
      const dryFruits = findProd(['dry', 'fruit']);
      const mysore = findProd(['mysore', 'pak']);

      if (laddu) suggestion.items.push({ product: laddu, quantity: 2 });
      if (dryFruits) suggestion.items.push({ product: dryFruits, quantity: 1 });
      if (mysore) suggestion.items.push({ product: mysore, quantity: 1 });

    } else if (festivalType === 'Christmas') {
      suggestion.comboName = 'Merry Christmas Holiday Cheer Combo';
      suggestion.discount = 10;
      suggestion.description = 'Warm up the winter holiday season with delicious Ghee Laddus, premium Dry Fruits, and crunchy Banana Chips.';
      suggestion.giftNote = 'Merry Christmas! Sending you warmth, good cheer, and sweet holiday wishes.';
      
      const dryFruits = findProd(['dry', 'fruit']);
      const laddu = findProd(['laddu']);
      const banana = findProd(['banana', 'chips']);

      if (dryFruits) suggestion.items.push({ product: dryFruits, quantity: 2 });
      if (laddu) suggestion.items.push({ product: laddu, quantity: 2 });
      if (banana) suggestion.items.push({ product: banana, quantity: 2 });

    } else if (festivalType === 'Wedding Return Gift') {
      suggestion.comboName = 'Shubh Vivah Premium Return Gift';
      suggestion.discount = 20;
      suggestion.description = 'Express your warmest gratitude to friends and family with an elegant pairing of dry fruits and rich ghee sweets.';
      suggestion.giftNote = 'Thank you for sharing in our joy and offering your blessings. Please accept this traditional gift pack.';

      const dryFruits = findProd(['dry', 'fruit']);
      const mysore = findProd(['mysore', 'pak']);
      const laddu = findProd(['laddu']);

      if (dryFruits) suggestion.items.push({ product: dryFruits, quantity: 1 });
      if (mysore) suggestion.items.push({ product: mysore, quantity: 1 });
      if (laddu) suggestion.items.push({ product: laddu, quantity: 1 });

    } else if (festivalType === 'Snack Combo') {
      suggestion.comboName = 'Traditional Crispy Munchies Platter';
      suggestion.discount = 8;
      suggestion.description = 'A select grouping of homemade south indian crispy treats and tangy pickles, ideal for afternoon snacks.';
      suggestion.giftNote = 'Snack time made special! Enjoy these authentic, preservative-free snacks prepared with love.';

      const murukku = findProd(['murukku']);
      const mixture = findProd(['mixture']);
      const banana = findProd(['banana', 'chips']);
      const pickle = findProd(['pickle']);

      if (murukku) suggestion.items.push({ product: murukku, quantity: 2 });
      if (mixture) suggestion.items.push({ product: mixture, quantity: 2 });
      if (banana) suggestion.items.push({ product: banana, quantity: 2 });
      if (pickle) suggestion.items.push({ product: pickle, quantity: 1 });

    } else {
      // Custom / default template
      suggestion.comboName = 'Traditional Assorted Combo';
      suggestion.discount = 10;
      suggestion.description = 'A curated select platter of hand-made traditional items prepared using heritage recipes.';
      suggestion.giftNote = 'Best wishes from Sharadha Stores! Made with pure love, traditional ingredients, and hygiene.';
      
      const laddu = findProd(['laddu']);
      const murukku = findProd(['murukku']);
      
      if (laddu) suggestion.items.push({ product: laddu, quantity: 1 });
      if (murukku) suggestion.items.push({ product: murukku, quantity: 1 });
    }

    // Automatically append Festive Sample Pack to all festival combo suggestions
    const samplePack = findProd(['sample', 'pack']);
    if (samplePack) {
      suggestion.items.push({ product: samplePack, quantity: 1 });
    }

    res.json(suggestion);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ message: 'Server error while generating suggestions', error: error.message });
  }
};
