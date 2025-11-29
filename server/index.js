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
  
  // Serve static files (JS, CSS, images, manifest.json, etc.)
  // Use fallthrough: false to prevent falling through to catch-all if file not found
  app.use(express.static(buildPath, {
    maxAge: '1y', // Cache static assets
    etag: false,
    fallthrough: false // Don't fall through to next middleware if file not found
  }));
  
  // Serve React app for all non-API routes (catch-all handler)
  // Only serve index.html for routes that don't start with /api/ and aren't static files
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    
    // Skip static file requests (they should be handled by express.static above)
    const staticFileExtensions = ['.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
    const hasStaticExtension = staticFileExtensions.some(ext => req.path.toLowerCase().endsWith(ext));
    
    if (hasStaticExtension) {
      return res.status(404).send('File not found');
    }
    
    // For all other routes, serve index.html
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
      if (err) {
        res.status(500).send('Error loading page');
      }
    });
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
