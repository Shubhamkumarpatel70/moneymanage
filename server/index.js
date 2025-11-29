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

// Serve static files from React app (both development and production)
// This must be after API routes but before catch-all
const path = require('path');
const fs = require('fs');
const buildPath = path.join(__dirname, '../client/build');

// Check if build directory exists
if (fs.existsSync(buildPath)) {
  // Log build path for debugging
  console.log('Build path:', buildPath);
  console.log('Serving React app from build directory');
  
  // Serve static files from /static directory (JS, CSS, etc.)
  // This must handle requests from any route (including /shared/:token)
  app.use('/static', express.static(path.join(buildPath, 'static'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: false
  }));
  
  // Serve manifest.json from root and from any nested route
  app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(buildPath, 'manifest.json'), (err) => {
      if (err) {
        console.error('Error serving manifest.json:', err);
        res.status(404).send('Manifest not found');
      }
    });
  });
  
  // Also serve manifest.json from nested routes (like /shared/:token/manifest.json)
  // This handles cases where the browser requests it with a relative path
  app.get('*/manifest.json', (req, res) => {
    // Extract the actual path and serve from root
    const manifestPath = path.join(buildPath, 'manifest.json');
    res.sendFile(manifestPath, (err) => {
      if (err) {
        console.error('Error serving manifest.json from nested route:', err);
        res.status(404).send('Manifest not found');
      }
    });
  });
  
  // Serve favicon and other public assets
  app.use(express.static(buildPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: false,
    index: false
  }));
  
  // Serve React app for all non-API routes (catch-all handler)
  // Only serve index.html for routes that don't start with /api/ and aren't static files
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    
    // Check if the requested path is a file that exists in the build directory
    const requestedFile = path.join(buildPath, req.path);
    const fileExists = fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile();
    
    // If it's a file that exists, try to serve it (this handles files without extensions)
    if (fileExists) {
      return res.sendFile(requestedFile, (err) => {
        if (err) {
          console.error('Error serving file:', req.path, err);
          // Fall through to serve index.html
        }
      });
    }
    
    // Handle static files requested from nested routes (like /shared/:token/static/...)
    // Redirect to the correct path
    if (req.path.includes('/static/')) {
      const staticPath = req.path.substring(req.path.indexOf('/static/'));
      const staticFile = path.join(buildPath, staticPath);
      if (fs.existsSync(staticFile) && fs.statSync(staticFile).isFile()) {
        return res.sendFile(staticFile);
      }
    }
    
    // Skip static file requests - these should be handled by express.static above
    // Check for known static file extensions
    const staticFileExtensions = ['.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map', '.webmanifest'];
    const hasStaticExtension = staticFileExtensions.some(ext => req.path.toLowerCase().endsWith(ext));
    
    // Also check if it looks like a hash-based filename (service worker, chunk, etc.)
    // Hash filenames are typically 40-64 character hex strings
    const pathParts = req.path.split('/').pop();
    const isHashFile = /^[a-f0-9]{32,64}$/i.test(pathParts);
    
    if (hasStaticExtension || isHashFile) {
      // If it's a static file but wasn't found, return 404
      return res.status(404).send('File not found');
    }
    
    // For all other routes (SPA routes), serve index.html
    res.sendFile(path.join(buildPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).send('Error loading page');
      }
    });
  });
} else {
  console.log('Build directory not found. Make sure to run "npm run build" in the client directory.');
  console.log('Expected build path:', buildPath);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
