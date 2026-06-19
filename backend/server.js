import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets from public folder
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', apiRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Health check API route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'Online', timestamp: new Date() });
  });

  // Catch-all route to serve React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
} else {
  // Health check / welcome message for dev mode without frontend built
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to the Sharadha Stores Festival Combo Pack Builder API!',
      status: 'Online',
      timestamp: new Date()
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start Server after DB initialization
const startServer = async () => {
  try {
    await connectDB();
    // Only listen if not running in Vercel serverless environment
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Fatal server start error:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

startServer();

// Export the Express API for Vercel Serverless Functions
export default app;
