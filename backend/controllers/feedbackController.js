import { db } from '../config/db.js';

// Create feedback or suggestion
export const createFeedback = async (req, res) => {
  try {
    const { customerName, customerEmail, orderId, comboName, rating, type = 'review', comment } = req.body;

    if (!customerName || !customerEmail || !comment) {
      return res.status(400).json({ message: 'Name, email, and comment are required fields.' });
    }

    if (type === 'review' && !rating) {
      return res.status(400).json({ message: 'Rating is required for reviews.' });
    }

    const feedbackPayload = {
      customerName,
      customerEmail,
      orderId: orderId || 'N/A',
      comboName: comboName || 'N/A',
      rating: type === 'review' ? Number(rating) : undefined,
      type,
      comment
    };

    const newFeedback = await db.Feedback.create(feedbackPayload);

    res.status(201).json({
      message: 'Feedback submitted successfully!',
      feedback: newFeedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error while submitting feedback', error: error.message });
  }
};

// Retrieve all feedback (for admin dashboard feed)
export const getFeedback = async (req, res) => {
  try {
    const query = {};
    if (req.query.customerEmail) {
      query.customerEmail = req.query.customerEmail;
    }
    const list = await db.Feedback.find(query);
    res.json(list);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error while fetching feedback', error: error.message });
  }
};
