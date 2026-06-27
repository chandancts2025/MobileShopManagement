# Full API Catalog

## Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Users and Customers

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{id}`
- `GET /api/customers`
- `GET /api/customers/{id}`
- `POST /api/customers`
- `PUT /api/customers/{id}`

## Suppliers and Purchasing

- `GET /api/suppliers`
- `GET /api/suppliers/{id}`
- `POST /api/suppliers`
- `PUT /api/suppliers/{id}`
- `DELETE /api/suppliers/{id}`
- `GET /api/purchaseorders`
- `GET /api/purchaseorders/{id}`
- `POST /api/purchaseorders`
- `POST /api/purchaseorders/{id}/receive`
- `POST /api/purchaseorders/{id}/cancel`

## Catalog

- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `GET /api/brands`
- `POST /api/brands`
- `PUT /api/brands/{id}`
- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`

## Inventory

- `GET /api/inventory/stocks`
- `GET /api/inventory/transactions`
- `POST /api/inventory/receive`
- `POST /api/inventory/adjustment`

## Repairs and Service

- `GET /api/repairs`
- `GET /api/repairs/{id}`
- `POST /api/repairs`
- `PUT /api/repairs/{id}`
- `PUT /api/repairs/{id}/status`
- `DELETE /api/repairs/{id}`

## Expenses

- `GET /api/expenses`
- `GET /api/expenses/{id}`
- `POST /api/expenses`
- `PUT /api/expenses/{id}`
- `DELETE /api/expenses/{id}`

## Pricing and Promotions

- `GET /api/taxes`
- `POST /api/taxes`
- `PUT /api/taxes/{id}`
- `GET /api/promocodes`
- `POST /api/promocodes`
- `PUT /api/promocodes/{id}`

## Orders and Sales

- `GET /api/orders`
- `GET /api/orders/{id}`
- `POST /api/orders`
- `PUT /api/orders/{id}/status`
- `POST /api/payments`
- `GET /api/invoices/{orderId}`
- `POST /api/returns`
- `PUT /api/returns/{id}/status`

## Reports

- `GET /api/reports/dashboard-summary`
- `GET /api/reports/sales-by-date`
- `GET /api/reports/sales-by-brand`
- `GET /api/reports/sales-by-category`
- `GET /api/reports/low-stock`
- `GET /api/reports/tax-report`
- `GET /api/reports/expenses-by-category`
- `GET /api/reports/daily-cash-summary`
- `GET /api/reports/profit-loss`

## Settings and Audit

- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/audit-logs`
