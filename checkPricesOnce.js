const mongoose = require('mongoose');
const { scrapeProduct } = require('./scraper');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendPriceAlert(product, currentPrice) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: product.recipientEmail,
    subject: `🔔 Price Alert: ${product.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">💰 Price in Your Range!</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${product.name}</h3>
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Current Price:</strong> <span style="color: #28a745; font-size: 24px; font-weight: bold;">${product.currency}${currentPrice}</span></p>
            <p style="margin: 5px 0;"><strong>Your Target Range:</strong> ${product.currency}${product.minPrice} - ${product.currency}${product.maxPrice}</p>
            <p style="margin: 10px 0; color: #28a745; font-weight: bold;">✅ Price is NOW in your target range!</p>
          </div>
          
          <a href="${product.url}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px;">View Product</a>
        </div>
        
        <p style="color: #6c757d; font-size: 12px;">Checked at: ${new Date().toLocaleString()}</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent to ${product.recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Email error:', error.message);
    return false;
  }
}

async function checkPrices() {
  console.log(`\n[${new Date().toLocaleString()}] Starting price check...`);
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected');
    
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');
    
    // Fetch all active products
    const products = await productsCollection.find({ isActive: true }).toArray();
    
    if (products.length === 0) {
      console.log('No active products to track.');
      await mongoose.connection.close();
      return;
    }
    
    console.log(`Checking ${products.length} product(s)...`);
    
    for (const product of products) {
      try {
        console.log(`\nChecking: ${product.name}`);
        
        // Scrape current price
        const scraped = await scrapeProduct(product.url);
        const currentPrice = scraped.price;
        const currency = scraped.currency;
        
        console.log(`Current price: ${currency}${currentPrice}`);
        console.log(`Target range: ${currency}${product.minPrice} - ${currency}${product.maxPrice}`);
        
        // Update product in database
        await productsCollection.updateOne(
          { _id: product._id },
          {
            $set: {
              currentPrice: currentPrice,
              currency: currency,
              lastChecked: new Date()
            }
          }
        );
        
        // Check if price is in range
        const inRange = currentPrice >= product.minPrice && currentPrice <= product.maxPrice;
        
        if (inRange) {
          console.log(`🔔 ALERT: Price in range! Sending email...`);
          await sendPriceAlert(product, currentPrice);
        } else {
          console.log(`✗ Price outside range (${currentPrice < product.minPrice ? 'too low' : 'too high'})`);
        }
        
        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error checking ${product.name}:`, error.message);
      }
    }
    
    console.log('\n✓ Price check completed');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

checkPrices();
