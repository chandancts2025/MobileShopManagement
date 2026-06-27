import { Routes } from '@angular/router';

import { ShellComponent } from './layout/shell.component';
import { authGuard, roleGuard } from './core/guards';

const staffRoles = ['SuperAdmin', 'Admin', 'Operator'] as const;
const adminRoles = ['SuperAdmin', 'Admin'] as const;

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: 'billing/:id/print',
    canMatch: [authGuard, roleGuard([...staffRoles, 'Customer'])],
    loadComponent: () => import('./pages/billing-print.component').then((m) => m.BillingPrintComponent)
  },
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'catalog' },
      {
        path: 'catalog',
        loadComponent: () => import('./pages/catalog.component').then((m) => m.CatalogComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/cart.component').then((m) => m.CartComponent)
      },
      {
        path: 'wishlist',
        canMatch: [authGuard, roleGuard(['Customer'])],
        loadComponent: () => import('./pages/wishlist.component').then((m) => m.WishlistComponent)
      },
      {
        path: 'notifications',
        canMatch: [authGuard, roleGuard([...staffRoles, 'Customer'])],
        loadComponent: () => import('./pages/notifications.component').then((m) => m.NotificationsComponent)
      },
      {
        path: 'loyalty',
        canMatch: [authGuard, roleGuard(['Customer'])],
        loadComponent: () => import('./pages/loyalty.component').then((m) => m.LoyaltyComponent)
      },
      {
        path: 'order-tracking',
        canMatch: [authGuard, roleGuard([...staffRoles, 'Customer'])],
        loadComponent: () => import('./pages/order-tracking.component').then((m) => m.OrderTrackingComponent)
      },
      { path: 'orders', redirectTo: 'sales' },
      { path: 'purchase-orders', redirectTo: 'purchasing' },
      {
        path: 'customer-orders',
        canMatch: [authGuard, roleGuard(['Customer'])],
        loadComponent: () => import('./pages/customer-orders.component').then((m) => m.CustomerOrdersComponent)
      },
      {
        path: 'dashboard',
        canMatch: [authGuard, roleGuard([...staffRoles])],
        loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'sales',
        canMatch: [authGuard, roleGuard([...staffRoles])],
        loadComponent: () => import('./pages/sales.component').then((m) => m.SalesComponent)
      },
      {
        path: 'billing',
        canMatch: [authGuard, roleGuard([...staffRoles])],
        loadComponent: () => import('./pages/billing.component').then((m) => m.BillingComponent)
      },
      {
        path: 'inventory',
        canMatch: [authGuard, roleGuard([...staffRoles])],
        loadComponent: () => import('./pages/inventory.component').then((m) => m.InventoryComponent)
      },
      {
        path: 'purchasing',
        canMatch: [authGuard, roleGuard([...staffRoles])],
        loadComponent: () => import('./pages/purchasing.component').then((m) => m.PurchasingComponent)
      },
      {
        path: 'repairs',
        canMatch: [authGuard, roleGuard([...staffRoles])],
        loadComponent: () => import('./pages/repairs.component').then((m) => m.RepairsComponent)
      },
      {
        path: 'reports',
        canMatch: [authGuard, roleGuard([...staffRoles])],
        loadComponent: () => import('./pages/reports.component').then((m) => m.ReportsComponent)
      },
      {
        path: 'admin/:resource',
        canMatch: [authGuard, roleGuard([...staffRoles])],
        loadComponent: () => import('./pages/resource-page.component').then((m) => m.ResourcePageComponent)
      },
      {
        path: 'endpoint-map',
        canMatch: [authGuard, roleGuard([...staffRoles])],
        loadComponent: () => import('./pages/endpoint-map.component').then((m) => m.EndpointMapComponent)
      },
      {
        path: 'diagnostics',
        canMatch: [authGuard, roleGuard([...adminRoles])],
        loadComponent: () => import('./pages/diagnostics.component').then((m) => m.DiagnosticsComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'catalog' }
];
