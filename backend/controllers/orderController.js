import { db } from '../config/db.js';

// Create a new order (Checkout Billing)
export const createOrder = async (req, res) => {
  try {
    const { customerName, customerEmail, comboId, productId, quantity = 1, shippingAddress, paymentMethod, phoneNumber, walletApplied = 0 } = req.body;

    // 1. Validation
    if (!customerName || !customerEmail || (!comboId && !productId) || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Missing required fields. Name, email, (comboId or productId), address, and payment method are required.' });
    }

    let orderItems = [];
    let subtotal = 0;
    const newOrderPayload = {
      customerName,
      customerEmail,
      shippingAddress,
      phoneNumber,
      paymentMethod,
      status: 'Pending',
      history: [{ status: 'Pending', timestamp: new Date() }]
    };

    if (productId) {
      // 2a. Direct Product Purchase Flow
      const product = await db.Products.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ 
          message: `Cannot place order. "${product.name}" does not have sufficient stock. Required: ${quantity}, Available: ${product.stock}` 
        });
      }

      // Deduct stock from product catalog
      await db.Products.findByIdAndUpdate(productId, {
        stock: product.stock - quantity
      });

      orderItems = [{
        productName: product.name,
        price: product.price,
        quantity: Number(quantity)
      }];

      subtotal = product.price * Number(quantity);
      newOrderPayload.comboId = 'N/A'; // For Mongoose schema validation backwards-compatibility
      newOrderPayload.comboName = product.name; // Keep compatible with existing columns
      newOrderPayload.productId = productId;
      newOrderPayload.productName = product.name;
    } else {
      // 2b. Combo Pack Purchase Flow
      const combo = await db.ComboPacks.findById(comboId);
      if (!combo) {
        return res.status(404).json({ message: 'Combo pack hamper not found.' });
      }

      // Stock Check & Deduction Prep
      const productsToUpdate = [];
      for (const item of combo.items) {
        const product = await db.Products.findById(item.product._id || item.product);
        if (!product) {
          return res.status(404).json({ message: `Included product "${item.product.name || 'Unknown'}" not found.` });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            message: `Cannot place order. "${product.name}" does not have sufficient stock. Required: ${item.quantity}, Available: ${product.stock}` 
          });
        }

        productsToUpdate.push({
          product,
          newStock: product.stock - item.quantity
        });
      }

      // Deduct stock
      for (const update of productsToUpdate) {
        await db.Products.findByIdAndUpdate(update.product._id, {
          stock: update.newStock
        });
      }

      orderItems = combo.items.map(item => ({
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      }));

      subtotal = combo.finalPrice;
      newOrderPayload.comboId = comboId;
      newOrderPayload.comboName = combo.comboName;
    }

    // 3. Calculate Pricing Breakups
    const giftCharges = Number(req.body.giftCharges || 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST standard food tax
    const shipping = subtotal >= 1000 ? 0 : 80; // Free shipping over ₹1000, else ₹80
    let total = subtotal + tax + shipping + giftCharges;

    // 3.5 Apply Wallet Balance if requested
    const walletDeduction = Number(walletApplied);
    if (walletDeduction > 0) {
      const currentBalance = await db.Wallets.getBalance(customerEmail);
      if (walletDeduction > currentBalance) {
        return res.status(400).json({ message: 'Insufficient wallet balance.' });
      }
      if (walletDeduction > total) {
        return res.status(400).json({ message: 'Wallet deduction cannot exceed total order value.' });
      }
      
      await db.Wallets.deductBalance(customerEmail, walletDeduction);
      total -= walletDeduction;
      newOrderPayload.notes = (newOrderPayload.notes || '') + `\n[Wallet Applied: ₹${walletDeduction}]`;
    }

    newOrderPayload.items = orderItems;
    newOrderPayload.subtotal = subtotal;
    newOrderPayload.tax = tax;
    newOrderPayload.shipping = shipping;
    newOrderPayload.giftCharges = giftCharges;
    newOrderPayload.total = total;

    // 4. Save Order
    const newOrder = await db.Orders.create(newOrderPayload);

    // 5. If combo order, log action in Combo Hamper Audit History and check stock status
    if (comboId && comboId !== 'N/A') {
      const combo = await db.ComboPacks.findById(comboId);
      if (combo) {
        const history = [...(combo.history || [])];
        history.push({
          action: 'Hamper Ordered',
          details: `Placed order (ID: ${newOrder._id}) by ${customerName} (${customerEmail}). Total paid: ₹${total} (GST: ₹${tax}, Shipping: ₹${shipping}).`
        });

        // Run stock status check
        let stockStatus = 'In Stock';
        for (const item of combo.items) {
          const product = await db.Products.findById(item.product._id || item.product);
          if (product.stock < item.quantity) {
            stockStatus = 'Out of Stock';
            break;
          } else if (product.stock < 10 && stockStatus !== 'Out of Stock') {
            stockStatus = 'Low Stock';
          }
        }

        await db.ComboPacks.findByIdAndUpdate(comboId, {
          stockStatus,
          status: stockStatus === 'Out of Stock' ? 'Draft' : combo.status,
          history
        });
      }
    }

    res.status(201).json({
      message: 'Order placed successfully!',
      order: newOrder
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error while placing order', error: error.message });
  }
};

// Retrieve all orders
export const getOrders = async (req, res) => {
  try {
    const query = {};
    if (req.query.customerEmail) {
      query.customerEmail = req.query.customerEmail;
    }
    const orders = await db.Orders.find(query);
    res.json(orders);
  } catch (error) {
    console.error('Error retrieving orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders', error: error.message });
  }
};

