import { RoleName } from './api.models';

export interface EndpointMapping {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  roles: ('Anonymous' | RoleName)[];
  route: string;
  component: string;
  feature: string;
  notes: string;
}

export const endpointMappings: EndpointMapping[] = [
  map('POST', '/api/auth/register', ['Anonymous'], '/register', 'RegisterComponent', 'Authentication', 'Creates a customer account and stores the issued JWT session.'),
  map('POST', '/api/auth/login', ['Anonymous'], '/login', 'LoginComponent', 'Authentication', 'Signs in seeded staff or customer accounts.'),
  map('POST', '/api/auth/refresh-token', ['SuperAdmin', 'Admin', 'Operator', 'Customer'], 'Global interceptor', 'authInterceptor/AuthService', 'Authentication', 'Refreshes expired bearer tokens and retries protected API calls.'),

  map('GET', '/api/products', ['Anonymous', 'SuperAdmin', 'Admin', 'Operator', 'Customer'], '/catalog and /admin/products', 'CatalogComponent/ResourcePageComponent', 'Catalog', 'Public browsing plus admin product management lookup.'),
  map('GET', '/api/products/{id}', ['Anonymous', 'SuperAdmin', 'Admin', 'Operator', 'Customer'], '/catalog', 'CatalogComponent', 'Catalog', 'Product detail drawer.'),
  map('POST', '/api/products', ['SuperAdmin', 'Admin'], '/admin/products', 'ResourcePageComponent', 'Catalog', 'Creates sellable products with category, brand, pricing, and stock.'),
  map('PUT', '/api/products/{id}', ['SuperAdmin', 'Admin'], '/admin/products', 'ResourcePageComponent', 'Catalog', 'Updates product master fields.'),
  map('DELETE', '/api/products/{id}', ['SuperAdmin', 'Admin'], '/admin/products', 'ResourcePageComponent', 'Catalog', 'Soft-deletes products.'),

  map('GET', '/api/categories', ['SuperAdmin', 'Admin', 'Operator'], '/admin/categories', 'ResourcePageComponent', 'Catalog lookups', 'Operators see a read-only lookup list.'),
  map('POST', '/api/categories', ['SuperAdmin', 'Admin'], '/admin/categories', 'ResourcePageComponent', 'Catalog lookups', 'Creates categories.'),
  map('PUT', '/api/categories/{id}', ['SuperAdmin', 'Admin'], '/admin/categories', 'ResourcePageComponent', 'Catalog lookups', 'Updates categories.'),
  map('DELETE', '/api/categories/{id}', ['SuperAdmin', 'Admin'], '/admin/categories', 'ResourcePageComponent', 'Catalog lookups', 'Deletes categories.'),
  map('GET', '/api/brands', ['SuperAdmin', 'Admin', 'Operator'], '/admin/brands', 'ResourcePageComponent', 'Catalog lookups', 'Operators see a read-only lookup list.'),
  map('POST', '/api/brands', ['SuperAdmin', 'Admin'], '/admin/brands', 'ResourcePageComponent', 'Catalog lookups', 'Creates brands.'),
  map('PUT', '/api/brands/{id}', ['SuperAdmin', 'Admin'], '/admin/brands', 'ResourcePageComponent', 'Catalog lookups', 'Updates brands.'),
  map('DELETE', '/api/brands/{id}', ['SuperAdmin', 'Admin'], '/admin/brands', 'ResourcePageComponent', 'Catalog lookups', 'Deletes brands.'),

  map('GET', '/api/customers', ['SuperAdmin', 'Admin', 'Operator'], '/admin/customers and /cart', 'ResourcePageComponent/CartComponent', 'Customers', 'Staff list customers and checkout selector.'),
  map('GET', '/api/customers/{id}', ['SuperAdmin', 'Admin', 'Operator'], '/admin/customers', 'ResourcePageComponent', 'Customers', 'Customer detail is loaded through row editing.'),
  map('POST', '/api/customers', ['SuperAdmin', 'Admin', 'Operator'], '/admin/customers', 'ResourcePageComponent', 'Customers', 'Creates walk-in or registered customer profiles.'),
  map('PUT', '/api/customers/{id}', ['SuperAdmin', 'Admin', 'Operator'], '/admin/customers', 'ResourcePageComponent', 'Customers', 'Updates customer profile and addresses.'),

  map('GET', '/api/suppliers', ['SuperAdmin', 'Admin', 'Operator'], '/admin/suppliers and /purchasing', 'ResourcePageComponent/PurchasingComponent', 'Suppliers', 'Supplier master and PO selector.'),
  map('GET', '/api/suppliers/{id}', ['SuperAdmin', 'Admin', 'Operator'], '/admin/suppliers', 'ResourcePageComponent', 'Suppliers', 'Supplier detail is available through edit flow.'),
  map('POST', '/api/suppliers', ['SuperAdmin', 'Admin'], '/admin/suppliers', 'ResourcePageComponent', 'Suppliers', 'Creates suppliers.'),
  map('PUT', '/api/suppliers/{id}', ['SuperAdmin', 'Admin'], '/admin/suppliers', 'ResourcePageComponent', 'Suppliers', 'Updates suppliers.'),
  map('DELETE', '/api/suppliers/{id}', ['SuperAdmin', 'Admin'], '/admin/suppliers', 'ResourcePageComponent', 'Suppliers', 'Deletes suppliers.'),

  map('GET', '/api/orders', ['SuperAdmin', 'Admin', 'Operator'], '/sales', 'SalesComponent', 'Sales', 'Staff order history with search and status controls.'),
  map('POST', '/api/orders', ['SuperAdmin', 'Admin', 'Operator', 'Customer'], '/cart', 'CartComponent', 'Sales', 'Creates staff counter sales or customer checkout orders.'),
  map('PUT', '/api/orders/{id}/status', ['SuperAdmin', 'Admin', 'Operator'], '/sales', 'SalesComponent', 'Sales', 'Updates fulfillment status.'),
  map('GET', '/api/payments', ['SuperAdmin', 'Admin', 'Operator'], '/sales', 'SalesComponent', 'Payments', 'Recent payments table.'),
  map('POST', '/api/payments', ['SuperAdmin', 'Admin', 'Operator'], '/sales', 'SalesComponent', 'Payments', 'Captures payments and triggers invoice creation.'),
  map('GET', '/api/billing', ['SuperAdmin', 'Admin', 'Operator'], '/billing', 'BillingComponent', 'Billing', 'List bills and balances.'),
  map('GET', '/api/billing/{id}', ['SuperAdmin', 'Admin', 'Operator'], '/billing', 'BillingComponent', 'Billing', 'Gets bill by id.'),
  map('POST', '/api/billing', ['SuperAdmin', 'Admin', 'Operator'], '/billing', 'BillingComponent', 'Billing', 'Creates a bill for an order.'),
  map('PUT', '/api/billing/{id}', ['SuperAdmin', 'Admin', 'Operator'], '/billing', 'BillingComponent', 'Billing', 'Updates bill details.'),
  map('POST', '/api/billing/{id}/pay', ['SuperAdmin', 'Admin', 'Operator'], '/billing', 'BillingComponent', 'Billing', 'Marks a bill as paid.'),
  map('GET', '/api/invoices/{orderId}', ['SuperAdmin', 'Admin', 'Operator', 'Customer'], '/sales and /customer-orders', 'SalesComponent/CustomerOrdersComponent', 'Invoices', 'Invoice lookup by order id.'),
  map('GET', '/api/returns', ['SuperAdmin', 'Admin', 'Operator'], '/sales', 'SalesComponent', 'Returns', 'Staff return queue.'),
  map('POST', '/api/returns', ['SuperAdmin', 'Admin', 'Operator', 'Customer'], '/sales and /customer-orders', 'SalesComponent/CustomerOrdersComponent', 'Returns', 'Creates a return request.'),
  map('PUT', '/api/returns/{id}/status', ['SuperAdmin', 'Admin', 'Operator'], '/sales', 'SalesComponent', 'Returns', 'Updates return approval/completion status.'),

  map('GET', '/api/inventory/stocks', ['SuperAdmin', 'Admin', 'Operator'], '/inventory', 'InventoryComponent', 'Inventory', 'Stock on hand table with low-stock badges.'),
  map('GET', '/api/inventory/transactions', ['SuperAdmin', 'Admin', 'Operator'], '/inventory', 'InventoryComponent', 'Inventory', 'Recent stock movements.'),
  map('POST', '/api/inventory/receive', ['SuperAdmin', 'Admin', 'Operator'], '/inventory', 'InventoryComponent', 'Inventory', 'Receives stock outside purchase order flow.'),
  map('POST', '/api/inventory/adjustment', ['SuperAdmin', 'Admin', 'Operator'], '/inventory', 'InventoryComponent', 'Inventory', 'Manual positive or negative stock adjustments.'),

  map('GET', '/api/purchaseorders', ['SuperAdmin', 'Admin', 'Operator'], '/purchasing', 'PurchasingComponent', 'Purchasing', 'Purchase order list.'),
  map('GET', '/api/purchaseorders/{id}', ['SuperAdmin', 'Admin', 'Operator'], '/purchasing', 'PurchasingComponent', 'Purchasing', 'Loads full PO lines for receive flow.'),
  map('POST', '/api/purchaseorders', ['SuperAdmin', 'Admin'], '/purchasing', 'PurchasingComponent', 'Purchasing', 'Creates supplier purchase orders.'),
  map('POST', '/api/purchaseorders/{id}/receive', ['SuperAdmin', 'Admin', 'Operator'], '/purchasing', 'PurchasingComponent', 'Purchasing', 'Receives full or partial PO quantities.'),
  map('POST', '/api/purchaseorders/{id}/cancel', ['SuperAdmin', 'Admin'], '/purchasing', 'PurchasingComponent', 'Purchasing', 'Cancels non-received purchase orders.'),

  map('GET', '/api/repairs', ['SuperAdmin', 'Admin', 'Operator'], '/repairs', 'RepairsComponent', 'Repairs', 'Repair ticket worklist.'),
  map('GET', '/api/repairs/{id}', ['SuperAdmin', 'Admin', 'Operator'], '/repairs', 'RepairsComponent', 'Repairs', 'Loads ticket details into edit form.'),
  map('POST', '/api/repairs', ['SuperAdmin', 'Admin', 'Operator'], '/repairs', 'RepairsComponent', 'Repairs', 'Creates repair intake tickets.'),
  map('PUT', '/api/repairs/{id}', ['SuperAdmin', 'Admin', 'Operator'], '/repairs', 'RepairsComponent', 'Repairs', 'Updates repair ticket details.'),
  map('PUT', '/api/repairs/{id}/status', ['SuperAdmin', 'Admin', 'Operator'], '/repairs', 'RepairsComponent', 'Repairs', 'Updates repair progress and final amount.'),
  map('DELETE', '/api/repairs/{id}', ['SuperAdmin', 'Admin'], '/repairs', 'RepairsComponent', 'Repairs', 'Deletes repair tickets.'),

  map('GET', '/api/expenses', ['SuperAdmin', 'Admin', 'Operator'], '/admin/expenses', 'ResourcePageComponent', 'Expenses', 'Expense list with optional date filters in API.'),
  map('GET', '/api/expenses/{id}', ['SuperAdmin', 'Admin', 'Operator'], '/admin/expenses', 'ResourcePageComponent', 'Expenses', 'Expense detail through edit flow.'),
  map('POST', '/api/expenses', ['SuperAdmin', 'Admin', 'Operator'], '/admin/expenses', 'ResourcePageComponent', 'Expenses', 'Creates expense records.'),
  map('PUT', '/api/expenses/{id}', ['SuperAdmin', 'Admin', 'Operator'], '/admin/expenses', 'ResourcePageComponent', 'Expenses', 'Updates expense records.'),
  map('DELETE', '/api/expenses/{id}', ['SuperAdmin', 'Admin'], '/admin/expenses', 'ResourcePageComponent', 'Expenses', 'Deletes expense records.'),

  map('GET', '/api/taxes', ['SuperAdmin', 'Admin'], '/admin/taxes', 'ResourcePageComponent', 'Pricing', 'Tax rule list.'),
  map('POST', '/api/taxes', ['SuperAdmin', 'Admin'], '/admin/taxes', 'ResourcePageComponent', 'Pricing', 'Creates tax rules.'),
  map('PUT', '/api/taxes/{id}', ['SuperAdmin', 'Admin'], '/admin/taxes', 'ResourcePageComponent', 'Pricing', 'Updates tax rules.'),
  map('DELETE', '/api/taxes/{id}', ['SuperAdmin', 'Admin'], '/admin/taxes', 'ResourcePageComponent', 'Pricing', 'Deletes tax rules.'),
  map('GET', '/api/promocodes', ['SuperAdmin', 'Admin'], '/admin/promocodes', 'ResourcePageComponent', 'Pricing', 'Promo code list.'),
  map('POST', '/api/promocodes', ['SuperAdmin', 'Admin'], '/admin/promocodes', 'ResourcePageComponent', 'Pricing', 'Creates promo codes for checkout.'),
  map('PUT', '/api/promocodes/{id}', ['SuperAdmin', 'Admin'], '/admin/promocodes', 'ResourcePageComponent', 'Pricing', 'Updates promo codes.'),
  map('DELETE', '/api/promocodes/{id}', ['SuperAdmin', 'Admin'], '/admin/promocodes', 'ResourcePageComponent', 'Pricing', 'Deletes promo codes.'),

  map('GET', '/api/reports/dashboard-summary', ['SuperAdmin', 'Admin', 'Operator'], '/dashboard and /reports', 'DashboardComponent/ReportsComponent', 'Reports', 'Summary cards.'),
  map('GET', '/api/reports/sales-by-date', ['SuperAdmin', 'Admin', 'Operator'], '/reports', 'ReportsComponent', 'Reports', 'Date-filtered sales table.'),
  map('GET', '/api/reports/sales-by-brand', ['SuperAdmin', 'Admin', 'Operator'], '/reports', 'ReportsComponent', 'Reports', 'Brand sales table.'),
  map('GET', '/api/reports/sales-by-category', ['SuperAdmin', 'Admin', 'Operator'], '/reports', 'ReportsComponent', 'Reports', 'Category sales table.'),
  map('GET', '/api/reports/low-stock', ['SuperAdmin', 'Admin', 'Operator'], '/dashboard and /reports', 'DashboardComponent/ReportsComponent', 'Reports', 'Low-stock report.'),
  map('GET', '/api/reports/tax-report', ['SuperAdmin', 'Admin', 'Operator'], '/reports', 'ReportsComponent', 'Reports', 'Tax collected metric.'),
  map('GET', '/api/reports/expenses-by-category', ['SuperAdmin', 'Admin', 'Operator'], '/reports', 'ReportsComponent', 'Reports', 'Expense summary table.'),
  map('GET', '/api/reports/daily-cash-summary', ['SuperAdmin', 'Admin', 'Operator'], '/reports', 'ReportsComponent', 'Reports', 'Daily cash and payment mix.'),
  map('GET', '/api/reports/profit-loss', ['SuperAdmin', 'Admin', 'Operator'], '/reports', 'ReportsComponent', 'Reports', 'Profit/loss statement panel.'),

  map('GET', '/api/users', ['SuperAdmin', 'Admin'], '/admin/users', 'ResourcePageComponent', 'Users', 'User administration list.'),
  map('POST', '/api/users', ['SuperAdmin', 'Admin'], '/admin/users', 'ResourcePageComponent', 'Users', 'Creates staff/admin users.'),
  map('PUT', '/api/users/{id}', ['SuperAdmin', 'Admin'], '/admin/users', 'ResourcePageComponent', 'Users', 'Updates user role and active state.'),
  map('DELETE', '/api/users/{id}', ['SuperAdmin', 'Admin'], '/admin/users', 'ResourcePageComponent', 'Users', 'Deletes users.'),

  map('GET', '/api/wishlist', ['Customer'], '/wishlist', 'WishlistComponent', 'Wishlist', 'Loads current customer wishlist items.'),
  map('GET', '/api/wishlist/summary', ['Customer'], '/wishlist', 'WishlistComponent', 'Wishlist', 'Loads wishlist summary totals and price-drop metrics.'),
  map('DELETE', '/api/wishlist/{id}', ['Customer'], '/wishlist', 'WishlistComponent', 'Wishlist', 'Removes a wishlist item.'),
  map('DELETE', '/api/wishlist/clear', ['Customer'], '/wishlist', 'WishlistComponent', 'Wishlist', 'Clears the customer wishlist.'),

  map('GET', '/api/notifications', ['SuperAdmin', 'Admin', 'Operator', 'Customer'], '/notifications', 'NotificationsComponent', 'Notifications', 'Fetches notifications for the current user.'),
  map('GET', '/api/notifications/summary', ['SuperAdmin', 'Admin', 'Operator', 'Customer'], '/notifications', 'NotificationsComponent', 'Notifications', 'Loads notification counts and unread summary.'),
  map('POST', '/api/notifications/{id}/mark-read', ['SuperAdmin', 'Admin', 'Operator', 'Customer'], '/notifications', 'NotificationsComponent', 'Notifications', 'Marks a notification as read.'),
  map('POST', '/api/notifications/mark-all-read', ['SuperAdmin', 'Admin', 'Operator', 'Customer'], '/notifications', 'NotificationsComponent', 'Notifications', 'Marks all notifications as read.'),
  map('DELETE', '/api/notifications/{id}', ['SuperAdmin', 'Admin', 'Operator', 'Customer'], '/notifications', 'NotificationsComponent', 'Notifications', 'Deletes a notification.'),

  map('GET', '/api/loyalty/account', ['Customer'], '/loyalty', 'LoyaltyComponent', 'Loyalty', 'Loads the current customer loyalty account.'),
  map('GET', '/api/loyalty/tier-progress', ['Customer'], '/loyalty', 'LoyaltyComponent', 'Loyalty', 'Loads loyalty tier progress metrics.'),
  map('POST', '/api/loyalty/redeem-points', ['Customer'], '/loyalty', 'LoyaltyComponent', 'Loyalty', 'Redeems loyalty points for discounts.'),

  map('GET', '/api/settings', ['SuperAdmin', 'Admin'], '/admin/settings', 'ResourcePageComponent', 'Settings', 'Application setting list.'),
  map('POST', '/api/settings', ['SuperAdmin', 'Admin'], '/admin/settings', 'ResourcePageComponent', 'Settings', 'Creates settings.'),
  map('PUT', '/api/settings/{id}', ['SuperAdmin', 'Admin'], '/admin/settings', 'ResourcePageComponent', 'Settings', 'Updates settings.'),
  map('DELETE', '/api/settings/{id}', ['SuperAdmin', 'Admin'], '/admin/settings', 'ResourcePageComponent', 'Settings', 'Deletes settings.'),
  map('GET', '/api/auditlogs', ['SuperAdmin', 'Admin'], '/admin/audit-logs', 'ResourcePageComponent', 'Audit', 'Read-only audit trail.'),

  map('GET', '/WeatherForecast', ['Anonymous'], '/diagnostics', 'DiagnosticsComponent', 'Diagnostics', 'Scaffold endpoint exposed by the API and kept out of business navigation.')
];

function map(
  method: EndpointMapping['method'],
  path: string,
  roles: EndpointMapping['roles'],
  route: string,
  component: string,
  feature: string,
  notes: string
): EndpointMapping {
  return { method, path, roles, route, component, feature, notes };
}
