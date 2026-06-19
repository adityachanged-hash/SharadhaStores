import mongoose from 'mongoose';

const RecommendationHistorySchema = new mongoose.Schema({
  comboId: {
    type: String, // String to handle both MongoDB ObjectIds and JSON fallback string IDs
    default: ''
  },
  suggestionText: {
    type: String,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.RecommendationHistory || mongoose.model('RecommendationHistory', RecommendationHistorySchema);
