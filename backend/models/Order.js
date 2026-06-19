import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const OrderHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Packed', 'Shipped', 'Delivered', 'Cancelled']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true
  },
  comboId: {
    type: String,
    required: false
  },
  comboName: {
    type: String,
    required: false
  },
  productId: {
    type: String,
    required: false
  },
  productName: {
    type: String,
    required: false
  },
  items: [OrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  shipping: {
    type: Number,
    required: true,
    min: 0
  },
  giftCharges: {
    type: Number,
    required: false,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: false,
    trim: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['UPI', 'Credit/Debit Card', 'Cash on Delivery'],
    default: 'UPI'
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  history: [OrderHistorySchema]
}, {
  timestamps: true
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
