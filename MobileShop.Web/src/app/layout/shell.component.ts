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
          <a class="brand" routerLink="/home" (click)="closeMobileMenu()">
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
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <button class="mobile-toggle-btn" (click)="toggleMobileMenu()" title="Open Navigation Menu">
              ☰
            </button>
            <div class="topbar-branding">
              <strong>{{ auth.session()?.roleName || 'Shopper' }} Portal</strong>
              <p class="muted" style="margin: 2px 0 0; font-size: 0.75rem;">Fast, secure retail & device service</p>
            </div>
            <!-- Owner Contact Badge in Topbar -->
            <a class="owner-header-badge desktop-only" href="tel:+919851632391" title="Call Owner Chandan Kr Mandal">
              <span class="owner-badge-dot"></span>
              <span>Prop: <strong>Chandan Kr Mandal</strong> • 📞 +91 9851632391</span>
            </a>
          </div>

          <div class="topbar-actions">
            <!-- Storefront Quick Links -->
            <a class="btn ghost topbar-link desktop-only" routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" title="Home">
              <span>🏠</span>
              <span class="topbar-text">Home</span>
            </a>
            <a class="btn ghost topbar-link desktop-only" routerLink="/about" routerLinkActive="active" title="About Us & Founder">
              <span>ℹ️</span>
              <span class="topbar-text">About</span>
            </a>
            <a class="btn ghost topbar-link desktop-only" routerLink="/contact" routerLinkActive="active" title="Contact Store & Owner">
              <span>📞</span>
              <span class="topbar-text">Contact</span>
            </a>

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

        <!-- Global Storefront Footer with Owner Details -->
        <footer class="global-footer">
          <div class="footer-inner">
            <div class="footer-grid">
              <div class="footer-col brand-col">
                <div class="footer-brand">
                  <span class="f-mark">📱</span>
                  <div>
                    <h4>Mobile Shop Management</h4>
                    <span class="f-sub">Retail & Express Repair Hub</span>
                  </div>
                </div>
                <p class="f-desc">
                  Kolkata's trusted destination for genuine Apple, Samsung, OnePlus & Google Pixel smartphones. 100% brand-sealed units, official GST invoices, transparent diagnostics, and 30-min express repairs.
                </p>
                <div class="owner-card-mini">
                  <span class="crown-icon">👑</span>
                  <div>
                    <span class="owner-label">Managing Proprietor</span>
                    <strong class="owner-name-txt">Chandan Kr Mandal</strong>
                  </div>
                </div>
              </div>

              <div class="footer-col">
                <h5>Store Navigation</h5>
                <ul class="f-links">
                  <li><a routerLink="/home">🏠 Home Page</a></li>
                  <li><a routerLink="/catalog">📱 Smartphone Catalog</a></li>
                  <li><a routerLink="/about">ℹ️ About Us & Founder</a></li>
                  <li><a routerLink="/contact">📞 Contact & Directions</a></li>
                  <li><a routerLink="/repair-tracking">🔧 Repair Status Tracker</a></li>
                  <li><a routerLink="/cart">🛒 Shopping Cart</a></li>
                </ul>
              </div>

              <div class="footer-col">
                <h5>Store Hours & Compliance</h5>
                <div class="f-timings-box">
                  <p><strong>Monday – Saturday:</strong><br />09:30 AM – 09:30 PM</p>
                  <p><strong>Sunday:</strong><br />10:00 AM – 08:00 PM</p>
                  <span class="badge good" style="font-size: 0.72rem; display: inline-block; margin-top: 4px;">✓ Open All 7 Days</span>
                </div>
                <div class="f-compliance">
                  <p><strong>GSTIN:</strong> 19AABCX1234F1Z8</p>
                  <p><strong>UPI:</strong> chandankr.mandal87&#64;okaxis</p>
                </div>
              </div>

              <div class="footer-col contact-col">
                <h5>Direct Contact & Location</h5>
                <p class="f-addr">
                  📍 <strong>Store Address:</strong><br />
                  3B8-2D, Sanhita Township, Newtown, Kolkata 700135, West Bengal, India.
                </p>
                <div class="f-contact-buttons">
                  <a href="tel:+919851632391" class="f-btn call">
                    <span>📞</span> +91 9851632391
                  </a>
                  <a href="https://wa.me/919851632391" target="_blank" rel="noopener" class="f-btn wa">
                    <span>💬</span> WhatsApp Direct
                  </a>
                  <a href="mailto:chandankr.mandal87@gmail.com" class="f-btn mail">
                    <span>✉️</span> chandankr.mandal87&#64;gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div class="footer-bottom">
              <div>
                © 2026 Mobile Shop Management. All rights reserved. • Proprietor: <strong>Chandan Kr Mandal</strong>
              </div>
              <div class="f-bottom-links">
                <a routerLink="/home">Home</a>
                <span>•</span>
                <a routerLink="/catalog">Catalog</a>
                <span>•</span>
                <a routerLink="/about">About Us</a>
                <span>•</span>
                <a routerLink="/contact">Contact</a>
                <span>•</span>
                <a routerLink="/repair-tracking">Repair Tracker</a>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <!-- Mobile Bottom Navigation Bar (Phones only) -->
      <nav class="mobile-bottom-nav">
        <a class="bottom-nav-item" routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
          <span class="bottom-nav-icon">🏠</span>
          <span>Home</span>
        </a>
        <a class="bottom-nav-item" routerLink="/catalog" routerLinkActive="active">
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
        <a class="bottom-nav-item" routerLink="/contact" routerLinkActive="active">
          <span class="bottom-nav-icon">📞</span>
          <span>Contact</span>
        </a>
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

    .owner-header-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      background: var(--surface-2);
      border: 1px solid var(--line);
      border-radius: 999px;
      font-size: 0.8rem;
      color: var(--text);
      text-decoration: none;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .owner-header-badge:hover {
      border-color: var(--primary);
      color: var(--primary);
      background: rgba(13, 122, 95, 0.05);
    }
    .owner-badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #16a34a;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.25);
    }

    /* Global Storefront Footer */
    .global-footer {
      background: #0f172a;
      color: #cbd5e1;
      padding: 48px 32px 28px;
      border-top: 1px solid #1e293b;
      margin-top: 48px;
    }
    .footer-inner {
      max-width: 1280px;
      margin: 0 auto;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr 1.3fr;
      gap: 36px;
      margin-bottom: 40px;
    }
    .footer-col h5 {
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 800;
      margin: 0 0 16px;
      letter-spacing: 0.02em;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .f-mark {
      font-size: 1.8rem;
    }
    .footer-brand h4 {
      color: #ffffff;
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0;
    }
    .f-sub {
      font-size: 0.75rem;
      color: #6ee7b7;
      font-weight: 700;
      display: block;
    }
    .f-desc {
      font-size: 0.86rem;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 16px;
    }
    .owner-card-mini {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 10px 14px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .crown-icon {
      font-size: 1.3rem;
    }
    .owner-label {
      display: block;
      font-size: 0.7rem;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
    }
    .owner-name-txt {
      font-size: 0.92rem;
      color: #ffffff;
      font-weight: 800;
    }
    .f-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .f-links a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.88rem;
      transition: color 0.15s ease;
    }
    .f-links a:hover {
      color: #38bdf8;
    }
    .f-timings-box {
      font-size: 0.86rem;
      line-height: 1.5;
      color: #cbd5e1;
    }
    .f-timings-box p {
      margin: 0 0 8px;
    }
    .f-compliance {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .f-compliance p {
      margin: 2px 0;
    }
    .f-addr {
      font-size: 0.86rem;
      line-height: 1.5;
      color: #cbd5e1;
      margin: 0 0 16px;
    }
    .f-contact-buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .f-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.14);
      transition: all 0.15s ease;
    }
    .f-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: #38bdf8;
      color: #38bdf8;
    }
    .f-btn.wa:hover {
      color: #4ade80;
      border-color: #4ade80;
    }
    .footer-bottom {
      border-top: 1px solid #1e293b;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 0.82rem;
      color: #64748b;
    }
    .footer-bottom strong {
      color: #e2e8f0;
    }
    .f-bottom-links {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .f-bottom-links a {
      color: #94a3b8;
      text-decoration: none;
    }
    .f-bottom-links a:hover {
      color: #ffffff;
    }
    @media (max-width: 960px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 600px) {
      .footer-grid {
        grid-template-columns: 1fr;
      }
      .global-footer {
        padding: 32px 18px 84px;
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
        { label: 'Home', route: '/home', icon: '🏠' },
        { label: 'Product catalog', route: '/catalog', icon: '📱' },
        { label: 'About Us & Founder', route: '/about', icon: 'ℹ️' },
        { label: 'Contact Us & Store', route: '/contact', icon: '📞' },
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
