# Mobile Shop Management System - Complete Implementation Guide

## Executive Summary

This document provides a comprehensive overview of the Mobile Shop Management System enhancements, covering architecture, features, deployment, and usage.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [New Features](#new-features)
3. [Architecture](#architecture)
4. [Installation & Setup](#installation--setup)
5. [API Documentation](#api-documentation)
6. [User Guide](#user-guide)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

### What's New?

The Mobile Shop Management System has been enhanced with four major feature sets targeting both shop owners and customers:

1. **Product Review System** - Customers can leave ratings and reviews
2. **Wishlist Management** - Save products with price tracking
3. **Notification Center** - Real-time alerts for orders, inventory, and promotions
4. **Loyalty Rewards Program** - Points-based rewards with tier benefits

### Key Benefits

**For Shop Owners**
- ✅ Increased customer engagement through reviews
- ✅ Better inventory management with alerts
- ✅ Customer retention via loyalty program
- ✅ Real-time business notifications
- ✅ Data-driven decision making

**For Customers**
- ✅ Share product feedback
- ✅ Save and track favorite products
- ✅ Stay informed with notifications
- ✅ Earn rewards for purchases
- ✅ Enjoy tiered benefits

---

## 🎁 New Features

### 1. Product Review & Rating System

#### Overview
Customers can leave detailed reviews with ratings for products they've purchased.

#### Key Features
- **1-5 Star Ratings** - Standard rating system
- **Verified Purchase Badge** - Only verified buyers can review
- **Photo Uploads** - Add up to 5 images per review
- **Helpful Voting** - Community rating of reviews
- **Admin Moderation** - Reviews require approval before publishing

#### Database Tables
```sql
ProductReviews
├── Id (GUID PK)
├── ProductId (FK)
├── CustomerProfileId (FK)
├── Rating (1-5)
├── Title (string)
├── Comment (text)
├── IsVerifiedPurchase (bool)
├── HelpfulCount (int)
├── UnhelpfulCount (int)
├── IsApproved (bool)
└── Timestamps

ReviewImages
├── Id (GUID PK)
├── ReviewId (FK)
├── ImageUrl (string)
└── Caption (string)
```

#### API Endpoints

**Get Product Reviews**
```
GET /api/reviews/product/{productId}?pageNumber=1&pageSize=10
Authorization: Bearer <token> (optional)
Response: { items: [ReviewDto], totalCount: int, pageNumber: int, pageSize: int }
```

**Create Review** (Requires Customer role)
```
POST /api/reviews
Body: {
  "productId": "guid",
  "rating": 5,
  "title": "Excellent product",
  "comment": "Works perfectly",
  "imageUrls": ["url1", "url2"]
}
Response: 201 Created with ReviewDto
```

**Get Review Summary**
```
GET /api/reviews/summary/{productId}
Response: {
  "averageRating": 4.5,
  "totalReviews": 23,
  "verifiedPurchaseCount": 20,
  "ratingDistribution": { "1": 1, "2": 0, "3": 2, "4": 5, "5": 15 }
}
```

**Approve Review** (Admin only)
```
POST /api/reviews/{id}/approve
Authorization: Bearer <token> (Admin required)
```

---

### 2. Wishlist Management

#### Overview
Customers can save products to a wishlist with price tracking and notifications.

#### Key Features
- **Save Products** - Add/remove items from wishlist
- **Price Tracking** - Monitor price changes
- **Automatic Alerts** - Notify when price drops
- **Wishlist Stats** - Total value, price drop count
- **Quick Actions** - Move to cart from wishlist

#### Database Tables
```sql
WishlistItems
├── Id (GUID PK)
├── CustomerProfileId (FK)
├── ProductId (FK)
├── PriceWhenAdded (decimal)
├── NotifyAtPrice (decimal nullable)
├── ShouldNotifyOnPriceChange (bool)
├── ViewCount (int)
├── LastViewedUtc (datetime nullable)
└── Timestamps
```

#### API Endpoints

**Get Customer Wishlist**
```
GET /api/wishlist?pageNumber=1&pageSize=20
Authorization: Bearer <token> (Customer required)
Response: { items: [WishlistItemDto], ... }
```

**Add to Wishlist**
```
POST /api/wishlist
Body: {
  "productId": "guid",
  "notifyAtPrice": 299.99,
  "shouldNotifyOnPriceChange": true
}
Response: 201 Created with WishlistItemDto
```

**Get Wishlist Summary**
```
GET /api/wishlist/summary
Response: {
  "totalItems": 5,
  "totalValue": 4999.95,
  "itemsWithPriceDrop": 2
}
```

**Clear Wishlist**
```
DELETE /api/wishlist/clear
Authorization: Bearer <token>
Response: 204 No Content
```

---

### 3. Notification System

#### Overview
Real-time notification center for orders, inventory, and promotions.

#### Key Features
- **Multi-Type Notifications** - 15 notification types
- **Read/Unread Tracking** - Mark as read
- **Notification Types**:
  - Order updates (Created, Confirmed, Shipped, Delivered)
  - Payment notifications
  - Low stock alerts
  - Price drops
  - Review approvals
  - Loyalty rewards

#### Database Tables
```sql
Notifications
├── Id (GUID PK)
├── UserId (FK)
├── Type (enum)
├── Title (string)
├── Message (string)
├── ActionUrl (string nullable)
├── IsRead (bool)
├── ReadAtUtc (datetime nullable)
└── Timestamps

NotificationTemplates
├── Id (GUID PK)
├── Name (string)
├── Type (enum)
├── EmailSubject (string)
├── EmailBody (string)
├── SmsBody (string nullable)
└── IsActive (bool)
```

#### API Endpoints

**Get Notifications**
```
GET /api/notifications?pageNumber=1&pageSize=20
Authorization: Bearer <token>
Response: { items: [NotificationDto], ... }
```

**Mark as Read**
```
POST /api/notifications/{id}/mark-read
Authorization: Bearer <token>
Response: 200 OK
```

**Get Notification Summary**
```
GET /api/notifications/summary
Response: {
  "totalUnread": 3,
  "totalNotifications": 45,
  "notificationsByType": { "1": 5, "2": 3, ... }
}
```

**Send Notification** (Admin/Operator only)
```
POST /api/notifications
Body: {
  "userId": "guid",
  "type": 1,
  "title": "Alert",
  "message": "Your order is ready",
  "actionUrl": "/orders/123"
}
Response: 201 Created
```

---

### 4. Loyalty Rewards Program

#### Overview
Points-based loyalty program with automatic tier upgrades and benefits.

#### Tier System
| Tier | Points Required | Multiplier | Discount |
|------|-----------------|-----------|----------|
| Bronze | 0+ | 1.0x | 0% |
| Silver | 1,000+ | 1.25x | 5% |
| Gold | 2,500+ | 1.5x | 10% |
| Platinum | 5,000+ | 2.0x | 15% |

#### Key Features
- **Automatic Points** - Earn on every purchase
- **Tier Progression** - Auto-upgrade as you earn
- **Points Multiplier** - Higher tiers earn faster
- **Discounts** - Use points for purchases
- **Transaction History** - Full audit trail

#### Database Tables
```sql
LoyaltyAccounts
├── Id (GUID PK)
├── CustomerProfileId (FK unique)
├── CurrentPoints (decimal)
├── Tier (enum)
├── TierMultiplier (decimal)
├── TotalPointsEarned (decimal)
├── TotalPointsRedeemed (decimal)
├── LastPointsActivityUtc (datetime)
├── JoinedUtc (datetime)
├── IsActive (bool)
└── Timestamps

LoyaltyTransactions
├── Id (GUID PK)
├── LoyaltyAccountId (FK)
├── TransactionType (enum)
├── PointsAmount (decimal)
├── Description (string)
├── RelatedOrderId (FK nullable)
├── CreatedAtUtc (datetime)
└── CreatedBy (string)

LoyaltyRedemptions
├── Id (GUID PK)
├── LoyaltyAccountId (FK)
├── PointsRedeemed (decimal)
├── DiscountAmount (decimal)
├── OrderId (FK nullable)
├── Status (enum)
├── ExpiresAtUtc (datetime nullable)
└── Timestamps
```

#### API Endpoints

**Get Loyalty Account**
```
GET /api/loyalty/account
Authorization: Bearer <token> (Customer required)
Response: LoyaltyAccountDto
```

**Initialize Account**
```
POST /api/loyalty/initialize
Authorization: Bearer <token>
Response: 200 OK with LoyaltyAccountDto
```

**Redeem Points**
```
POST /api/loyalty/redeem-points
Body: {
  "pointsToRedeem": 100,
  "orderId": "guid nullable"
}
Response: 200 OK
```

**Get Tier Progress**
```
GET /api/loyalty/tier-progress
Response: {
  "currentTier": "Silver",
  "currentPoints": 1500,
  "pointsForNextTier": 2500,
  "pointsProgressPercentage": 60,
  "nextTier": "Gold"
}
```

**Get Tier Benefits**
```
GET /api/loyalty/tier-benefits/Gold
Response: {
  "tier": "Gold",
  "pointsMultiplier": 1.5,
  "discountPercentage": 10,
  "description": "...",
  "pointsRequiredForUpgrade": 2500
}
```

---

## 🏗️ Architecture

### Domain-Driven Design

```
Domain Layer
├── Entities
│   ├── ProductReview
│   ├── WishlistItem
│   ├── Notification
│   └── LoyaltyAccount
├── Enums
│   ├── NotificationType
│   ├── LoyaltyTier
│   └── LoyaltyTransactionType
└── Common
    └── AuditableEntity

Application Layer
├── Services
│   ├── IReviewService
│   ├── IWishlistService
│   ├── INotificationService
│   └── ILoyaltyService
└── DTOs
    ├── ReviewDtos
    ├── WishlistDtos
    ├── NotificationDtos
    └── LoyaltyDtos

Infrastructure Layer
├── Services Implementation
│   ├── ReviewService
│   ├── WishlistService
│   ├── NotificationService
│   └── LoyaltyService
└── DbContext Mappings

API Layer
├── Controllers
│   ├── ReviewsController
│   ├── WishlistController
│   ├── NotificationsController
│   └── LoyaltyController
└── Middleware
    └── ExceptionHandling
```

### Data Flow

```
Client Request
    ↓
API Controller (Authorization)
    ↓
Service (Business Logic)
    ↓
Entity Framework (Data Access)
    ↓
SQL Server (Persistence)
    ↓
Response DTO
    ↓
Client
```

---

## 💾 Installation & Setup

### Prerequisites
- .NET 8.0 SDK
- SQL Server 2019+
- Node.js 18+
- npm 9+

### Backend Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd Mobile2
```

2. **Update Connection String**
Edit `MobileShop.Api/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-server;Database=MobileShop;Trusted_Connection=true;"
  }
}
```

3. **Run Migrations**
```bash
cd MobileShop.Api
dotnet ef migrations add AddNewFeatures
dotnet ef database update
```

4. **Build Solution**
```bash
dotnet build
```

5. **Run API**
```bash
dotnet run --project MobileShop.Api
```

API will be available at: `https://localhost:5001`
Swagger UI: `https://localhost:5001/swagger`

### Frontend Setup

1. **Navigate to Web Project**
```bash
cd MobileShop.Web
```

2. **Install Dependencies**
```bash
npm install
```

3. **Update API Configuration**
Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  apiUrl: 'https://localhost:5001'
};
```

4. **Start Development Server**
```bash
npm start
```

Application will be available at: `http://localhost:4200`

---

## 🔑 API Documentation

### Authentication

All endpoints require JWT token except public ones.

**Login**
```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password" }
Response: {
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresAtUtc": "2024-12-31T23:59:59Z"
}
```

**Using Token**
```
Authorization: Bearer <access_token>
```

### Response Format

**Success (200-201)**
```json
{
  "id": "guid",
  "data": { ... }
}
```

**Error (400-500)**
```json
{
  "message": "Error description",
  "errors": ["error1", "error2"]
}
```

### Pagination

Supported on list endpoints:
```
GET /api/resource?pageNumber=1&pageSize=20&search=query&sortBy=field&sortDescending=false
```

---

## 👥 User Guide

### For Shop Owners

**Managing Reviews**
1. Go to Products page
2. Select a product
3. View all reviews in Reviews tab
4. Click "Approve" or "Reject" on pending reviews

**Managing Notifications**
1. Click Notifications icon in top bar
2. View all recent notifications
3. Mark as read/delete as needed
4. Check notification summary for unread count

**Adding Loyalty Points**
1. Go to Customers page
2. Select customer
3. Click "Loyalty" tab
4. Enter points and reason
5. Submit to add points

**Monitoring Inventory**
- Low stock alerts appear in notification center
- Set reorder levels in product settings
- Automatic notifications for low stock

### For Customers

**Leaving a Review**
1. Go to product detail page
2. Click "Leave a Review"
3. Select rating (1-5 stars)
4. Add title and comment
5. Upload photos (optional)
6. Submit review

**Using Wishlist**
1. Click heart icon on any product
2. Product is added to wishlist
3. Go to Wishlist page to manage
4. Set price alerts on items
5. Get notified when price drops

**Checking Notifications**
1. Click bell icon in top bar
2. View all notifications
3. Click notification to go to related page
4. Mark as read

**Using Loyalty Points**
1. Go to Rewards page
2. View current points and tier
3. See progress to next tier
4. Redeem points for discounts
5. View transaction history

---

## 🚀 Deployment

### Production Checklist

- ✅ Update connection strings for production database
- ✅ Set JWT secret key in environment variables
- ✅ Enable HTTPS
- ✅ Configure CORS for production domain
- ✅ Enable SQL Server auditing
- ✅ Set up backups
- ✅ Configure error logging
- ✅ Set up monitoring

### Docker Deployment

**Dockerfile for API**
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /build
COPY . .
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /build/out .
EXPOSE 80 443
ENTRYPOINT ["dotnet", "MobileShop.Api.dll"]
```

**Docker Compose**
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5001:80"
    environment:
      - ConnectionStrings__DefaultConnection=Server=sqlserver;Database=MobileShop;...
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - SA_PASSWORD=Your@Password123
    ports:
      - "1433:1433"
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Migrations fail**
```
Error: Could not find DbSet<ProductReview>
Solution: Ensure DbContext includes new entities
```

**Issue: CORS errors**
```
Error: Access to XMLHttpRequest blocked by CORS policy
Solution: Update CORS policy in Program.cs to include frontend domain
```

**Issue: Notification not received**
```
Solution: Check if user ID is correct in database
Verify notification service is injected properly
```

**Issue: Loyalty points not added**
```
Solution: Ensure loyalty account is created first
Check points value is positive number
```

### Debug Mode

Enable logging:
```csharp
.UseSqlServer(..., options => options.EnableDetailedErrors())
```

Check logs:
```bash
tail -f /var/log/application.log
```

---

## 📞 Support

For issues:
1. Check this guide
2. Review API documentation in Swagger
3. Check logs for error details
4. Review source code comments
5. Open issue on GitHub repository

---

## 📚 Additional Resources

- [ENHANCEMENTS.md](./ENHANCEMENTS.md) - Feature details
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation status
- [Entity Framework Docs](https://docs.microsoft.com/en-us/ef/)
- [Angular Docs](https://angular.io/docs)
- [Bootstrap Docs](https://getbootstrap.com/docs)

---

**Version**: 1.0.0  
**Last Updated**: 2024-05-19  
**Status**: Production Ready ✅
