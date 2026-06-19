import { db } from '../config/db.js';

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await db.Products.find();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error while fetching products', error: error.message });
  }
};

// Add stock units to a product
export const restockProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid positive restock amount is required.' });
    }

    const product = await db.Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const newStock = Number(product.stock) + Number(amount);
    const updatedProduct = await db.Products.findByIdAndUpdate(id, { stock: newStock });

    res.json({
      message: 'Product stock updated successfully!',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error restocking product:', error);
    res.status(500).json({ message: 'Server error while restocking product', error: error.message });
  }
};
