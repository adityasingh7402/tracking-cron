# 🛒 Amazon & Flipkart Price Tracker

A **free** price tracking service that monitors Amazon and Flipkart products and sends Gmail alerts when prices drop. Designed to run on Render's free tier with automatic cron jobs.

## ✨ Features

- 📊 Track products from **Amazon** and **Flipkart**
- 💰 Get email alerts when prices drop
- 🎯 Set target prices for specific products
- ⏰ Automatic price checks every 6 hours via cron job
- 🆓 **100% Free** - Uses free tier of Render
- 📧 Beautiful HTML email notifications
- 🔄 RESTful API to manage tracked products

## 🚀 Setup Instructions

### 1. Gmail App Password Setup

To send email alerts, you need a Gmail App Password (not your regular password):

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** → **2-Step Verification** (enable if not already)
3. Scroll down and select **App passwords**
4. Select **Mail** and **Other (Custom name)**
5. Enter "Price Tracker" and click **Generate**
6. Copy the 16-digit password (you'll need this for Render)

### 2. Deploy to Render

#### Option A: Using GitHub (Recommended)

1. Create a new GitHub repository and push this code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/price-tracker.git
   git push -u origin main
   ```

2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **New** → **Blueprint**
4. Connect your GitHub repository
5. Render will detect `render.yaml` and create both services automatically
6. Add environment variables for both services:
   - `GMAIL_USER`: Your Gmail address (e.g., `yourname@gmail.com`)
   - `GMAIL_APP_PASSWORD`: The 16-digit app password from step 1

#### Option B: Manual Deployment

1. Go to [Render Dashboard](https://dashboard.render.com/)

2. **Create Web Service:**
   - Click **New** → **Web Service**
   - Connect your repo or upload files
   - Name: `price-tracker-api`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add environment variables

3. **Create Cron Job:**
   - Click **New** → **Cron Job**
   - Name: `price-checker-cron`
   - Schedule: `0 */6 * * *` (every 6 hours)
   - Build Command: `npm install`
   - Command: `npm run check-prices`
   - Add same environment variables

### 3. Using the API

Once deployed, Render will give you a URL like `https://price-tracker-api.onrender.com`

#### Add a Product to Track

```bash
curl -X POST https://your-app.onrender.com/products \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.amazon.in/dp/PRODUCT_ID",
    "targetPrice": 5000
  }'
```

Or use this format for Flipkart:
```bash
curl -X POST https://your-app.onrender.com/products \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.flipkart.com/product/p/PRODUCT_ID"
  }'
```

#### List All Tracked Products

```bash
curl https://your-app.onrender.com/products
```

#### Remove a Product

```bash
curl -X DELETE https://your-app.onrender.com/products/PRODUCT_ID
```

#### Manually Trigger Price Check

```bash
curl -X POST https://your-app.onrender.com/check
```

## 🔧 Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-digit-app-password
   PORT=3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Test price checking manually:
   ```bash
   npm run check-prices
   ```

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check & API info |
| GET | `/products` | List all tracked products |
| POST | `/products` | Add a product to track |
| DELETE | `/products/:id` | Remove a product |
| POST | `/check` | Manually trigger price check |

## 🎯 How It Works

1. **Add Products:** Use the API to add Amazon/Flipkart product URLs
2. **Automated Checking:** Render's cron job checks prices every 6 hours
3. **Price Comparison:** Compares current price with last recorded price
4. **Email Alerts:** Sends beautiful HTML email when price drops
5. **Target Price:** Optionally set a target price - only get alerts when price reaches or drops below it

## ⚠️ Important Notes

### Render Free Tier Limits
- Web service sleeps after 15 minutes of inactivity
- Cron jobs run on schedule even if web service is sleeping
- 750 hours/month free (enough for 24/7 operation)
- No credit card required

### Scraping Considerations
- Amazon and Flipkart may block requests if too frequent
- Built-in 2-second delay between product checks
- Selectors may change; update `scraper.js` if needed
- Consider rotating user agents if facing issues

### Data Storage
- Products stored in `products.json` file
- Persists on Render's disk (may reset on redeployment)
- For production, consider using a free database like MongoDB Atlas

## 🔄 Customizing Check Frequency

Edit `render.yaml` to change cron schedule:

```yaml
schedule: "0 */6 * * *"  # Every 6 hours (recommended)
# Other options:
# "0 */3 * * *"    - Every 3 hours
# "0 */12 * * *"   - Every 12 hours  
# "0 9,21 * * *"   - 9 AM and 9 PM daily
```

## 🐛 Troubleshooting

**No emails received?**
- Check Gmail App Password is correct
- Verify environment variables in Render
- Check Render logs for errors

**Scraping not working?**
- Website HTML structure may have changed
- Update selectors in `scraper.js`
- Check if site is blocking requests

**Products.json getting reset?**
- Render's ephemeral disk resets on new deploys
- Use a database for persistent storage

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Pull requests welcome! Feel free to improve scraping logic, add more stores, or enhance email templates.

---

Made with ❤️ for deal hunters
