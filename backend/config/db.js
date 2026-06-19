import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models for Mongoose
import ProductModel from '../models/Product.js';
import ComboPackModel from '../models/ComboPack.js';
import RecommendationHistoryModel from '../models/RecommendationHistory.js';
import OrderModel from '../models/Order.js';
import FeedbackModel from '../models/Feedback.js';

const SEED_FILE = path.join(__dirname, '..', 'data', 'products_seed.json');
const JSON_DB_DIR = path.join(__dirname, '..', 'data', 'database');

// Ensure JSON database directory exists
if (!fs.existsSync(JSON_DB_DIR)) {
  fs.mkdirSync(JSON_DB_DIR, { recursive: true });
}

const PRODUCTS_JSON_PATH = path.join(JSON_DB_DIR, 'products.json');
const COMBOS_JSON_PATH = path.join(JSON_DB_DIR, 'combos.json');
const RECOMMENDATIONS_JSON_PATH = path.join(JSON_DB_DIR, 'recommendations.json');
const ORDERS_JSON_PATH = path.join(JSON_DB_DIR, 'orders.json');
const FEEDBACK_JSON_PATH = path.join(JSON_DB_DIR, 'feedback.json');

// Initialize empty JSON files if they don't exist
const initJsonFile = (filePath, defaultVal = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf-8');
  }
};

initJsonFile(PRODUCTS_JSON_PATH);
initJsonFile(COMBOS_JSON_PATH);
initJsonFile(ORDERS_JSON_PATH);
initJsonFile(RECOMMENDATIONS_JSON_PATH);
initJsonFile(FEEDBACK_JSON_PATH);

// Reads a JSON file database
const readJson = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading database file ${filePath}:`, err);
    return [];
  }
};

// Writes to a JSON file database
const writeJson = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing to database file ${filePath}:`, err);
  }
};

// Seed helper
const getSeedProducts = () => {
  try {
    if (fs.existsSync(SEED_FILE)) {
      return JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to read seed file:', err);
  }
  return [];
};

// Database state
let mode = 'JSON';

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.log('⚠️  MONGO_URI not specified in .env. Running in LOCAL JSON DATABASE mode.');
    mode = 'JSON';
    seedJsonDatabase();
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000 // Timeout fast if local Mongo is not running
    });
    console.log('✅ Connected to MongoDB successfully.');
    mode = 'MongoDB';
    await seedMongoDatabase();
  } catch (err) {
    console.log('⚠️  Failed to connect to MongoDB. Falling back to LOCAL JSON DATABASE mode.');
    mode = 'JSON';
    seedJsonDatabase();
  }
};

// Seeding for MongoDB
const seedMongoDatabase = async () => {
  try {
    const count = await ProductModel.countDocuments();
    if (count === 0) {
      console.log('🌱 MongoDB product catalog empty. Seeding products...');
      const seedProducts = getSeedProducts();
      if (seedProducts.length > 0) {
        await ProductModel.insertMany(seedProducts);
        console.log(`🌱 Seeded ${seedProducts.length} products to MongoDB.`);
      }
    }
  } catch (err) {
    console.error('Error seeding MongoDB:', err);
  }
};