// Update Order dispatch status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid dispatch status.' });
    }

    const order = await db.Orders.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const history = order.history || [];
    if (history.length === 0) {
      history.push({ status: 'Pending', timestamp: order.createdAt || new Date() });
    }

    if (!history.some(h => h.status === status)) {
      history.push({ status, timestamp: new Date() });
    }

    const updates = { status, history };
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      updates.total = Math.round(order.total / 2);
      updates.subtotal = Math.round(order.subtotal / 2);
      updates.tax = Math.round(order.tax / 2);
      updates.shipping = Math.round(order.shipping / 2);
      if (order.giftCharges) {
        updates.giftCharges = Math.round(order.giftCharges / 2);
      }

      // Restock items
      if (order.productId && order.productId !== 'N/A') {
        const product = await db.Products.findById(order.productId);
        if (product) {
          const qty = order.items && order.items[0] ? order.items[0].quantity : 1;
          await db.Products.findByIdAndUpdate(order.productId, { stock: Number(product.stock) + Number(qty) });
        }
      } else if (order.comboId && order.comboId !== 'N/A') {
        const combo = await db.ComboPacks.findById(order.comboId);
        if (combo) {
          for (const comboItem of combo.items) {
            const product = await db.Products.findById(comboItem.product._id || comboItem.product);
            if (product) {
              await db.Products.findByIdAndUpdate(product._id, { stock: Number(product.stock) + Number(comboItem.quantity) });
            }
          }
        }
      }
      
      // Credit 50% refund to customer wallet
      const refundAmount = updates.total; // already Math.round(order.total / 2)
      if (refundAmount > 0 && order.customerEmail) {
        await db.Wallets.addBalance(order.customerEmail, refundAmount);
      }
      
      // Retain remaining 50% in admin's wallet as cancellation revenue
      const remainingAmount = order.total - refundAmount;
      if (remainingAmount > 0) {
        await db.Wallets.addBalance('admin@sharadha.com', remainingAmount);
      }
    }

    const updated = await db.Orders.findByIdAndUpdate(id, updates);

    res.json({
      message: 'Order status updated successfully',
      order: { ...order, ...updates }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error while updating order status', error: error.message });
  }
};
