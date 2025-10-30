const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, 'products.json');

async function initDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
  }
}

async function getProducts() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveProducts(products) {
  await fs.writeFile(DB_FILE, JSON.stringify(products, null, 2));
}

async function addProduct(url, targetPrice = null) {
  await initDB();
  const products = await getProducts();
  
  // Check if product already exists
  const existing = products.find(p => p.url === url);
  if (existing) {
    return { success: false, message: 'Product already being tracked' };
  }
  
  products.push({
    id: Date.now().toString(),
    url,
    targetPrice,
    lastPrice: null,
    lastChecked: null,
    title: null,
    addedAt: new Date().toISOString()
  });
  
  await saveProducts(products);
  return { success: true, message: 'Product added successfully' };
}

async function removeProduct(id) {
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  
  if (filtered.length === products.length) {
    return { success: false, message: 'Product not found' };
  }
  
  await saveProducts(filtered);
  return { success: true, message: 'Product removed successfully' };
}

async function updateProduct(id, updates) {
  const products = await getProducts();
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) {
    return { success: false, message: 'Product not found' };
  }
  
  products[index] = { ...products[index], ...updates };
  await saveProducts(products);
  return { success: true, product: products[index] };
}

module.exports = {
  initDB,
  getProducts,
  addProduct,
  removeProduct,
  updateProduct
};
