import { db } from '../config/db.js';

// GET /api/wallet/:email
export const getWalletBalance = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required.' });
    }

    const balance = await db.Wallets.getBalance(email);
    res.json({ email, balance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: 'Server error fetching wallet balance', error: error.message });
  }
};
