import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
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
  orderId: {
    type: String,
    required: false
  },
  comboName: {
    type: String,
    required: false
  },
  rating: {
    type: Number,
    required: false,
    min: 1,
    max: 5
  },
  type: {
    type: String,
    required: true,
    enum: ['review', 'suggestion'],
    default: 'review'
  },
  comment: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
