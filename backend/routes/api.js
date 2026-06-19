import express from 'express';
import { getProducts, restockProduct } from '../controllers/productController.js';
import {
  createCombo,
  getCombos,
  getComboById,
  updateCombo,
  deleteCombo,
  processCombo,
  generateSuggestions
} from '../controllers/comboController.js';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { loginUser } from '../controllers/authController.js';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/orderController.js';
import { createFeedback, getFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

// Authentication
router.post('/auth/login', loginUser);

// Products
router.get('/products', getProducts);
router.put('/products/:id/restock', restockProduct);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Smart Suggestions (Note: placed before :id route)
router.get('/combos/suggest', generateSuggestions);

// Combos CRUD & Custom logic
router.get('/combos', getCombos);
router.post('/combos', createCombo);
router.get('/combos/:id', getComboById);
router.put('/combos/:id', updateCombo);
router.delete('/combos/:id', deleteCombo);
router.post('/combos/:id/process', processCombo);

// Orders & Billing
router.post('/orders', createOrder);
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Feedback & Suggestions
router.post('/feedback', createFeedback);
router.get('/feedback', getFeedback);

export default router;
