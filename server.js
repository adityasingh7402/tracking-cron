const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const Product = require('./models/Product');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Price Tracker API with MongoDB',
    endpoints: {
      'GET /products': 'Get all products',
      'POST /products': 'Add new product',
      'GET /products/:id': 'Get product by ID',
      'PUT /products/:id': 'Update product',
      'DELETE /products/:id': 'Delete product',
      'PATCH /products/:id/toggle': 'Toggle product active status'
    }
  });
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
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

// Get single product
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add new product
app.post('/products', async (req, res) => {
  try {
    const { name, url, minPrice, maxPrice, recipientEmail } = req.body;
    
    // Validation
    if (!name || !url || !minPrice || !maxPrice || !recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }
    
    if (!url.includes('amazon.') && !url.includes('flipkart.')) {
      return res.status(400).json({
        success: false,
        error: 'Only Amazon and Flipkart URLs are supported'
      });
    }
    
    if (minPrice > maxPrice) {
      return res.status(400).json({
        success: false,
        error: 'Min price cannot be greater than max price'
      });
    }
    
    // Check if product already exists
    const existingProduct = await Product.findOne({ url });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Product with this URL already exists'
      });
    }
    
    const product = await Product.create({
      name,
      url,
      minPrice,
      maxPrice,
      recipientEmail
    });
    
    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update product
app.put('/products/:id', async (req, res) => {
  try {
    const { name, url, minPrice, maxPrice, recipientEmail, isActive } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, url, minPrice, maxPrice, recipientEmail, isActive },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Toggle product active status
app.patch('/products/:id/toggle', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    product.isActive = !product.isActive;
    await product.save();
    
    res.json({
      success: true,
      message: `Product ${product.isActive ? 'enabled' : 'disabled'}`,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete product
app.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email alerts configured for Gmail: ${process.env.GMAIL_USER}`);
});
