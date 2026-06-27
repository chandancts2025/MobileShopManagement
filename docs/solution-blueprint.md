# Mobile Shop Management Solution Blueprint

## 1. Solution Architecture

- `MobileShop.Api`: ASP.NET Core Web API host, controllers, authentication, Swagger, startup configuration.
- `MobileShop.Application`: contracts, DTOs, paging models, service abstractions, security abstractions.
- `MobileShop.Domain`: entities, enums, and shared domain base classes.
- `MobileShop.Infrastructure`: EF Core context, repositories, JWT implementation, password hashing, business services, seed data.
- `mobile-shop-ui`: Angular 20 frontend with standalone components, route-based navigation, dashboard, auth, product, order, and report screens.

## 2. Database Schema

Core tables:

- `Users`
- `CustomerProfiles`
- `Addresses`
- `Categories`
- `Brands`
- `Products`
- `InventoryStocks`
- `StockTransactions`
- `Suppliers`
- `PurchaseOrders`
- `PurchaseOrderItems`
- `TaxRules`
- `PromoCodes`
- `Orders`
- `OrderItems`
- `Payments`
- `Invoices`
- `RefreshTokens`
- `AuditLogs`
- `AppSettings`
- `Expenses`
- `RepairTickets`

## 3. API Surface

Implemented endpoint areas:

- authentication and staff users
- customers and customer addresses
- categories, brands, products, pricing, taxes, and promo codes
- stock levels, stock receiving, manual adjustments, and stock transaction ledger
- suppliers, purchase orders, partial receiving, and purchase cancellation
- sales orders, payment capture, invoices, returns, and return status workflow
- repair tickets with device, IMEI/serial, status, estimate, advance, and final amount
- expenses for rent, salary, utilities, delivery, repairs, and other daily shop outgoings
- dashboard, sales, stock, tax, expense, daily cash, and profit/loss reports

Recommended next modules:

- barcode/IMEI unit-level stock tracking, multi-store stock transfers, loyalty points, notification templates, exportable reports, and accounting integration

## 4. Roles

- `SuperAdmin`: full access
- `Admin`: catalog, inventory, orders, reports
- `Operator`: daily operations, customers, orders, stock visibility
- `Customer`: shopping, order history, profile

## 5. Seed Data

- `superadmin@mobileshop.local` / `SuperAdmin@123`
- `admin@mobileshop.local` / `Admin@123`
- categories: Smartphones, Tablets
- brands: Samsung, Apple, OnePlus
- standard tax rule: 18%

## 6. Deployment Guidance

- backend: publish ASP.NET Core API to IIS, Azure App Service, or a container
- database: run EF Core migrations against SQL Server
- frontend: build Angular assets and host with IIS, Nginx, or Azure Static Web Apps
- set production CORS, JWT secrets, and connection strings through environment-specific config
