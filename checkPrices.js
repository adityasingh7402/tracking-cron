const { scrapeProduct } = require('./scraper');
const { getProducts, updateProduct } = require('./database');
const { sendPriceDropAlert, sendErrorAlert } = require('./mailer');

async function checkPrices() {
  console.log(`\n[${new Date().toLocaleString()}] Starting price check...`);
  
  const products = await getProducts();
  
  if (products.length === 0) {
    console.log('No products to track.');
    return;
  }
  
  console.log(`Checking ${products.length} product(s)...`);
  
  for (const product of products) {
    try {
      console.log(`\nChecking: ${product.title || product.url}`);
      
      // Scrape current price
      const scraped = await scrapeProduct(product.url);
      const currentPrice = scraped.price;
      const title = scraped.title;
      const currency = scraped.currency;
      
      console.log(`Current price: ${currency}${currentPrice}`);
      
      // Update product info
      const updates = {
        lastPrice: currentPrice,
        lastChecked: new Date().toISOString(),
        title: title,
        currency: currency
      };
      
      // Check if price dropped
      if (product.lastPrice && currentPrice < product.lastPrice) {
        console.log(`🔔 Price dropped from ${currency}${product.lastPrice} to ${currency}${currentPrice}`);
        
        // Check if it meets target price (if set)
        const shouldAlert = !product.targetPrice || currentPrice <= product.targetPrice;
        
        if (shouldAlert) {
          await sendPriceDropAlert({...product, ...updates}, currentPrice, product.lastPrice);
        } else {
          console.log(`Price dropped but hasn't reached target price of ${currency}${product.targetPrice}`);
        }
      } else if (product.lastPrice) {
        console.log('No price change');
      } else {
        console.log('First price check recorded');
      }
      
      await updateProduct(product.id, updates);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Error checking ${product.url}:`, error.message);
      
      // Send error alert if it keeps failing
      if (product.lastChecked) {
        const lastCheck = new Date(product.lastChecked);
        const hoursSinceLastSuccess = (Date.now() - lastCheck) / (1000 * 60 * 60);
        
        if (hoursSinceLastSuccess > 24) {
          await sendErrorAlert(product, error.message);
        }
      }
    }
  }
  
  console.log('\n✓ Price check completed');
}

// Run immediately if called directly
if (require.main === module) {
  checkPrices()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { checkPrices };
