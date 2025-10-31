const puppeteer = require('puppeteer');

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
  }
  return browser;
}

async function scrapeWithPuppeteer(url, selectors) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Go to page
    console.log('Loading page with Puppeteer...');
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find price using selectors
    let price = null;
    let title = null;
    
    for (const selector of selectors.price) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        const element = await page.$(selector);
        if (element) {
          const text = await page.evaluate(el => el.textContent, element);
          const priceMatch = text.match(/[\d,]+/);
          if (priceMatch) {
            price = priceMatch[0].replace(/,/g, '');
            console.log(`Found price with selector: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Selector not found, try next
      }
    }
    
    // If no selector worked, search in page text
    if (!price) {
      console.log('Trying to find price in page text...');
      const bodyText = await page.evaluate(() => document.body.innerText);
      const priceMatches = bodyText.match(/₹[\s]*[\d,]+/g);
      if (priceMatches && priceMatches.length > 0) {
        // Take the first significant price (usually the product price)
        const firstPrice = priceMatches[0].match(/[\d,]+/);
        if (firstPrice) {
          price = firstPrice[0].replace(/,/g, '');
          console.log('Found price in page text');
        }
      }
    }
    
    // Try to get title
    for (const selector of selectors.title) {
      try {
        const element = await page.$(selector);
        if (element) {
          title = await page.evaluate(el => el.textContent, element);
          title = title.trim();
          if (title) break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!price) {
      throw new Error('Price not found on page');
    }
    
    return {
      price: parseFloat(price),
      title: title || 'Product',
      currency: '₹'
    };
    
  } finally {
    await page.close();
  }
}

async function scrapeFlipkartAdvanced(url) {
  const selectors = {
    price: [
      'div.Nx9bqj.CxhGGd',
      'div.Nx9bqj',
      'div._30jeq3._16Jk6d',
      'div._30jeq3',
      'div.CEmiEU div',
      '[class*="price"]'
    ],
    title: [
      'span.VU-ZEz',
      'span.B_NuCI',
      'h1.yhB1nd',
      '[class*="title"]'
    ]
  };
  
  return scrapeWithPuppeteer(url, selectors);
}

async function scrapeMyntraAdvanced(url) {
  const selectors = {
    price: [
      'span.pdp-price strong',
      'span.pdp-price',
      'div.pdp-price',
      '[class*="pdp-price"]',
      '[class*="price"]'
    ],
    title: [
      'h1.pdp-title',
      'h1.pdp-name',
      '[class*="pdp-title"]',
      '[class*="title"]'
    ]
  };
  
  return scrapeWithPuppeteer(url, selectors);
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

module.exports = { 
  scrapeFlipkartAdvanced, 
  scrapeMyntraAdvanced,
  closeBrowser 
};
