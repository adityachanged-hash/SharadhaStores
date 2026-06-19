import mongoose from 'mongoose';

const ComboItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const HistoryLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String,
    default: ''
  }
});

const ComboPackSchema = new mongoose.Schema({
  comboName: {
    type: String,
    required: true,
    trim: true
  },
  festivalType: {
    type: String,
    required: true,
    enum: ['Diwali', 'Pongal', 'Wedding Return Gift', 'Snack Combo', 'Custom'],
    default: 'Custom'
  },
  items: [ComboItemSchema],
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  finalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  giftNote: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Published'],
    default: 'Draft'
  },
  stockStatus: {
    type: String,
    required: true,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  history: [HistoryLogSchema]
}, {
  timestamps: true
});

export default mongoose.models.ComboPack || mongoose.model('ComboPack', ComboPackSchema);
