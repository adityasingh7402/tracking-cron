const axios = require('axios');
const cheerio = require('cheerio');

// User agent to avoid blocking
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function scrapeAmazon(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    const $ = cheerio.load(data);
    
    // Try multiple selectors as Amazon frequently changes them
    let price = null;
    const selectors = [
      '.a-price-whole',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price .a-offscreen'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        price = element.text().trim().replace(/[^0-9.]/g, '');
        if (price) break;
      }
    }
    
    const title = $('#productTitle').text().trim() || 'Amazon Product';
    
    if (!price) {
      throw new Error('Price not found on page');
    }
    
    return {
      price: parseFloat(price),
      title,
      currency: '₹'
    };
  } catch (error) {
    console.error('Amazon scraping error:', error.message);
    throw new Error(`Failed to scrape Amazon: ${error.message}`);
  }
}

async function scrapeFlipkart(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    const $ = cheerio.load(data);
    
    // Flipkart price selectors
    let price = null;
    const selectors = [
      '._30jeq3._16Jk6d',
      '._30jeq3',
      '.CEmiEU div'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        price = element.text().trim().replace(/[^0-9.]/g, '');
        if (price) break;
      }
    }
    
    // Title selectors
    const title = $('span.VU-ZEz').first().text().trim() || 
                  $('._6EBuvT span').first().text().trim() ||
                  'Flipkart Product';
    
    if (!price) {
      throw new Error('Price not found on page');
    }
    
    return {
      price: parseFloat(price),
      title,
      currency: '₹'
    };
  } catch (error) {
    console.error('Flipkart scraping error:', error.message);
    throw new Error(`Failed to scrape Flipkart: ${error.message}`);
  }
}

async function scrapeProduct(url) {
  if (url.includes('amazon.')) {
    return scrapeAmazon(url);
  } else if (url.includes('flipkart.')) {
    return scrapeFlipkart(url);
  } else {
    throw new Error('Unsupported website. Only Amazon and Flipkart are supported.');
  }
}

module.exports = { scrapeProduct };