// Seeding for JSON Database
const seedJsonDatabase = () => {
  try {
    const products = readJson(PRODUCTS_JSON_PATH);
    if (products.length === 0) {
      console.log('🌱 JSON product database empty. Seeding products...');
      const seedProducts = getSeedProducts();
      if (seedProducts.length > 0) {
        const productsWithIds = seedProducts.map((p, i) => ({
          _id: `prod_${Date.now()}_${i}`,
          ...p,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        writeJson(PRODUCTS_JSON_PATH, productsWithIds);
        console.log(`🌱 Seeded ${productsWithIds.length} products to JSON database.`);
      }
    }
  } catch (err) {
    console.error('Error seeding JSON database:', err);
  }
};

// Helper to simulate populating combo items in JSON mode
const populateComboItemsJson = (combo, products) => {
  if (!combo || !combo.items) return combo;
  const populatedItems = combo.items.map(item => {
    const product = products.find(p => p._id === item.product);
    return {
      _id: item._id,
      product: product ? { ...product } : null,
      quantity: item.quantity
    };
  });
  return { ...combo, items: populatedItems };
};

// Unified Data Access Layer (DAL)
export const db = {
  getMode: () => mode,

  Products: {
    find: async (query = {}) => {
      if (mode === 'MongoDB') {
        return await ProductModel.find(query).lean();
      } else {
        let list = readJson(PRODUCTS_JSON_PATH);
        if (query.category) list = list.filter(p => p.category === query.category);
        if (query.availability !== undefined) list = list.filter(p => p.availability === query.availability);
        return list;
      }
    },

    findById: async (id) => {
      if (mode === 'MongoDB') {
        return await ProductModel.findById(id).lean();
      } else {
        const list = readJson(PRODUCTS_JSON_PATH);
        return list.find(p => p._id === id) || null;
      }
    },

    create: async (data) => {
      if (mode === 'MongoDB') {
        return await ProductModel.create(data);
      } else {
        const list = readJson(PRODUCTS_JSON_PATH);
        const newProd = {
          _id: `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newProd);
        writeJson(PRODUCTS_JSON_PATH, list);
        return newProd;
      }
    },

    findByIdAndUpdate: async (id, updateData, options = {}) => {
      if (mode === 'MongoDB') {
        return await ProductModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
      } else {
        const list = readJson(PRODUCTS_JSON_PATH);
        const index = list.findIndex(p => p._id === id);
        if (index === -1) return null;
        
        list[index] = {
          ...list[index],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        writeJson(PRODUCTS_JSON_PATH, list);
        return list[index];
      }
    }
  },

  ComboPacks: {
    find: async (filter = {}) => {
      if (mode === 'MongoDB') {
        const q = ComboPackModel.find();
        if (filter.festivalType) q.where('festivalType').equals(filter.festivalType);
        if (filter.status) q.where('status').equals(filter.status);
        return await q.populate('items.product').sort({ createdAt: -1 }).lean();
      } else {
        let combos = readJson(COMBOS_JSON_PATH);
        if (filter.festivalType) combos = combos.filter(c => c.festivalType === filter.festivalType);
        if (filter.status) combos = combos.filter(c => c.status === filter.status);
        
        // Populate products
        const products = readJson(PRODUCTS_JSON_PATH);
        combos = combos.map(c => populateComboItemsJson(c, products));
        
        // Sort by createdAt descending
        return combos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },

    findById: async (id) => {
      if (mode === 'MongoDB') {
        return await ComboPackModel.findById(id).populate('items.product').lean();
      } else {
        const combos = readJson(COMBOS_JSON_PATH);
        const combo = combos.find(c => c._id === id);
        if (!combo) return null;
        
        const products = readJson(PRODUCTS_JSON_PATH);
        return populateComboItemsJson(combo, products);
      }
    },

    create: async (data) => {
      if (mode === 'MongoDB') {
        const created = await ComboPackModel.create(data);
        // Return details populated
        return await ComboPackModel.findById(created._id).populate('items.product').lean();
      } else {
        const combos = readJson(COMBOS_JSON_PATH);
        const itemsWithIds = (data.items || []).map((item, i) => ({
          _id: `item_${Date.now()}_${i}`,
          product: typeof item.product === 'object' ? item.product._id : item.product,
          quantity: item.quantity
        }));

        const newCombo = {
          _id: `combo_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          comboName: data.comboName,
          festivalType: data.festivalType || 'Custom',
          items: itemsWithIds,
          basePrice: Number(data.basePrice) || 0,
          discount: Number(data.discount) || 0,
          finalPrice: Number(data.finalPrice) || 0,
          giftNote: data.giftNote || '',
          image: data.image || '',
          status: data.status || 'Draft',
          stockStatus: data.stockStatus || 'In Stock',
          history: data.history || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        combos.push(newCombo);
        writeJson(COMBOS_JSON_PATH, combos);
        
        const products = readJson(PRODUCTS_JSON_PATH);
        return populateComboItemsJson(newCombo, products);
      }
    },

    findByIdAndUpdate: async (id, updateData, options = {}) => {
      if (mode === 'MongoDB') {
        const updated = await ComboPackModel.findByIdAndUpdate(id, updateData, { new: true }).populate('items.product').lean();
        return updated;
      } else {
        const combos = readJson(COMBOS_JSON_PATH);
        const index = combos.findIndex(c => c._id === id);
        if (index === -1) return null;
        
        // Handle items update (extract product ID if it's an object)
        let updatedItems = combos[index].items;
        if (updateData.items) {
          updatedItems = updateData.items.map((item, i) => ({
            _id: item._id || `item_${Date.now()}_${i}`,
            product: typeof item.product === 'object' ? item.product._id : item.product,
            quantity: item.quantity
          }));
        }

        combos[index] = {
          ...combos[index],
          ...updateData,
          items: updatedItems,
          updatedAt: new Date().toISOString()
        };

        writeJson(COMBOS_JSON_PATH, combos);
        const products = readJson(PRODUCTS_JSON_PATH);
        return populateComboItemsJson(combos[index], products);
      }
    },

    findByIdAndDelete: async (id) => {
      if (mode === 'MongoDB') {
        return await ComboPackModel.findByIdAndDelete(id).lean();
      } else {
        const combos = readJson(COMBOS_JSON_PATH);
        const index = combos.findIndex(c => c._id === id);
        if (index === -1) return null;
        
        const deleted = combos[index];
        combos.splice(index, 1);
        writeJson(COMBOS_JSON_PATH, combos);
        return deleted;
      }
    }
  },

  RecommendationHistory: {
    find: async (filter = {}) => {
      if (mode === 'MongoDB') {
        return await RecommendationHistoryModel.find(filter).sort({ generatedAt: -1 }).lean();
      } else {
        let list = readJson(RECOMMENDATIONS_JSON_PATH);
        if (filter.comboId) list = list.filter(r => r.comboId === filter.comboId);
        return list.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
      }
    },

    create: async (data) => {
      if (mode === 'MongoDB') {
        return await RecommendationHistoryModel.create(data);
      } else {
        const list = readJson(RECOMMENDATIONS_JSON_PATH);
        const newRec = {
          _id: `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          ...data,
          generatedAt: new Date().toISOString()
        };
        list.push(newRec);
        writeJson(RECOMMENDATIONS_JSON_PATH, list);
        return newRec;
      }
    }
  },

  Orders: {
    find: async (query = {}) => {
      if (mode === 'MongoDB') {
        return await OrderModel.find(query).sort({ createdAt: -1 }).lean();
      } else {
        let list = readJson(ORDERS_JSON_PATH);
        if (query.customerEmail) list = list.filter(o => o.customerEmail.toLowerCase() === query.customerEmail.toLowerCase());
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },

    findById: async (id) => {
      if (mode === 'MongoDB') {
        return await OrderModel.findById(id).lean();
      } else {
        const list = readJson(ORDERS_JSON_PATH);
        return list.find(o => o._id === id) || null;
      }
    },

    create: async (data) => {
      if (mode === 'MongoDB') {
        return await OrderModel.create(data);
      } else {
        const list = readJson(ORDERS_JSON_PATH);
        const newOrder = {
          _id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          ...data,
          status: data.status || 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newOrder);
        writeJson(ORDERS_JSON_PATH, list);
        return newOrder;
      }
    },

    findByIdAndUpdate: async (id, updateData) => {
      if (mode === 'MongoDB') {
        return await OrderModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
      } else {
        const list = readJson(ORDERS_JSON_PATH);
        const index = list.findIndex(o => o._id === id);
        if (index === -1) return null;
        
        list[index] = {
          ...list[index],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        writeJson(ORDERS_JSON_PATH, list);
        return list[index];
      }
    }
  },

  Feedback: {
    find: async (query = {}) => {
      if (mode === 'MongoDB') {
        return await FeedbackModel.find(query).sort({ createdAt: -1 }).lean();
      } else {
        let list = readJson(FEEDBACK_JSON_PATH);
        if (query.customerEmail) {
          list = list.filter(f => f.customerEmail.toLowerCase() === query.customerEmail.toLowerCase());
        }
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },

    create: async (data) => {
      if (mode === 'MongoDB') {
        return await FeedbackModel.create(data);
      } else {
        const list = readJson(FEEDBACK_JSON_PATH);
        const newFeedback = {
          _id: `fb_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        list.push(newFeedback);
        writeJson(FEEDBACK_JSON_PATH, list);
        return newFeedback;
      }
    }
  }
};
