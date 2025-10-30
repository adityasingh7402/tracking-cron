const axios = require('axios');
const cheerio = require('cheerio');
const { HttpsProxyAgent } = require('https-proxy-agent');

// User agent to avoid blocking
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Free proxy list (rotate if one fails)
const FREE_PROXIES = [
  'http://proxy.toolip.gr:31288',
  'http://20.111.54.16:8123',
  'http://195.23.57.78:80',
  'http://47.56.110.204:8989'
];

let proxyIndex = 0;

function getNextProxy() {
  const proxy = FREE_PROXIES[proxyIndex % FREE_PROXIES.length];
  proxyIndex++;
  return proxy;
}

async function scrapeAmazon(url) {
  // Try with proxy first, fallback to direct if proxy fails
  const attempts = [
    { useProxy: true },
    { useProxy: true },  // Try another proxy
    { useProxy: false }  // Fallback to direct
  ];
  
  for (const attempt of attempts) {
    try {
      const config = {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        timeout: 10000
      };
      
      if (attempt.useProxy) {
        const proxy = getNextProxy();
        config.httpsAgent = new HttpsProxyAgent(proxy);
        console.log(`Trying proxy: ${proxy}`);
      } else {
        console.log('Trying direct connection...');
      }
      
      const { data } = await axios.get(url, config);
      
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
      console.log(`✗ Attempt failed: ${error.message}`);
      if (attempt === attempts[attempts.length - 1]) {
        throw new Error(`Failed to scrape Amazon after all attempts: ${error.message}`);
      }
      // Continue to next attempt
    }
  }
}

async function scrapeFlipkart(url) {
  const attempts = [
    { useProxy: true },
    { useProxy: true },
    { useProxy: false }
  ];
  
  for (const attempt of attempts) {
    try {
      const config = {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      };
      
      if (attempt.useProxy) {
        const proxy = getNextProxy();
        config.httpsAgent = new HttpsProxyAgent(proxy);
        console.log(`Trying proxy: ${proxy}`);
      } else {
        console.log('Trying direct connection...');
      }
      
      const { data } = await axios.get(url, config);
      
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
      
      console.log('✓ Successfully scraped Flipkart');
      return {
        price: parseFloat(price),
        title,
        currency: '₹'
      };
    } catch (error) {
      console.log(`✗ Attempt failed: ${error.message}`);
      if (attempt === attempts[attempts.length - 1]) {
        throw new Error(`Failed to scrape Flipkart after all attempts: ${error.message}`);
      }
    }
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
