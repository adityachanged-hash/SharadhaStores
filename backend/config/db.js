import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Resolve directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const SEED_FILE = path.join(__dirname, '..', 'data', 'products_seed.json');
const JSON_DB_DIR = path.join(__dirname, '..', 'data', 'database');

// Ensure JSON database directory exists
if (!fs.existsSync(JSON_DB_DIR)) {
  fs.mkdirSync(JSON_DB_DIR, { recursive: true });
}

const PRODUCTS_JSON_PATH       = path.join(JSON_DB_DIR, 'products.json');
const COMBOS_JSON_PATH         = path.join(JSON_DB_DIR, 'combos.json');
const RECOMMENDATIONS_JSON_PATH = path.join(JSON_DB_DIR, 'recommendations.json');
const ORDERS_JSON_PATH         = path.join(JSON_DB_DIR, 'orders.json');
const FEEDBACK_JSON_PATH       = path.join(JSON_DB_DIR, 'feedback.json');
const WALLETS_JSON_PATH        = path.join(JSON_DB_DIR, 'wallets.json');

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
initJsonFile(WALLETS_JSON_PATH);

// JSON helpers
const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
};

const writeJson = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
};

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
let pgPool = null;

// ─────────────────────────────────────────────────────────────────────────────
// PostgreSQL: Create Tables
// ─────────────────────────────────────────────────────────────────────────────

