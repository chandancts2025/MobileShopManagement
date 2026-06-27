# 🚀 Quick Start Guide - Mobile Shop Management System

## For Developers: Getting Started in 5 Minutes

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQL Server 2019+ or LocalDB
- Visual Studio Code / Visual Studio 2022

---

## 📥 Step 1: Clone & Setup Backend

```bash
# Navigate to project
cd C:\Dev\Mobile2

# Restore NuGet packages
dotnet restore

# Apply database migrations
cd MobileShop.Api
dotnet ef database update

# Run API
dotnet run

# API running at: https://localhost:5001
# Swagger UI: https://localhost:5001/swagger
```

---

## 📥 Step 2: Setup Frontend

```bash
# Navigate to web project
cd MobileShop.Web

# Install dependencies
npm install

# Start development server
npm start

# Frontend running at: http://localhost:4200
```

---

## 🔑 Step 3: Test Login

### Default Test Accounts

**Admin Account**
- Email: `admin@mobileshop.com`
- Password: `Admin@123456`
- Role: SuperAdmin

**Shop Owner Account**
- Email: `owner@mobileshop.com`
- Password: `Owner@123456`
- Role: Admin

**Customer Account**
- Email: `customer@mobileshop.com`
- Password: `Customer@123456`
- Role: Customer

---

## 🎯 Key Endpoints to Test

### Reviews API
```
GET    /api/reviews
POST   /api/reviews
GET    /api/reviews/{id}
PUT    /api/reviews/{id}
DELETE /api/reviews/{id}
POST   /api/reviews/{id}/approve
GET    /api/reviews/product/{productId}
```

### Wishlist API
```
GET    /api/wishlist
POST   /api/wishlist
DELETE /api/wishlist/{id}
GET    /api/wishlist/summary
```

### Notifications API
```
GET    /api/notifications
POST   /api/notifications
PUT    /api/notifications/{id}/read
DELETE /api/notifications/{id}
```

### Loyalty API
```
GET    /api/loyalty/account
POST   /api/loyalty/redeem
GET    /api/loyalty/transactions
GET    /api/loyalty/tier-info
```

### Search API
```
GET    /api/search?search=iphone&categoryId=xxx
GET    /api/search/suggestions?term=iphone
GET    /api/search/filters/categories
GET    /api/search/filters/brands
GET    /api/search/filters/prices
```

---

## 🎨 Frontend Navigation

### Shop Owner / Admin Routes
- `/dashboard` - Enhanced dashboard with KPIs
- `/inventory` - Inventory management
- `/orders` - Order management
- `/reports` - Sales & financial reports
- `/notifications` - System notifications
- `/settings` - Configuration

### Customer Routes
- `/catalog` - Browse products
- `/search` - Advanced search & filtering
- `/wishlist` - Saved products
- `/orders` - Order history & tracking
- `/loyalty` - Loyalty rewards
- `/profile` - Customer profile

---

## 🧪 Testing a Complete Flow

### 1. Create a Product Review
```bash
# Get a product ID first
GET /api/products?pageNumber=1&pageSize=10

# Create review
POST /api/reviews
Content-Type: application/json
Authorization: Bearer {token}

{
  "productId": "product-guid",
  "rating": 5,
  "title": "Excellent phone!",
  "content": "Great battery life and camera quality."
}
```

### 2. Add to Wishlist
```bash
POST /api/wishlist
Content-Type: application/json
Authorization: Bearer {token}

{
  "productId": "product-guid"
}
```

### 3. Initialize Loyalty Account
```bash
POST /api/loyalty/account
Authorization: Bearer {token}
```

### 4. Create Notification
```bash
POST /api/notifications
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": "user-guid",
  "type": 1,
  "subject": "Price Drop Alert",
  "content": "iPhone 15 price dropped by 10%"
}
```

### 5. Search Products
```bash
GET /api/search?search=iphone&minPrice=500&maxPrice=1000
```

---

## 📊 Database Verification

### Check Tables Exist
```sql
USE MobileShopDb

-- New tables
SELECT * FROM ProductReviews
SELECT * FROM WishlistItems
SELECT * FROM Notifications
SELECT * FROM LoyaltyAccounts
SELECT * FROM LoyaltyTransactions
SELECT * FROM LoyaltyRedemptions
SELECT * FROM ReviewImages
SELECT * FROM NotificationTemplates
```

---

