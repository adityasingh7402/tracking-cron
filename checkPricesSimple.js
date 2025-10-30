const { scrapeProduct } = require('./scraper');
const { sendPriceAlert, sendErrorAlert } = require('./mailer');
const config = require('./config');
const fs = require('fs').promises;
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'price_cache.json');

async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function checkPrices() {
  console.log(`\n[${new Date().toLocaleString()}] Starting price check...`);
  
  const cache = await loadCache();
  
  for (const product of config.products) {
    try {
      console.log(`\nChecking: ${product.name}`);
      console.log(`URL: ${product.url}`);
      
      // Scrape current price
      const scraped = await scrapeProduct(product.url);
      const currentPrice = scraped.price;
      const title = scraped.title;
      const currency = scraped.currency;
      
      console.log(`Current price: ${currency}${currentPrice}`);
      console.log(`Target range: ${currency}${product.minPrice} - ${currency}${product.maxPrice}`);
      
      // Check if price is in range
      const inRange = currentPrice >= product.minPrice && currentPrice <= product.maxPrice;
      
      // Always send alert if price is in range
      if (inRange) {
        console.log(`🔔 ALERT: Price is in your range! Sending email...`);
        await sendPriceAlert({
          ...product,
          title,
          currency,
          url: product.url
        }, currentPrice, true);
      } else {
        console.log(`✗ Price is outside range (${currentPrice < product.minPrice ? 'too low' : 'too high'})`);
      }
      
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Error checking ${product.name}:`, error.message);
      // Don't send error emails
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