const createPostgresTables = async () => {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT    DEFAULT '',
      category      TEXT    DEFAULT '',
      price         NUMERIC DEFAULT 0,
      unit          TEXT    DEFAULT '',
      availability  BOOLEAN DEFAULT true,
      stock         INTEGER DEFAULT 0,
      image         TEXT    DEFAULT '',
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS combo_packs (
      id            TEXT PRIMARY KEY,
      combo_name    TEXT    NOT NULL,
      festival_type TEXT    DEFAULT 'Custom',
      items         JSONB   DEFAULT '[]',
      base_price    NUMERIC DEFAULT 0,
      discount      NUMERIC DEFAULT 0,
      final_price   NUMERIC DEFAULT 0,
      gift_note     TEXT    DEFAULT '',
      image         TEXT    DEFAULT '',
      status        TEXT    DEFAULT 'Draft',
      stock_status  TEXT    DEFAULT 'In Stock',
      history       JSONB   DEFAULT '[]',
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id               TEXT PRIMARY KEY,
      combo_name       TEXT    DEFAULT '',
      combo_id         TEXT    DEFAULT '',
      product_id       TEXT    DEFAULT '',
      customer_name    TEXT    DEFAULT '',
      customer_email   TEXT    DEFAULT '',
      customer_phone   TEXT    DEFAULT '',
      shipping_address TEXT    DEFAULT '',
      payment_method   TEXT    DEFAULT '',
      items            JSONB   DEFAULT '[]',
      subtotal         NUMERIC DEFAULT 0,
      tax              NUMERIC DEFAULT 0,
      shipping         NUMERIC DEFAULT 0,
      gift_charges     NUMERIC DEFAULT 0,
      total            NUMERIC DEFAULT 0,
      status           TEXT    DEFAULT 'Pending',
      history          JSONB   DEFAULT '[]',
      notes            TEXT    DEFAULT '',
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id             TEXT PRIMARY KEY,
      customer_name  TEXT    DEFAULT '',
      customer_email TEXT    DEFAULT '',
      order_id       TEXT    DEFAULT '',
      combo_name     TEXT    DEFAULT '',
      rating         INTEGER DEFAULT 0,
      comment        TEXT    DEFAULT '',
      type           TEXT    DEFAULT 'review',
      created_at     TIMESTAMPTZ DEFAULT NOW(),
      updated_at     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS recommendation_history (
      id           TEXT PRIMARY KEY,
      combo_id     TEXT  DEFAULT '',
      suggestions  JSONB DEFAULT '[]',
      generated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customer_wallets (
      email        TEXT PRIMARY KEY,
      balance      NUMERIC DEFAULT 0,
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ PostgreSQL tables created / verified.');
};

// ─────────────────────────────────────────────────────────────────────────────
// PostgreSQL: Seed
// ─────────────────────────────────────────────────────────────────────────────

const seedPostgresDatabase = async () => {
  try {
    const { rows } = await pgPool.query('SELECT COUNT(*)::int AS cnt FROM products');
    if (rows[0].cnt === 0) {
      console.log('🌱 PostgreSQL products empty. Seeding...');
      const seedProducts = getSeedProducts();
      for (let i = 0; i < seedProducts.length; i++) {
        const p = seedProducts[i];
        const id = `prod_${Date.now()}_${i}`;
        await pgPool.query(
          `INSERT INTO products (id,name,description,category,price,unit,availability,stock,image)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
          [id, p.name, p.description||'', p.category||'', p.price||0,
           p.unit||'', p.availability !== false, p.stock||0, p.image||'']
        );
      }
      console.log(`🌱 Seeded ${seedProducts.length} products to PostgreSQL.`);
    }
  } catch (err) {
    console.error('Error seeding PostgreSQL:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Row Mappers  (PostgreSQL snake_case → app camelCase)
// ─────────────────────────────────────────────────────────────────────────────

const toProduct = (r) => ({
  _id:          r.id,
  name:         r.name,
  description:  r.description,
  category:     r.category,
  price:        parseFloat(r.price),
  unit:         r.unit,
  availability: r.availability,
  stock:        r.stock,
  image:        r.image,
  createdAt:    r.created_at,
  updatedAt:    r.updated_at
});

const toCombo = (r) => ({
  _id:          r.id,
  comboName:    r.combo_name,
  festivalType: r.festival_type,
  items:        r.items   || [],
  basePrice:    parseFloat(r.base_price),
  discount:     parseFloat(r.discount),
  finalPrice:   parseFloat(r.final_price),
  giftNote:     r.gift_note,
  image:        r.image,
  status:       r.status,
  stockStatus:  r.stock_status,
  history:      r.history || [],
  createdAt:    r.created_at,
  updatedAt:    r.updated_at
});

const toOrder = (r) => ({
  _id:             r.id,
  comboName:       r.combo_name,
  comboId:         r.combo_id,
  productId:       r.product_id,
  customerName:    r.customer_name,
  customerEmail:   r.customer_email,
  customerPhone:   r.customer_phone   || r.phone_number,
  phoneNumber:     r.customer_phone   || r.phone_number,
  shippingAddress: r.shipping_address,
  paymentMethod:   r.payment_method,
  items:           r.items   || [],
  subtotal:        parseFloat(r.subtotal),
  tax:             parseFloat(r.tax),
  shipping:        parseFloat(r.shipping),
  giftCharges:     parseFloat(r.gift_charges || 0),
  total:           parseFloat(r.total),
  status:          r.status,
  history:         r.history || [],
  notes:           r.notes,
  createdAt:       r.created_at,
  updatedAt:       r.updated_at
});

const toFeedback = (r) => ({
  _id:           r.id,
  customerName:  r.customer_name,
  customerEmail: r.customer_email,
  orderId:       r.order_id,
  comboName:     r.combo_name,
  rating:        r.rating,
  comment:       r.comment,
  type:          r.type,
  createdAt:     r.created_at,
  updatedAt:     r.updated_at
});

const toRec = (r) => ({
  _id:         r.id,
  comboId:     r.combo_id,
  suggestions: r.suggestions || [],
  generatedAt: r.generated_at
});

// ─────────────────────────────────────────────────────────────────────────────
// MongoDB / JSON helpers
// ─────────────────────────────────────────────────────────────────────────────

const populateComboItemsJson = (combo, products) => {
  if (!combo || !combo.items) return combo;
  return {
    ...combo,
    items: combo.items.map(item => {
      const product = products.find(p => p._id === item.product);
      return { _id: item._id, product: product ? { ...product } : null, quantity: item.quantity };
    })
  };
};


const seedJsonDatabase = () => {
  try {
    const products = readJson(PRODUCTS_JSON_PATH);
    if (products.length === 0) {
      const seedProducts = getSeedProducts();
      if (seedProducts.length > 0) {
        const withIds = seedProducts.map((p, i) => ({
          _id: `prod_${Date.now()}_${i}`, ...p,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        }));
        writeJson(PRODUCTS_JSON_PATH, withIds);
        console.log(`🌱 Seeded ${withIds.length} products to JSON database.`);
      }
    }
  } catch (err) {
    console.error('Error seeding JSON database:', err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// connectDB  –  PostgreSQL → MongoDB → JSON fallback
// ─────────────────────────────────────────────────────────────────────────────

export const connectDB = async () => {
  // 1. Try PostgreSQL
  const postgresUri = process.env.POSTGRES_URI;
  if (postgresUri) {
    try {
      pgPool = new Pool({ connectionString: postgresUri });
      await pgPool.query('SELECT 1');
      console.log('✅ Connected to PostgreSQL (Neon) successfully.');
      mode = 'PostgreSQL';
      await createPostgresTables();
      await seedPostgresDatabase();
      return;
    } catch (err) {
      console.error('⚠️  PostgreSQL connection failed:', err.message);
      pgPool = null;
    }
  } else {
    console.log('⚠️  No PostgreSQL URI set.');
  }

  // JSON fallback
  console.log('⚠️  Running in LOCAL JSON DATABASE mode.');
  mode = 'JSON';
  seedJsonDatabase();
};

// ─────────────────────────────────────────────────────────────────────────────
// Unified Data Access Layer
// ─────────────────────────────────────────────────────────────────────────────

export const db = {
  getMode: () => mode,

  // ── Products ────────────────────────────────────────────────────────────────
  Products: {
    find: async (query = {}) => {
      if (mode === 'PostgreSQL') {
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];
        if (query.category)     { params.push(query.category);     sql += ` AND category = $${params.length}`; }
        if (query.availability !== undefined) { params.push(query.availability); sql += ` AND availability = $${params.length}`; }
        const { rows } = await pgPool.query(sql, params);
        return rows.map(toProduct);
      } else {
        let list = readJson(PRODUCTS_JSON_PATH);
        if (query.category)     list = list.filter(p => p.category === query.category);
        if (query.availability !== undefined) list = list.filter(p => p.availability === query.availability);
        return list;
      }
    },

    findById: async (id) => {
      if (mode === 'PostgreSQL') {
        const { rows } = await pgPool.query('SELECT * FROM products WHERE id = $1', [id]);
        return rows[0] ? toProduct(rows[0]) : null;
      } else {
        return readJson(PRODUCTS_JSON_PATH).find(p => p._id === id) || null;
      }
    },

    create: async (data) => {
      if (mode === 'PostgreSQL') {
        const id = `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const { rows } = await pgPool.query(
          `INSERT INTO products (id,name,description,category,price,unit,availability,stock,image)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [id, data.name, data.description||'', data.category||'', data.price||0,
           data.unit||'', data.availability !== false, data.stock||0, data.image||'']
        );
        return toProduct(rows[0]);
      } else {
        const list = readJson(PRODUCTS_JSON_PATH);
        const newProd = { _id: `prod_${Date.now()}_${Math.floor(Math.random()*1000)}`, ...data,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        list.push(newProd);
        writeJson(PRODUCTS_JSON_PATH, list);
        return newProd;
      }
    },

    findByIdAndUpdate: async (id, updateData) => {
      if (mode === 'PostgreSQL') {
        const sets = [];
        const params = [];
        const add = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

        if (updateData.name        !== undefined) add('name',        updateData.name);
        if (updateData.description !== undefined) add('description', updateData.description);
        if (updateData.category    !== undefined) add('category',    updateData.category);
        if (updateData.price       !== undefined) add('price',       updateData.price);
        if (updateData.unit        !== undefined) add('unit',        updateData.unit);
        if (updateData.availability !== undefined) add('availability', updateData.availability);
        if (updateData.stock       !== undefined) add('stock',       updateData.stock);
        if (updateData.image       !== undefined) add('image',       updateData.image);

        // Handle $set operator
        if (updateData.$set) {
          const colMap = { stock:'stock', availability:'availability', price:'price', name:'name', description:'description' };
          for (const [k, v] of Object.entries(updateData.$set)) {
            if (colMap[k]) add(colMap[k], v);
          }
        }

        sets.push('updated_at = NOW()');
        params.push(id);
        const { rows } = await pgPool.query(
          `UPDATE products SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
          params
        );
        return rows[0] ? toProduct(rows[0]) : null;
      } else {
        const list = readJson(PRODUCTS_JSON_PATH);
        const idx = list.findIndex(p => p._id === id);
        if (idx === -1) return null;
        list[idx] = { ...list[idx], ...updateData, updatedAt: new Date().toISOString() };
        writeJson(PRODUCTS_JSON_PATH, list);
        return list[idx];
      }
    }
  },

  // ── ComboPacks ──────────────────────────────────────────────────────────────
  ComboPacks: {
    find: async (filter = {}) => {
      if (mode === 'PostgreSQL') {
        let sql = 'SELECT * FROM combo_packs WHERE 1=1';
        const params = [];
        if (filter.festivalType) { params.push(filter.festivalType); sql += ` AND festival_type = $${params.length}`; }
        if (filter.status)       { params.push(filter.status);       sql += ` AND status = $${params.length}`; }
        sql += ' ORDER BY created_at DESC';
        const { rows } = await pgPool.query(sql, params);
        return rows.map(toCombo);
      } else {
        let combos = readJson(COMBOS_JSON_PATH);
        if (filter.festivalType) combos = combos.filter(c => c.festivalType === filter.festivalType);
        if (filter.status)       combos = combos.filter(c => c.status === filter.status);
        const products = readJson(PRODUCTS_JSON_PATH);
        return combos.map(c => populateComboItemsJson(c, products))
                     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },

    findById: async (id) => {
      if (mode === 'PostgreSQL') {
        const { rows } = await pgPool.query('SELECT * FROM combo_packs WHERE id = $1', [id]);
        return rows[0] ? toCombo(rows[0]) : null;
      } else {
        const combos = readJson(COMBOS_JSON_PATH);
        const combo  = combos.find(c => c._id === id);
        if (!combo) return null;
        return populateComboItemsJson(combo, readJson(PRODUCTS_JSON_PATH));
      }
    },

    create: async (data) => {
      if (mode === 'PostgreSQL') {
        const id = `combo_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        // Store items with nested product objects as JSONB
        const items = (data.items || []).map((item, i) => ({
          _id:      item._id || `item_${Date.now()}_${i}`,
          product:  typeof item.product === 'object' ? item.product : { _id: item.product },
          quantity: item.quantity
        }));
        const { rows } = await pgPool.query(
          `INSERT INTO combo_packs
             (id,combo_name,festival_type,items,base_price,discount,final_price,gift_note,image,status,stock_status,history)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
          [id, data.comboName, data.festivalType||'Custom', JSON.stringify(items),
           data.basePrice||0, data.discount||0, data.finalPrice||0,
           data.giftNote||'', data.image||'', data.status||'Draft',
           data.stockStatus||'In Stock', JSON.stringify(data.history||[])]
        );
        return toCombo(rows[0]);
      } else {
        const combos = readJson(COMBOS_JSON_PATH);
        const itemsWithIds = (data.items || []).map((item, i) => ({
          _id: `item_${Date.now()}_${i}`,
          product: typeof item.product === 'object' ? item.product._id : item.product,
          quantity: item.quantity
        }));
        const newCombo = {
          _id: `combo_${Date.now()}_${Math.floor(Math.random()*1000)}`,
          comboName: data.comboName, festivalType: data.festivalType||'Custom',
          items: itemsWithIds, basePrice: Number(data.basePrice)||0,
          discount: Number(data.discount)||0, finalPrice: Number(data.finalPrice)||0,
          giftNote: data.giftNote||'', image: data.image||'',
          status: data.status||'Draft', stockStatus: data.stockStatus||'In Stock',
          history: data.history||[],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        combos.push(newCombo);
        writeJson(COMBOS_JSON_PATH, combos);
        return populateComboItemsJson(newCombo, readJson(PRODUCTS_JSON_PATH));
      }
    },

    findByIdAndUpdate: async (id, updateData) => {
      if (mode === 'PostgreSQL') {
        const sets = [];
        const params = [];
        const add = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

        if (updateData.comboName    !== undefined) add('combo_name',   updateData.comboName);
        if (updateData.festivalType !== undefined) add('festival_type',updateData.festivalType);
        if (updateData.basePrice    !== undefined) add('base_price',   updateData.basePrice);
        if (updateData.discount     !== undefined) add('discount',     updateData.discount);
        if (updateData.finalPrice   !== undefined) add('final_price',  updateData.finalPrice);
        if (updateData.giftNote     !== undefined) add('gift_note',    updateData.giftNote);
        if (updateData.image        !== undefined) add('image',        updateData.image);
        if (updateData.status       !== undefined) add('status',       updateData.status);
        if (updateData.stockStatus  !== undefined) add('stock_status', updateData.stockStatus);
        if (updateData.history      !== undefined) add('history',      JSON.stringify(updateData.history));
        if (updateData.items        !== undefined) {
          const items = updateData.items.map((item, i) => ({
            _id: item._id || `item_${Date.now()}_${i}`,
            product: typeof item.product === 'object' ? item.product : { _id: item.product },
            quantity: item.quantity
          }));
          add('items', JSON.stringify(items));
        }
        // Handle Mongoose-style $push.history
        if (updateData.$push?.history) {
          params.push(JSON.stringify([updateData.$push.history]));
          sets.push(`history = history || $${params.length}::jsonb`);
        }

        sets.push('updated_at = NOW()');
        params.push(id);
        const { rows } = await pgPool.query(
          `UPDATE combo_packs SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
          params
        );
        return rows[0] ? toCombo(rows[0]) : null;
      } else {
        const combos = readJson(COMBOS_JSON_PATH);
        const idx = combos.findIndex(c => c._id === id);
        if (idx === -1) return null;
        let updatedItems = combos[idx].items;
        if (updateData.items) {
          updatedItems = updateData.items.map((item, i) => ({
            _id: item._id || `item_${Date.now()}_${i}`,
            product: typeof item.product === 'object' ? item.product._id : item.product,
            quantity: item.quantity
          }));
        }
        combos[idx] = { ...combos[idx], ...updateData, items: updatedItems, updatedAt: new Date().toISOString() };
        writeJson(COMBOS_JSON_PATH, combos);
        return populateComboItemsJson(combos[idx], readJson(PRODUCTS_JSON_PATH));
      }
    },

    findByIdAndDelete: async (id) => {
      if (mode === 'PostgreSQL') {
        const { rows } = await pgPool.query('DELETE FROM combo_packs WHERE id = $1 RETURNING *', [id]);
        return rows[0] ? toCombo(rows[0]) : null;
      } else {
        const combos = readJson(COMBOS_JSON_PATH);
        const idx = combos.findIndex(c => c._id === id);
        if (idx === -1) return null;
        const deleted = combos[idx];
        combos.splice(idx, 1);
        writeJson(COMBOS_JSON_PATH, combos);
        return deleted;
      }
    }
  },

  // ── RecommendationHistory ───────────────────────────────────────────────────
  RecommendationHistory: {
    find: async (filter = {}) => {
      if (mode === 'PostgreSQL') {
        let sql = 'SELECT * FROM recommendation_history WHERE 1=1';
        const params = [];
        if (filter.comboId) { params.push(filter.comboId); sql += ` AND combo_id = $${params.length}`; }
        sql += ' ORDER BY generated_at DESC';
        const { rows } = await pgPool.query(sql, params);
        return rows.map(toRec);
      } else {
        let list = readJson(RECOMMENDATIONS_JSON_PATH);
        if (filter.comboId) list = list.filter(r => r.comboId === filter.comboId);
        return list.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
      }
    },

    create: async (data) => {
      if (mode === 'PostgreSQL') {
        const id = `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const { rows } = await pgPool.query(
          `INSERT INTO recommendation_history (id,combo_id,suggestions) VALUES ($1,$2,$3) RETURNING *`,
          [id, data.comboId||'', JSON.stringify(data.suggestions||[])]
        );
        return toRec(rows[0]);
      } else {
        const list = readJson(RECOMMENDATIONS_JSON_PATH);
        const newRec = { _id: `rec_${Date.now()}_${Math.floor(Math.random()*1000)}`, ...data, generatedAt: new Date().toISOString() };
        list.push(newRec);
        writeJson(RECOMMENDATIONS_JSON_PATH, list);
        return newRec;
      }
    }
  },

  // ── Orders ──────────────────────────────────────────────────────────────────
  Orders: {
    find: async (query = {}) => {
      if (mode === 'PostgreSQL') {
        let sql = 'SELECT * FROM orders WHERE 1=1';
        const params = [];
        if (query.customerEmail) { params.push(query.customerEmail.toLowerCase()); sql += ` AND LOWER(customer_email) = $${params.length}`; }
        sql += ' ORDER BY created_at DESC';
        const { rows } = await pgPool.query(sql, params);
        return rows.map(toOrder);
      } else {
        let list = readJson(ORDERS_JSON_PATH);
        if (query.customerEmail) list = list.filter(o => o.customerEmail.toLowerCase() === query.customerEmail.toLowerCase());
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },

    findById: async (id) => {
      if (mode === 'PostgreSQL') {
        const { rows } = await pgPool.query('SELECT * FROM orders WHERE id = $1', [id]);
        return rows[0] ? toOrder(rows[0]) : null;
      } else {
        return readJson(ORDERS_JSON_PATH).find(o => o._id === id) || null;
      }
    },

    create: async (data) => {
      if (mode === 'PostgreSQL') {
        const id = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const history = data.history || [{ status: 'Pending', timestamp: new Date().toISOString() }];
        const { rows } = await pgPool.query(
          `INSERT INTO orders
             (id,combo_name,combo_id,product_id,customer_name,customer_email,customer_phone,
              shipping_address,payment_method,items,subtotal,tax,shipping,gift_charges,total,status,history,notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
          [id,
           data.comboName      || '',
           data.comboId        || '',
           data.productId      || '',
           data.customerName   || '',
           data.customerEmail  || '',
           data.phoneNumber    || data.customerPhone || '',
           data.shippingAddress|| '',
           data.paymentMethod  || '',
           JSON.stringify(data.items || []),
           data.subtotal    || 0,
           data.tax         || 0,
           data.shipping    || 0,
           data.giftCharges || 0,
           data.total       || 0,
           data.status      || 'Pending',
           JSON.stringify(history),
           data.notes || '']
        );
        return toOrder(rows[0]);
      } else {
        const list = readJson(ORDERS_JSON_PATH);
        const newOrder = {
          _id: `ord_${Date.now()}_${Math.floor(Math.random()*1000)}`, ...data,
          status: data.status || 'Pending',
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        list.push(newOrder);
        writeJson(ORDERS_JSON_PATH, list);
        return newOrder;
      }
    },

    findByIdAndUpdate: async (id, updateData) => {
      if (mode === 'PostgreSQL') {
        const sets = [];
        const params = [];
        const add = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

        if (updateData.status      !== undefined) add('status',       updateData.status);
        if (updateData.subtotal    !== undefined) add('subtotal',     updateData.subtotal);
        if (updateData.tax         !== undefined) add('tax',          updateData.tax);
        if (updateData.shipping    !== undefined) add('shipping',     updateData.shipping);
        if (updateData.giftCharges !== undefined) add('gift_charges', updateData.giftCharges);
        if (updateData.total       !== undefined) add('total',        updateData.total);
        if (updateData.history     !== undefined) add('history',      JSON.stringify(updateData.history));
        if (updateData.notes       !== undefined) add('notes',        updateData.notes);
        // Handle Mongoose-style $push.history
        if (updateData.$push?.history) {
          params.push(JSON.stringify([updateData.$push.history]));
          sets.push(`history = history || $${params.length}::jsonb`);
        }

        sets.push('updated_at = NOW()');
        params.push(id);
        const { rows } = await pgPool.query(
          `UPDATE orders SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
          params
        );
        return rows[0] ? toOrder(rows[0]) : null;
      } else {
        const list = readJson(ORDERS_JSON_PATH);
        const idx  = list.findIndex(o => o._id === id);
        if (idx === -1) return null;
        list[idx] = { ...list[idx], ...updateData, updatedAt: new Date().toISOString() };
        writeJson(ORDERS_JSON_PATH, list);
        return list[idx];
      }
    }
  },

  // ── Feedback ────────────────────────────────────────────────────────────────
  Feedback: {
    find: async (query = {}) => {
      if (mode === 'PostgreSQL') {
        let sql = 'SELECT * FROM feedback WHERE 1=1';
        const params = [];
        if (query.customerEmail) { params.push(query.customerEmail.toLowerCase()); sql += ` AND LOWER(customer_email) = $${params.length}`; }
        sql += ' ORDER BY created_at DESC';
        const { rows } = await pgPool.query(sql, params);
        return rows.map(toFeedback);
      } else {
        let list = readJson(FEEDBACK_JSON_PATH);
        if (query.customerEmail) list = list.filter(f => f.customerEmail.toLowerCase() === query.customerEmail.toLowerCase());
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    },

    create: async (data) => {
      if (mode === 'PostgreSQL') {
        const id = `fb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const { rows } = await pgPool.query(
          `INSERT INTO feedback (id,customer_name,customer_email,order_id,combo_name,rating,comment,type)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [id, data.customerName||'', data.customerEmail||'', data.orderId||'',
           data.comboName||'', data.rating||0, data.comment||'', data.type||'review']
        );
        return toFeedback(rows[0]);
      } else {
        const list = readJson(FEEDBACK_JSON_PATH);
        const newFb = {
          _id: `fb_${Date.now()}_${Math.floor(Math.random()*1000)}`, ...data,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        list.push(newFb);
        writeJson(FEEDBACK_JSON_PATH, list);
        return newFb;
      }
    }
  },

  // ── Customer Wallets ────────────────────────────────────────────────────────
  Wallets: {
    getBalance: async (email) => {
      const emailLower = email.toLowerCase();
      if (mode === 'PostgreSQL') {
        const { rows } = await pgPool.query('SELECT balance FROM customer_wallets WHERE email = $1', [emailLower]);
        return rows[0] ? parseFloat(rows[0].balance) : 0;
      } else {
        const wallets = readJson(WALLETS_JSON_PATH);
        const w = wallets.find(w => w.email === emailLower);
        return w ? Number(w.balance) : 0;
      }
    },
    addBalance: async (email, amount) => {
      const emailLower = email.toLowerCase();
      if (mode === 'PostgreSQL') {
        const { rows } = await pgPool.query(
          `INSERT INTO customer_wallets (email, balance, updated_at) 
           VALUES ($1, $2, NOW()) 
           ON CONFLICT (email) DO UPDATE 
           SET balance = customer_wallets.balance + $2, updated_at = NOW() RETURNING balance`,
          [emailLower, amount]
        );
        return parseFloat(rows[0].balance);
      } else {
        const wallets = readJson(WALLETS_JSON_PATH);
        const idx = wallets.findIndex(w => w.email === emailLower);
        let newBal = amount;
        if (idx !== -1) {
          wallets[idx].balance = Number(wallets[idx].balance) + amount;
          wallets[idx].updatedAt = new Date().toISOString();
          newBal = wallets[idx].balance;
        } else {
          wallets.push({ email: emailLower, balance: amount, updatedAt: new Date().toISOString() });
        }
        writeJson(WALLETS_JSON_PATH, wallets);
        return newBal;
      }
    },
    deductBalance: async (email, amount) => {
      const emailLower = email.toLowerCase();
      if (mode === 'PostgreSQL') {
        // Only deduct if balance >= amount to prevent negative balance
        const { rows } = await pgPool.query(
          `UPDATE customer_wallets 
           SET balance = balance - $2, updated_at = NOW() 
           WHERE email = $1 AND balance >= $2 RETURNING balance`,
          [emailLower, amount]
        );
        if (rows.length === 0) {
          throw new Error('Insufficient wallet balance or wallet not found');
        }
        return parseFloat(rows[0].balance);
      } else {
        const wallets = readJson(WALLETS_JSON_PATH);
        const idx = wallets.findIndex(w => w.email === emailLower);
        if (idx === -1 || Number(wallets[idx].balance) < amount) {
          throw new Error('Insufficient wallet balance or wallet not found');
        }
        wallets[idx].balance = Number(wallets[idx].balance) - amount;
        wallets[idx].updatedAt = new Date().toISOString();
        writeJson(WALLETS_JSON_PATH, wallets);
        return wallets[idx].balance;
      }
    }
  }
};
