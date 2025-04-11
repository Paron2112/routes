const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
<<<<<<< HEAD
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();

// CORS konfiguráció
const corsOptions = {
  origin: [
    'https://diary-lyart-seven.vercel.app',  // Your ACTUAL Vercel frontend domain
    'http://localhost:5500',                // Lokális fejlesztés
    process.env.FRONTEND_URL                 // Környezeti változóból
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
  credentials: true,
  preflightContinue: false  // Explicit preflight handling
};

app.use(cors(corsOptions));

// Explicit OPTIONS handler for all routes
app.options('*', cors(corsOptions)); // ← Add this line

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// API routes
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
=======
const path = require('path');
const apiRoutes = require('./routes/api');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    'https://diary-lyart-seven.vercel.app',
    'http://localhost:5500',
    process.env.FRONTEND_URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight requests
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api', apiRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('⚠️ Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('🔌 MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = server;
>>>>>>> master
