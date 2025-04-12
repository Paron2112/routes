const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS Configuration
app.use(cors({
  origin: ['https://diary-lyart-seven.vercel.app', 'http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id']
}));

// Middleware
app.use(express.json());

// Database Connection
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedDb = mongoose.connection;
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    cachedDb = null;
  }
};

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api', apiRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    mongo: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('⚠️ Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// For local development only
if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// Handle graceful shutdown for local development
if (process.env.NODE_ENV === 'development') {
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    if (cachedDb) {
      mongoose.connection.close(false, () => {
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}

// Export the Express app
module.exports = app;