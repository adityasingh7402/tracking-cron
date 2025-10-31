const axios = require('axios');
const cheerio = require('cheerio');
const { scrapeFlipkartAdvanced, scrapeMyntraAdvanced, closeBrowser } = require('./advancedScraper');
require('dotenv').config();

// User agent to avoid blocking
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ScraperAPI configuration (renders JavaScript for dynamic sites)
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

function getScraperApiUrl(url, renderJs = false) {
  if (!SCRAPER_API_KEY) return null;
  const baseUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
  // Enable JavaScript rendering for sites that need it
  return renderJs ? `${baseUrl}&render=true` : baseUrl;
}

async function scrapeAmazon(url) {
  try {
    // Use ScraperAPI for Amazon (blocks heavily + needs JS rendering)
    const scraperApiUrl = getScraperApiUrl(url, true);
    let data;
    
    if (scraperApiUrl) {
      console.log('Using ScraperAPI with JS rendering for Amazon...');
      const response = await axios.get(scraperApiUrl, {
        timeout: 60000 // Longer timeout for JS rendering
      });
      data = response.data;
    } else {
      console.log('Warning: No ScraperAPI key - Amazon will likely block.');
      const response = await axios.get(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });
      data = response.data;
    }
    
    const $ = cheerio.load(data);
    
    // Try multiple selectors as Amazon frequently changes them
    let price = null;
    const selectors = [
      '.a-price-whole',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price .a-offscreen',
      'span.a-price-whole'
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
    
    console.log('✓ Successfully scraped Amazon');
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
    // Use advanced Puppeteer scraper for Flipkart (free, no API needed)
    console.log('Using Puppeteer for Flipkart...');
    return await scrapeFlipkartAdvanced(url);
  } catch (error) {
    console.error('Flipkart scraping error:', error.message);
    throw new Error(`Failed to scrape Flipkart: ${error.message}`);
  }
}

async function scrapeMyntra(url) {
  try {
    // Use advanced Puppeteer scraper for Myntra (free, no API needed)
    console.log('Using Puppeteer for Myntra...');
    return await scrapeMyntraAdvanced(url);
  } catch (error) {
    console.error('Myntra scraping error:', error.message);
    throw new Error(`Failed to scrape Myntra: ${error.message}`);
  }
}

async function scrapeProduct(url) {
  if (url.includes('amazon.')) {
    return scrapeAmazon(url);
  } else if (url.includes('flipkart.')) {
    return scrapeFlipkart(url);
  } else if (url.includes('myntra.')) {
    return scrapeMyntra(url);
  } else {
    throw new Error('Unsupported website. Only Amazon, Flipkart, and Myntra are supported.');
  }
}

module.exports = { scrapeProduct };
