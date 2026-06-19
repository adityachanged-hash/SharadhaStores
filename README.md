# Sharadha Stores - Festival Combo Pack Builder

Festival Combo Pack Builder is a full-stack admin tool built for **Sharadha Stores**, a homemade and traditional food e-commerce brand. This application helps inventory teams and store administrators design, price, validate stock, and publish custom festival food hampers (for Diwali, Pongal, wedding return gifts, and snack platters) during high-demand festival seasons to maximize average order value.

---

## 📋 Problem Statement

Traditional homemade e-commerce brands see a massive surge in sales during Indian festival seasons. However, constructing custom hampers, tracking real-time stock levels of individual items (like Laddus, Murukkus, Mysore Pak), matching item counts to box contents, applying volume discounts, and managing packing logs is a tedious manual process. Without proper stock visibility, stores risk selling hampers that contain out-of-stock items, leading to dispatch delays and poor customer experiences.

---

## ✨ Features

- **Home Page:** Traditional Indian-themed splash screen with quick navigation actions for creating combos and viewing inventory.
- **Product Catalog View:** Shows all homemade sweets and snacks in real-time, detailing their category, unit price, active shelf-life date, and current stock level (highlighting warning statuses).
- **Interactive Combo Builder:**
  - dynamic item addition/removal and quantity adjustments.
  - Live calculations: sums unit prices into a gross subtotal, applies discount percentages, and displays final selling price.
  - Automatic shortest shelf-life determination based on items loaded.
  - Strict publication validation blocks publishing combos that contain out-of-stock items.
- **AI / Rule-Based Smart Suggestions:** Generates immediate traditional combo hampers (for Diwali, Pongal, Weddings, or Snacks) matching name ideas, discount thresholds, customer gift messages, and product lists against live catalog items.
- **Admin Dashboard Panel:**
  - KPI metric blocks tracking total, published, and draft count summaries.
  - Instant alert banner detailing low stock levels (stock < 10) requiring raw material refilling.
  - Interactive Datatable listing all created combos with filters and in-row action controls (View, Edit, Delete, and direct Publish toggles).
- **Combo Detail Page & Audit Log:**
  - Complete price breakups and packaging manifests.
  - Custom gift note text previews.
  - Chronological History log tracking every creation, edit, stock check, validation status transition, and processing step.
- **Double-Engine Database Fallback:**
  - Automatically runs out of the box using a local, file-based JSON database engine if MongoDB is offline.
  - Seamlessly connects to a live MongoDB server when a `MONGO_URI` connection string is supplied in the backend configuration.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, React Router DOM, Lucide Icons, and Vanilla CSS with custom traditional design variables (Saffron, Gold, Cream, Crimson Red).
- **Backend:** Node.js, Express, CORS, and dotenv.
- **Database:** MongoDB (via Mongoose) OR automatic Local JSON file-based database fallback.

---

## 🚀 Installation & Local Execution

### Prerequisites
- Node.js (version 18 or higher recommended) installed on your system.

### One-Click Launch (Windows)
Double-click the **`run-project.bat`** script located in the project root folder. It will:
1. Detect your Node.js version.
2. Install dependencies for the root, frontend, and backend folders automatically.
3. Launch both the backend API and frontend servers concurrently.

### Manual Setup (Any OS)
1. Clone or copy the project files to your directory.
2. Open your terminal in the project root directory.
3. Install workspace dependencies:
   ```bash
   npm run install:all
   ```
4. Start both servers concurrently in development mode:
   ```bash
   npm run dev
   ```
   - **Frontend App:** http://localhost:3000
   - **Backend API Server:** http://localhost:5000

*Optional:* If you want to connect to a real MongoDB database instead of the automatic file-based database, open `backend/.env` and paste your URI under the `MONGO_URI` key:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/festival_db
```

---

## 🛣️ API Routes

All endpoints are prefixed with `/api`.

### Products
- `GET /api/products` - Returns all traditional products in the catalog.

### Dashboard
- `GET /api/dashboard` - Compiles KPIs, low-stock warnings, and recent combos.

### Combo Packs
- `GET /api/combos` - Returns all combo packs. Supports filtering query params `?festivalType=Diwali` and `?status=Published`.
- `POST /api/combos` - Creates a new combo hamper (calculates prices, evaluates stock, and logs creation).
- `GET /api/combos/suggest?festivalType=Diwali` - Smart Suggester. Matches products and returns recommended combo name, discount, description, and greeting text.
- `GET /api/combos/:id` - Fetches detailed info of a single combo.
- `PUT /api/combos/:id` - Updates combo parameters, recalculates prices, evaluates stock, and appends audit logs.
- `DELETE /api/combos/:id` - Deletes a combo hamper.
- `POST /api/combos/:id/process` - Processes a stock check, appends recommendations advice, and saves action logs.

---

## 🧪 Running Automated Integration Smoke Tests

To verify that the database schemas, price calculations, out-of-stock validation rules, and CRUD API operations function correctly, run the integration test suite:

1. Ensure the development server is running (`npm run dev` or via `run-project.bat`).
2. Open a separate terminal window in the project directory.
3. Run the following command:
   ```bash
   node backend/test-api.js
   ```
4. The test console will log verification results for all 10 core API workflows and print a success overview.

---

## 📸 Screenshots

*(Add your application interface screenshots here once deployed or running)*
1. **Homepage Splash Banner** - Introducing the Sharadha Stores brand theme.
2. **Interactive Combo Builder** - Assembling Murukku and Mysore Pak, applying a 10% discount, and seeing the live price calculation.
3. **Smart Suggestions Modal** - Previewing recommended Diwali combo packages.
4. **Admin Dashboard Grid** - Viewing metrics, datatables, and low stock warnings.

---

## 🔮 Future Scope

- **WhatsApp & Email Notifications:** Instantly send the dispatch manifests or purchase summaries to buyers and packers.
- **PDF & CSV Manifest Export:** Let the dispatch team print shipping labels and packing invoices for the logistics crew.
- **Online Payment Gateways:** Integrate payment solutions (such as UPI, Razorpay, or Stripe) for direct customer corporate ordering.
- **Gemini / OpenAI API Integration:** Incorporate generative AI for generating custom personalized gift messages and creative hamper descriptions.
- **Customer Hamper Builder:** Let end-customers customize their own boxes within budget bounds and order them directly.