## 🐛 Common Issues & Fixes

### Issue: Database Not Found
**Fix**: Update connection string in `appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=MobileShopDb;Trusted_Connection=true;"
  }
}
```

### Issue: CORS Error
**Fix**: Frontend and API must run on allowed origins
- API: `https://localhost:5001`
- Frontend: `http://localhost:4200`

### Issue: 401 Unauthorized
**Fix**: Ensure JWT token is included in headers
```
Authorization: Bearer {token}
```

### Issue: Swagger Not Loading
**Fix**: Check API is running and access: https://localhost:5001/swagger

---

## 📚 Key Features to Try

### 1. Product Reviews
- Browse reviews on product detail page
- Submit your own review
- Rate review as helpful/unhelpful
- See verified purchase badge

### 2. Wishlist
- Save products for later
- Track price changes
- Get notifications on price drops
- See wishlist summary

### 3. Loyalty Rewards
- Earn points on purchases
- Auto-upgrade to higher tiers
- Redeem points for discounts
- View transaction history

### 4. Advanced Search
- Full-text product search
- Filter by category, brand, price
- Get autocomplete suggestions
- See filter aggregations

### 5. Order Tracking
- View order timeline
- Track payment status
- See estimated delivery
- Download invoice

---

## 🔧 Configuration

### Environment Variables (Optional)
```bash
# API
API_PORT=5001
DB_CONNECTION=Server=localhost;Database=MobileShopDb;...
JWT_SECRET=your-secret-key

# Email Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM=noreply@mobileshop.com

# SMS Service (Twilio - optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

### Local Configuration
Edit `MobileShop.Api/appsettings.Development.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug"
    }
  },
  "Jwt": {
    "SecretKey": "your-dev-secret-key-min-32-chars",
    "ExpirationMinutes": 60
  }
}
```

---

## 📱 Testing on Mobile

### Using Browser DevTools
1. Press `F12` in Chrome/Edge
2. Click device toggle (mobile icon)
3. Refresh page
4. Test responsive design

### Using Real Device
1. Get your PC IP: `ipconfig`
2. Access from phone: `http://[pc-ip]:4200`
3. Test all features on mobile

---

## ✅ Deployment Checklist

Before going to production:
- [ ] Update database connection string
- [ ] Set strong JWT secret key
- [ ] Configure SendGrid/Mailgun keys
- [ ] Set API CORS origins
- [ ] Configure SSL certificates
- [ ] Set up automated backups
- [ ] Enable SQL Server backups
- [ ] Configure application logging
- [ ] Set up monitoring/alerts
- [ ] Load test the system
- [ ] Security audit complete
- [ ] User acceptance testing done

---

## 📞 Support

### Documentation
- API Docs: `https://localhost:5001/swagger`
- Feature Guide: `./ENHANCEMENTS.md`
- Setup Guide: `./COMPLETE_GUIDE.md`
- File Inventory: `./FILE_INVENTORY.md`

### Common Commands
```bash
# Run tests
dotnet test

# Build for release
dotnet build -c Release

# Publish for deployment
dotnet publish -c Release -o publish

# Create new migration
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update
```

---

## 🎓 Next Steps

1. **Explore the Code**
   - Review service implementations
   - Understand dependency injection
   - Study validation rules

2. **Run Tests**
   - Unit tests for services
   - Integration tests for APIs
   - End-to-end tests for features

3. **Customize**
   - Add more review fields
   - Implement SMS notifications
   - Add payment gateway
   - Customize loyalty tiers

4. **Deploy**
   - Set up CI/CD pipeline
   - Deploy to staging
   - User testing
   - Production release

---

## 💡 Pro Tips

### Development Tips
- Use Swagger to test APIs before UI
- Debug services with breakpoints
- Use browser DevTools for frontend debugging
- Check browser console for errors

### Performance Tips
- Monitor database queries
- Cache frequently accessed data
- Use pagination for large datasets
- Enable production logging

### Security Tips
- Never commit secrets to Git
- Use environment variables
- Validate all user input
- Use HTTPS in production

---

**🎉 You're ready to go! Start exploring the system.**

For detailed documentation, see:
- `COMPLETE_GUIDE.md` - Full setup guide
- `ENHANCEMENTS.md` - Feature documentation
- `FILE_INVENTORY.md` - Code structure
- `PROJECT_COMPLETION_REPORT.md` - Project status

---
