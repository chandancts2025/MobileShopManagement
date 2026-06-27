import { Component, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { RoleName } from '../core/api.models';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';

interface NavItem {
  label: string;
  route: string;
  roles?: RoleName[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/catalog">
          <span class="brand-mark">MS</span>
          <span>
            <h1>Mobile Shop</h1>
            <p>Retail operations</p>
          </span>
        </a>

        @for (group of visibleGroups(); track group.title) {
          <nav class="nav-section" [attr.aria-label]="group.title">
            <div class="nav-section-title">{{ group.title }}</div>
            @for (item of group.items; track item.route) {
              <a class="nav-link" [routerLink]="item.route" routerLinkActive="active">
                <span class="nav-dot"></span>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        }

        @if (auth.session(); as session) {
          <div class="user-card">
            <strong>{{ session.fullName || session.email }}</strong>
            <p>{{ session.email }}</p>
            <p>{{ session.roleName }}</p>
            <button class="btn ghost" type="button" (click)="logout()">Sign out</button>
          </div>
        }
      </aside>

      <main class="main">
        <header class="topbar">
          <div>
            <strong>{{ auth.session()?.roleName || 'Guest' }} view</strong>
            <p class="muted" style="margin: 2px 0 0;">API: http://localhost:5266</p>
          </div>
          <div class="topbar-actions">
            <a class="btn ghost" routerLink="/cart">Cart ({{ cart.count() }})</a>
            @if (!auth.isAuthenticated()) {
              <a class="btn" routerLink="/login">Sign in</a>
              <a class="btn primary" routerLink="/register">Create account</a>
            }
          </div>
        </header>

        <section class="content">
          <router-outlet />
        </section>
      </main>
    </div>
  `
})
export class ShellComponent {
  private readonly groups: NavGroup[] = [
    {
      title: 'Storefront',
      items: [
        { label: 'Product catalog', route: '/catalog' },
        { label: 'Cart and checkout', route: '/cart' },
        { label: 'Wishlist', route: '/wishlist', roles: ['Customer'] },
        { label: 'Order tracking', route: '/order-tracking', roles: ['Customer'] },
        { label: 'Loyalty rewards', route: '/loyalty', roles: ['Customer'] },
        { label: 'Customer orders', route: '/customer-orders', roles: ['Customer'] }
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Dashboard', route: '/dashboard', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Sales and orders', route: '/sales', roles: ['SuperAdmin', 'Admin', 'Operator'] },
          { label: 'Billing', route: '/billing', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Inventory', route: '/inventory', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Purchasing', route: '/purchasing', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Repairs', route: '/repairs', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Reports', route: '/reports', roles: ['SuperAdmin', 'Admin', 'Operator'] }
      ]
    },
    {
      title: 'Management',
      items: [
        { label: 'Products', route: '/admin/products', roles: ['SuperAdmin', 'Admin'] },
        { label: 'Categories', route: '/admin/categories', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Brands', route: '/admin/brands', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Customers', route: '/admin/customers', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Suppliers', route: '/admin/suppliers', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Expenses', route: '/admin/expenses', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Pricing', route: '/admin/taxes', roles: ['SuperAdmin', 'Admin'] },
        { label: 'Promos', route: '/admin/promocodes', roles: ['SuperAdmin', 'Admin'] },
        { label: 'Users', route: '/admin/users', roles: ['SuperAdmin', 'Admin'] },
        { label: 'Settings', route: '/admin/settings', roles: ['SuperAdmin', 'Admin'] },
        { label: 'Audit logs', route: '/admin/audit-logs', roles: ['SuperAdmin', 'Admin'] }
      ]
    },
    {
      title: 'Reference',
      items: [
        { label: 'Endpoint map', route: '/endpoint-map', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Diagnostics', route: '/diagnostics', roles: ['SuperAdmin', 'Admin'] }
      ]
    }
  ];

  readonly visibleGroups = computed(() => this.groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => this.auth.hasAnyRole(item.roles))
    }))
    .filter((group) => group.items.length > 0));

  constructor(
    readonly auth: AuthService,
    readonly cart: CartService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/catalog');
  }
}
