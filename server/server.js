const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();

// CORS konfiguráció
const corsOptions = {
  origin: [
    'https://vercel.com/paron1212s-projects/diary/DifeuoFUE6idxTbsq8Stk4zqdY5d',  // Vercel frontend domain
    'http://localhost:5500',                // Lokális fejlesztés (ha szükséges)
    process.env.FRONTEND_URL                 // Környezeti változóból
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id'],  // Engedélyezett fejlécek
  credentials: true  // Ha session/cookie-t használsz
};

app.use(cors(corsOptions));  // <-- Itt alkalmazd a konfigurációt
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
