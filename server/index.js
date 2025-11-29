const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/money-management';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// API Routes (must be before static file serving)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/payment-methods', require('./routes/paymentMethods'));
app.use('/api/payments', require('./routes/payments'));

// Serve static files from React app in production
// This must be after API routes but before catch-all
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const buildPath = path.join(__dirname, '../client/build');
  
  // Serve static files (JS, CSS, images, etc.)
  app.use(express.static(buildPath, {
    maxAge: '1y', // Cache static assets
    etag: false
  }));
  
  // Serve React app for all non-API routes (catch-all handler)
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
