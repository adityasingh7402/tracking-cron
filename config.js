// Add your products here with price ranges
module.exports = {
  // Email settings
  recipientEmail: 'adityasingh7402@gmail.com', // Change this to send to someone else
  
  // Products to track
  products: [
    {
      name: 'Product 1',
      url: 'https://www.amazon.in/realme-Wireless-Earbuds-Dynamic-Playback/dp/B0FBR6HGXM/ref=sr_1_3?crid=2O95HFFMFX53O&dib=eyJ2IjoiMSJ9.J32s45LbhIaQdDjKSYUHEZayxG-oswWCBNFMyuV0vakzKxqrxV_it4mOqTtZwRGwPzB-LxqDE2YW9PVhaYTW0myhlRg_plAEhtHfdw5cPf1bJjPOBNgfA-Ba3do6KR9Z5YRAsea47z6-OH_W6oU84JfP9jlE5MCN6Pkq-tKi8eQ9LXnNttCZKVmKUFrRPR4An8qGy8l6FtL81o8M7qXp3LLeR1zLYuN4oq4rk6AlXWg.Z8uW-YcZ3U40HChgvasOFaBE1nZAks7VaqWizD3b0mQ&dib_tag=se&keywords=realme%2Bt200x&nsdOptOutParam=true&qid=1761828262&sprefix=realme%2Bt200%2Caps%2C293&sr=8-3&th=1', // Replace with actual Amazon URL
      minPrice: 1500,  // Alert when price is >= this
      maxPrice: 1700   // Alert when price is <= this
    },
    {
      name: 'Product 2',
      url: 'https://www.flipkart.com/product/p/YOUR_PRODUCT_ID_HERE', // Replace with actual Flipkart URL
      minPrice: 1500,
      maxPrice: 1700
    }
    // Add more products here...
  ]
};
