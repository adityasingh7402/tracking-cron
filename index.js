const express = require('express');
const { addProduct, removeProduct, getProducts, initDB } = require('./database');
const { checkPrices } = require('./checkPrices');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Initialize database
initDB();

// Health check endpoint (required for Render)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Price Tracker API is running',
    endpoints: {
      'GET /products': 'List all tracked products',
      'POST /products': 'Add a product to track',
      'DELETE /products/:id': 'Remove a product from tracking',
      'POST /check': 'Manually trigger price check'
    }
  });
});

// Get all tracked products
app.get('/products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add a product to track
app.post('/products', async (req, res) => {
  try {
    const { url, targetPrice } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    if (!url.includes('amazon.') && !url.includes('flipkart.')) {
      return res.status(400).json({
        success: false,
        error: 'Only Amazon and Flipkart URLs are supported'
      });
    }
    
    const result = await addProduct(url, targetPrice);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Remove a product from tracking
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await removeProduct(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually trigger price check
app.post('/check', async (req, res) => {
  try {
    // Don't wait for completion, respond immediately
    res.json({
      success: true,
      message: 'Price check started'
    });
    
    // Run check in background
    checkPrices().catch(console.error);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Price Tracker API running on port ${PORT}`);
  console.log(`📧 Email alerts will be sent to: ${process.env.GMAIL_USER}`);
});
