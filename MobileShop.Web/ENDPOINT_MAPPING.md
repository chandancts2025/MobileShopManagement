# Endpoint Mapping

This UI uses `src/app/core/endpoint-registry.ts` as the source-of-truth endpoint registry. The same registry is rendered at `/endpoint-map` for staff users.

| API area | Endpoints | UI route/component |
| --- | --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh-token` | `/register` `RegisterComponent`, `/login` `LoginComponent`, global `authInterceptor` |
| Storefront catalog | `GET /api/products`, `GET /api/products/{id}` | `/catalog` `CatalogComponent` |
| Cart checkout | `POST /api/orders` | `/cart` `CartComponent` |
| Customer order tools | `GET /api/invoices/{orderId}`, `POST /api/returns` | `/customer-orders` `CustomerOrdersComponent` |
| Dashboard | `GET /api/reports/dashboard-summary`, `GET /api/reports/low-stock` | `/dashboard` `DashboardComponent` |
| Sales | `GET /api/orders`, `PUT /api/orders/{id}/status`, `GET /api/payments`, `POST /api/payments`, `GET /api/invoices/{orderId}`, `GET /api/returns`, `POST /api/returns`, `PUT /api/returns/{id}/status` | `/sales` `SalesComponent` |
| Inventory | `GET /api/inventory/stocks`, `GET /api/inventory/transactions`, `POST /api/inventory/receive`, `POST /api/inventory/adjustment` | `/inventory` `InventoryComponent` |
| Purchasing | `GET /api/purchaseorders`, `GET /api/purchaseorders/{id}`, `POST /api/purchaseorders`, `POST /api/purchaseorders/{id}/receive`, `POST /api/purchaseorders/{id}/cancel` | `/purchasing` `PurchasingComponent` |
| Repairs | `GET /api/repairs`, `GET /api/repairs/{id}`, `POST /api/repairs`, `PUT /api/repairs/{id}`, `PUT /api/repairs/{id}/status`, `DELETE /api/repairs/{id}` | `/repairs` `RepairsComponent` |
| Product admin | `GET /api/products`, `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}` | `/admin/products` `ResourcePageComponent` |
| Category admin | `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/{id}`, `DELETE /api/categories/{id}` | `/admin/categories` `ResourcePageComponent` |
| Brand admin | `GET /api/brands`, `POST /api/brands`, `PUT /api/brands/{id}`, `DELETE /api/brands/{id}` | `/admin/brands` `ResourcePageComponent` |
| Customers | `GET /api/customers`, `GET /api/customers/{id}`, `POST /api/customers`, `PUT /api/customers/{id}` | `/admin/customers` `ResourcePageComponent` |
| Suppliers | `GET /api/suppliers`, `GET /api/suppliers/{id}`, `POST /api/suppliers`, `PUT /api/suppliers/{id}`, `DELETE /api/suppliers/{id}` | `/admin/suppliers` `ResourcePageComponent` |
| Expenses | `GET /api/expenses`, `GET /api/expenses/{id}`, `POST /api/expenses`, `PUT /api/expenses/{id}`, `DELETE /api/expenses/{id}` | `/admin/expenses` `ResourcePageComponent` |
| Pricing | `GET /api/taxes`, `POST /api/taxes`, `PUT /api/taxes/{id}`, `DELETE /api/taxes/{id}`, `GET /api/promocodes`, `POST /api/promocodes`, `PUT /api/promocodes/{id}`, `DELETE /api/promocodes/{id}` | `/admin/taxes`, `/admin/promocodes` `ResourcePageComponent` |
| Users | `GET /api/users`, `POST /api/users`, `PUT /api/users/{id}`, `DELETE /api/users/{id}` | `/admin/users` `ResourcePageComponent` |
| Settings | `GET /api/settings`, `POST /api/settings`, `PUT /api/settings/{id}`, `DELETE /api/settings/{id}` | `/admin/settings` `ResourcePageComponent` |
| Audit | `GET /api/auditlogs` | `/admin/audit-logs` `ResourcePageComponent` |
| Reports | `GET /api/reports/dashboard-summary`, `GET /api/reports/sales-by-date`, `GET /api/reports/sales-by-brand`, `GET /api/reports/sales-by-category`, `GET /api/reports/low-stock`, `GET /api/reports/tax-report`, `GET /api/reports/expenses-by-category`, `GET /api/reports/daily-cash-summary`, `GET /api/reports/profit-loss` | `/reports` `ReportsComponent` |
| Diagnostics | `GET /WeatherForecast` | `/diagnostics` `DiagnosticsComponent` |

Role-based access mirrors controller authorization:

- `SuperAdmin` and `Admin`: full management, reports, settings, users, pricing, deletes.
- `Operator`: operational sales, inventory, purchasing receive, repairs, expenses, and read-only lookup/master views where the API allows it.
- `Customer`: catalog, cart checkout, invoice lookup, and return request flows only.
- Anonymous users: catalog browsing, registration, and login.
