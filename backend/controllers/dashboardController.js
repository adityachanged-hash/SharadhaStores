import { db } from '../config/db.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Fetch all combos, products, and orders
    const combos = await db.ComboPacks.find();
    const products = await db.Products.find();
    const orders = await db.Orders.find({});

    // 2. Count statuses & calculate revenue
    const totalCombos = combos.length;
    const publishedCount = combos.filter(c => c.status === 'Published').length;
    const draftCount = combos.filter(c => c.status === 'Draft').length;

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const ordersCount = orders.length;

    // Calculate total product stock units
    const totalProductStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

    // 3. Find low-stock products (stock < 10)
    const lowStockAlerts = products
      .filter(p => p.stock < 10)
      .map(p => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        stock: p.stock,
        image: p.image
      }));

    // 4. Get recent combos (last 10 created)
    const recentCombos = combos.slice(0, 10);

    // 5. Get recent orders (last 10 orders)
    const recentOrders = orders.slice(0, 10);

    res.json({
      databaseMode: db.getMode(),
      metrics: {
        totalCombos,
        publishedCount,
        draftCount,
        lowStockCount: lowStockAlerts.length,
        totalRevenue,
        ordersCount,
        totalProductStock
      },
      lowStockAlerts,
      recentCombos,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard stats', error: error.message });
  }
};
