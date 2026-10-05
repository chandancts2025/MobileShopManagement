import { Component, computed, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

import { RoleName } from '../core/api.models';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { ApiService } from '../core/api.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: RoleName[];
  badge?: () => number | string | null;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell" [class.mobile-menu-active]="mobileMenuOpen()">
      <!-- Mobile Backdrop -->
      @if (mobileMenuOpen()) {
        <div class="drawer-backdrop" (click)="closeMobileMenu()"></div>
      }

      <!-- Sidebar / Mobile Off-Canvas Drawer -->
      <aside class="sidebar" [class.open]="mobileMenuOpen()">
        <div style="display: flex; justify-content: space-between; align-items: center; padding-right: 8px;">
          <a class="brand" routerLink="/catalog" (click)="closeMobileMenu()">
            <span class="brand-mark">📱</span>
            <span>
              <h1>MobileShop</h1>
              <p>Retail & Repair ERP</p>
            </span>
          </a>
          <button class="btn ghost mobile-close-btn" (click)="closeMobileMenu()" title="Close menu">✕</button>
        </div>

        @for (group of visibleGroups(); track group.title) {
          <nav class="nav-section" [attr.aria-label]="group.title">
            <div class="nav-section-title">{{ group.title }}</div>
            @for (item of group.items; track item.route) {
              <a class="nav-link" [routerLink]="item.route" routerLinkActive="active" (click)="closeMobileMenu()">
                <span class="nav-icon">{{ item.icon }}</span>
                <span style="flex: 1;">{{ item.label }}</span>
                @if (item.badge && item.badge()) {
                  <span class="badge primary" style="font-size: 0.72rem; padding: 2px 6px;">{{ item.badge!() }}</span>
                }
              </a>
            }
          </nav>
        }

        <!-- User profile in sidebar -->
        @if (auth.session(); as session) {
          <div class="user-card" style="margin-top: 24px; border-radius: 10px; background: var(--surface-2); padding: 14px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: white; display: grid; place-items: center; font-weight: 700;">
                {{ (session.fullName || session.email).charAt(0).toUpperCase() }}
              </div>
              <div style="flex: 1; min-width: 0;">
                <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.9rem;">
                  {{ session.fullName || session.email }}
                </strong>
                <span class="badge" style="font-size: 0.72rem; padding: 1px 6px;">{{ session.roleName }}</span>
              </div>
            </div>
            <button class="btn danger ghost" type="button" (click)="logout()" style="width: 100%; font-size: 0.85rem; padding: 6px;">
              Sign out
            </button>
          </div>
        } @else {
          <div class="user-card" style="margin-top: 24px; padding: 12px; background: var(--surface-2); border-radius: 10px; text-align: center;">
            <p class="muted" style="margin: 0 0 10px; font-size: 0.85rem;">Welcome to MobileShop!</p>
            <div style="display: grid; gap: 6px;">
              <a class="btn primary" routerLink="/login" (click)="closeMobileMenu()" style="padding: 6px;">Sign In</a>
              <a class="btn ghost" routerLink="/register" (click)="closeMobileMenu()" style="padding: 6px;">Register</a>
            </div>
          </div>
        }
      </aside>

      <!-- Main Content Area -->
      <main class="main">
        <!-- Topbar -->
        <header class="topbar">
          <div style="display: flex; align-items: center; gap: 12px;">
            <button class="mobile-toggle-btn" (click)="toggleMobileMenu()" title="Open Navigation Menu">
              ☰
            </button>
            <div class="topbar-branding">
              <strong>{{ auth.session()?.roleName || 'Shopper' }} Portal</strong>
              <p class="muted" style="margin: 2px 0 0; font-size: 0.75rem;">Fast, secure retail & device service</p>
            </div>
          </div>

          <div class="topbar-actions">
            <!-- Repair Tracking Quick Link -->
            <a class="btn ghost topbar-link" routerLink="/repair-tracking" title="Track phone repair">
              <span>🔧</span>
              <span class="topbar-text">Track Repair</span>
            </a>

            <!-- Notifications Icon with Badge -->
            <a class="btn ghost topbar-link" routerLink="/notifications" title="Notifications" style="position: relative;">
              <span>🔔</span>
              @if (unreadCount() > 0) {
                <span class="notification-dot">{{ unreadCount() }}</span>
              }
            </a>

            <!-- Wishlist Button (Customer) -->
            @if (auth.hasAnyRole(['Customer'])) {
              <a class="btn ghost topbar-link" routerLink="/wishlist" title="Wishlist">
                <span>❤️</span>
                <span class="topbar-text">Wishlist</span>
              </a>
            }

            <!-- Cart Button -->
            <a class="btn ghost" routerLink="/cart" style="display: flex; align-items: center; gap: 6px;">
              <span>🛒</span>
              <strong>Cart ({{ cart.count() }})</strong>
            </a>

            <!-- Auth Buttons -->
            @if (!auth.isAuthenticated()) {
              <a class="btn" routerLink="/login">Sign in</a>
              <a class="btn primary" routerLink="/register">Register</a>
            } @else {
              <button class="btn ghost desktop-only" (click)="logout()" title="Sign out" style="padding: 6px 12px;">
                Logout
              </button>
            }
          </div>
        </header>

        <!-- Router Content -->
        <section class="content">
          <router-outlet />
        </section>
      </main>

      <!-- Mobile Bottom Navigation Bar (Phones only) -->
      <nav class="mobile-bottom-nav">
        <a class="bottom-nav-item" routerLink="/catalog" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
          <span class="bottom-nav-icon">📱</span>
          <span>Catalog</span>
        </a>
        <a class="bottom-nav-item" routerLink="/cart" routerLinkActive="active">
          <span class="bottom-nav-icon">
            🛒
            @if (cart.count() > 0) {
              <span class="bottom-nav-badge">{{ cart.count() }}</span>
            }
          </span>
          <span>Cart</span>
        </a>
        <a class="bottom-nav-item" routerLink="/repair-tracking" routerLinkActive="active">
          <span class="bottom-nav-icon">🔧</span>
          <span>Repairs</span>
        </a>
        @if (auth.hasAnyRole(['Customer'])) {
          <a class="bottom-nav-item" routerLink="/customer-orders" routerLinkActive="active">
            <span class="bottom-nav-icon">📦</span>
            <span>Orders</span>
          </a>
        } @else if (auth.hasAtLeastStaffRole()) {
          <a class="bottom-nav-item" routerLink="/dashboard" routerLinkActive="active">
            <span class="bottom-nav-icon">📊</span>
            <span>Dashboard</span>
          </a>
        } @else {
          <a class="bottom-nav-item" routerLink="/wishlist" routerLinkActive="active">
            <span class="bottom-nav-icon">❤️</span>
            <span>Wishlist</span>
          </a>
        }
        <button class="bottom-nav-item" (click)="toggleMobileMenu()" style="background: none; border: none; font: inherit;">
          <span class="bottom-nav-icon">☰</span>
          <span>Menu</span>
        </button>
      </nav>
    </div>
  `,
  styles: [`
    .mobile-toggle-btn {
      display: none;
      background: var(--surface-2);
      border: 1px solid var(--line);
      border-radius: 8px;
      font-size: 1.25rem;
      padding: 6px 12px;
      cursor: pointer;
      color: var(--text);
    }
    .mobile-close-btn {
      display: none;
    }
    .notification-dot {
      position: absolute;
      top: 2px;
      right: 4px;
      background: var(--danger);
      color: white;
      font-size: 0.65rem;
      font-weight: 800;
      border-radius: 10px;
      padding: 1px 5px;
      line-height: 1.2;
    }
    .nav-icon {
      font-size: 1.15rem;
      width: 24px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .mobile-bottom-nav {
      display: none;
    }
    .drawer-backdrop {
      display: none;
    }

    @media (max-width: 1024px) {
      .mobile-toggle-btn {
        display: block;
      }
      .mobile-close-btn {
        display: block;
      }
      .sidebar {
        position: fixed !important;
        top: 0;
        left: -300px;
        bottom: 0;
        width: 280px;
        height: 100vh !important;
        background: white;
        z-index: 1000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.25);
        transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: block !important;
      }
      .sidebar.open {
        left: 0;
      }
      .drawer-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(2px);
        z-index: 999;
      }
    }

    @media (max-width: 760px) {
      .topbar-text, .desktop-only {
        display: none !important;
      }
      .content {
        padding-bottom: 74px !important;
      }
      .mobile-bottom-nav {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 58px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(12px);
        border-top: 1px solid var(--line);
        z-index: 900;
        justify-content: space-around;
        align-items: center;
      }
      .bottom-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-decoration: none;
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 600;
        padding: 4px 10px;
        cursor: pointer;
        position: relative;
      }
      .bottom-nav-item.active {
        color: var(--primary);
      }
      .bottom-nav-icon {
        font-size: 1.25rem;
        position: relative;
        line-height: 1.2;
      }
      .bottom-nav-badge {
        position: absolute;
        top: -4px;
        right: -8px;
        background: var(--primary);
        color: white;
        font-size: 0.65rem;
        border-radius: 10px;
        padding: 1px 4px;
      }
    }
  `]
})
export class ShellComponent implements OnInit {
  readonly mobileMenuOpen = signal(false);
  readonly unreadCount = signal(0);

  private readonly groups: NavGroup[] = [
    {
      title: 'Storefront',
      items: [
        { label: 'Product catalog', route: '/catalog', icon: '📱' },
        { label: 'Cart and checkout', route: '/cart', icon: '🛒' },
        { label: 'Wishlist', route: '/wishlist', icon: '❤️', roles: ['Customer'] },
        { label: 'Order tracking', route: '/order-tracking', icon: '🚚', roles: ['Customer'] },
        { label: 'Repair service tracker', route: '/repair-tracking', icon: '🔧' },
        { label: 'Loyalty rewards', route: '/loyalty', icon: '⭐', roles: ['Customer'] },
        { label: 'Customer orders', route: '/customer-orders', icon: '📦', roles: ['Customer'] },
        { label: 'Notifications', route: '/notifications', icon: '🔔', roles: ['SuperAdmin', 'Admin', 'Operator', 'Customer'] }
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Executive dashboard', route: '/dashboard', icon: '📊', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Sales and orders', route: '/sales', icon: '💳', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Billing & Invoices', route: '/billing', icon: '🧾', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Inventory control', route: '/inventory', icon: '📦', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Purchasing & POs', route: '/purchasing', icon: '📥', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Device repairs', route: '/repairs', icon: '🛠️', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Financial reports', route: '/reports', icon: '📈', roles: ['SuperAdmin', 'Admin', 'Operator'] }
      ]
    },
    {
      title: 'Management',
      items: [
        { label: 'Review moderation', route: '/admin/reviews', icon: '⭐', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Products master', route: '/admin/products', icon: '📱', roles: ['SuperAdmin', 'Admin'] },
        { label: 'Categories', route: '/admin/categories', icon: '📂', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Brands', route: '/admin/brands', icon: '🏷️', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Customers', route: '/admin/customers', icon: '👥', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Suppliers', route: '/admin/suppliers', icon: '🏭', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Expenses', route: '/admin/expenses', icon: '💸', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Pricing & Taxes', route: '/admin/taxes', icon: '⚖️', roles: ['SuperAdmin', 'Admin'] },
        { label: 'Promo codes', route: '/admin/promocodes', icon: '🎟️', roles: ['SuperAdmin', 'Admin'] },
        { label: 'Users & Staff', route: '/admin/users', icon: '👤', roles: ['SuperAdmin', 'Admin'] },
        { label: 'Settings', route: '/admin/settings', icon: '⚙️', roles: ['SuperAdmin', 'Admin'] },
        { label: 'Audit logs', route: '/admin/audit-logs', icon: '📜', roles: ['SuperAdmin', 'Admin'] }
      ]
    },
    {
      title: 'Reference & System',
      items: [
        { label: 'Endpoint map', route: '/endpoint-map', icon: '🗺️', roles: ['SuperAdmin', 'Admin', 'Operator'] },
        { label: 'Diagnostics', route: '/diagnostics', icon: '🔬', roles: ['SuperAdmin', 'Admin'] }
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
    private readonly api: ApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.closeMobileMenu();
    });

    if (this.auth.isAuthenticated()) {
      this.loadNotificationCount();
    }
  }

  loadNotificationCount(): void {
    this.api.get<{ totalUnread: number }>('/api/notifications/summary').subscribe({
      next: (summary) => this.unreadCount.set(summary.totalUnread || 0),
      error: () => {}
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
    void this.router.navigateByUrl('/catalog');
  }
}
