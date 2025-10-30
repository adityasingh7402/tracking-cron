const nodemailer = require('nodemailer');
const config = require('./config');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendPriceAlert(product, currentPrice, inRange) {
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: config.recipientEmail,
    subject: `🔔 Price Alert: ${product.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">💰 ${inRange ? 'Price in Your Range!' : 'Price Drop Detected!'}</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${product.title}</h3>
          
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Current Price:</strong> <span style="color: #28a745; font-size: 24px; font-weight: bold;">${product.currency}${currentPrice}</span></p>
            <p style="margin: 5px 0;"><strong>Your Target Range:</strong> ${product.currency}${product.minPrice} - ${product.currency}${product.maxPrice}</p>
            ${inRange ? '<p style="margin: 10px 0; color: #28a745; font-weight: bold;">✅ Price is NOW in your target range!</p>' : ''}
          </div>
          
          <a href="${product.url}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px;">View Product</a>
        </div>
        
        <p style="color: #6c757d; font-size: 12px;">Last checked: ${new Date().toLocaleString()}</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent for ${product.title}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    return false;
  }
}

async function sendErrorAlert(product, error) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: config.recipientEmail,
    subject: `⚠️ Price Tracker Error`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">⚠️ Error Tracking Product</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Product:</strong> ${product.title || 'Unknown'}</p>
          <p><strong>URL:</strong> <a href="${product.url}">${product.url}</a></p>
          <p><strong>Error:</strong> ${error}</p>
          <p style="color: #6c757d; font-size: 12px;">Time: ${new Date().toLocaleString()}</p>
        </div>
        
        <p style="color: #6c757d; font-size: 12px;">The product may have been removed or the website structure changed. Consider removing this product from tracking.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send error email:', error.message);
    return false;
  }
}

module.exports = {
  sendPriceAlert,
  sendErrorAlert
};
