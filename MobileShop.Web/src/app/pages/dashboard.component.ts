import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { DashboardSummaryDto, StockReportItemDto } from '../core/api.models';
import { money } from '../core/formatters';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-page">
      <!-- Store Identity & Status Banner -->
      <div class="store-banner">
        <div class="banner-left">
          <div class="brand-line">
            <span class="store-icon">📱</span>
            <div>
              <h3 class="store-name">MOBILE SHOP MANAGEMENT</h3>
              <p class="store-sub">3B8-2D, Sanhita Township, Newtown, Kolkata 700135, West Bengal • Prop: Chandan Kr Mandal</p>
            </div>
          </div>
          <div class="meta-pills">
            <span class="pill-item">📞 +91 9851632391</span>
            <span class="pill-item">✉️ chandankr.mandal87&#64;gmail.com</span>
            <span class="pill-item">🏛️ GSTIN: 19AABCX1234F1Z8</span>
          </div>
        </div>

        <div class="banner-right">
          <div class="system-status">
            <span class="status-indicator online"></span>
            <div class="status-texts">
              <span class="status-main">Store Active • POS Ready</span>
              <span class="status-sub">Live Gmail SMTP & Dual A4/80mm Printing</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Page Header & Action Controls -->
      <div class="page-header" style="margin-top: 10px;">
        <div>
          <h2>📊 Executive Management Cockpit</h2>
          <p>Real-time retail revenue, daily cash collections, repair lab workload, and critical stock warnings</p>
        </div>
        <div class="toolbar-right">
          <button class="btn secondary" (click)="load()">↻ Refresh Stats</button>
          <a class="btn primary" routerLink="/reports">Full Business Reports →</a>
        </div>
      </div>

      @if (error) {
        <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
      }

      <!-- Quick Operations Hub (Top Launcher Bar) -->
      <div class="launcher-hub">
        <a routerLink="/billing" class="launcher-card pos-card">
          <div class="launcher-icon">🧾</div>
          <div class="launcher-content">
            <strong>Fast Counter POS & Billing</strong>
            <span>Create A4 tax invoice & 80mm slip</span>
          </div>
          <span class="launcher-arrow">→</span>
        </a>

        <a routerLink="/repairs" class="launcher-card repair-card">
          <div class="launcher-icon">🛠️</div>
          <div class="launcher-content">
            <strong>Intake Phone Repair</strong>
            <span>Print 80mm token & A4 job card</span>
          </div>
          <span class="launcher-arrow">→</span>
        </a>

        <a routerLink="/cart" class="launcher-card cart-card">
          <div class="launcher-icon">🛒</div>
          <div class="launcher-content">
            <strong>New Retail Sale</strong>
            <span>Add handsets & accessories</span>
          </div>
          <span class="launcher-arrow">→</span>
        </a>

        <a routerLink="/inventory" class="launcher-card stock-card">
          <div class="launcher-icon">📦</div>
          <div class="launcher-content">
            <strong>Stock & Catalog</strong>
            <span>Manage handsets, IMEI & parts</span>
          </div>
          <span class="launcher-arrow">→</span>
        </a>
      </div>

      <!-- Financial KPIs (4 Cards) -->
      <section class="grid four" [class.loading]="loading" style="margin-bottom: 20px;">
        <div class="metric kpi-metric blue">
          <span class="kpi-label">Monthly Gross Revenue</span>
          <strong class="kpi-num" style="color: #0284c7;">{{ money(summary?.monthlySales) }}</strong>
          <p class="kpi-sub">Total sales volume this month</p>
        </div>

        <div class="metric kpi-metric green">
          <span class="kpi-label">Today's Total Sales</span>
          <strong class="kpi-num" style="color: #0d7a5f;">{{ money(summary?.todaySales) }}</strong>
          <p class="kpi-sub">Cash, UPI & Card collections</p>
        </div>

        <div class="metric kpi-metric red">
          <span class="kpi-label">Today's Store Expenses</span>
          <strong class="kpi-num" style="color: #dc2626;">{{ money(summary?.todayExpenses) }}</strong>
          <p class="kpi-sub">Parts, utility & operating costs</p>
        </div>

        <div class="metric kpi-metric emerald">
          <span class="kpi-label">Today's Net Profit</span>
          <strong class="kpi-num" style="color: #16a34a;">{{ money(summary?.todayProfit) }}</strong>
          <p class="kpi-sub">Sales - COGS - Expenses</p>
        </div>
      </section>

      <!-- Operational Action Grid (2 Panels) -->
      <section class="grid two" style="margin-bottom: 20px;">
        <!-- Urgent Attention Cards -->
        <div class="panel">
          <div class="panel-header">
            <strong>⚡ Live Store Action Queue</strong>
            <span class="badge warn">Immediate Attention</span>
          </div>
          <div class="panel-body">
            <div style="display: grid; gap: 12px;">
              <a routerLink="/sales" class="action-card">
                <div class="action-left">
                  <span class="action-emoji">📦</span>
                  <div>
                    <strong>Pending Orders to Dispatch</strong>
                    <p class="muted">Orders awaiting counter packing or customer payment</p>
                  </div>
                </div>
                <span class="badge" [class.warn]="(summary?.pendingOrders ?? 0) > 0">
                  {{ summary?.pendingOrders ?? 0 }} Pending
                </span>
              </a>

              <a routerLink="/repairs" class="action-card">
                <div class="action-left">
                  <span class="action-emoji">🔧</span>
                  <div>
                    <strong>Active Handset Repairs in Lab</strong>
                    <p class="muted">Devices currently in technician diagnostics or awaiting parts</p>
                  </div>
                </div>
                <span class="badge primary">
                  {{ summary?.openRepairTickets ?? 0 }} In Repair
                </span>
              </a>

              <a routerLink="/inventory" class="action-card">
                <div class="action-left">
                  <span class="action-emoji">⚠️</span>
                  <div>
                    <strong>Low Stock Handsets & Accessories</strong>
                    <p class="muted">Products at or below shop reorder threshold</p>
                  </div>
                </div>
                <span class="badge bad">
                  {{ summary?.lowStockProducts ?? 0 }} Low Stock
                </span>
              </a>

              <a routerLink="/purchasing" class="action-card">
                <div class="action-left">
                  <span class="action-emoji">📥</span>
                  <div>
                    <strong>Supplier Shipments Expected</strong>
                    <p class="muted">Incoming distributor deliveries pending stock receipt</p>
                  </div>
                </div>
                <span class="badge primary">
                  {{ summary?.pendingPurchaseOrders ?? 0 }} Pending POs
                </span>
              </a>
            </div>
          </div>
        </div>

        <!-- Store Overview & Customer Reach -->
        <div class="panel">
          <div class="panel-header">
            <strong>🏬 Mobile Shop Overview & Capabilities</strong>
          </div>
          <div class="panel-body">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div class="stat-mini-card">
                <span class="stat-mini-label">Total SKUs in Store</span>
                <strong class="stat-mini-value">{{ summary?.totalProducts ?? 0 }}</strong>
                <span class="stat-mini-sub">Smartphones, tablets & accessories</span>
              </div>

              <div class="stat-mini-card">
                <span class="stat-mini-label">Registered Customers</span>
                <strong class="stat-mini-value">{{ summary?.totalCustomers ?? 0 }}</strong>
                <span class="stat-mini-sub">Loyalty & retail profiles</span>
              </div>
            </div>

            <!-- Printing & Invoicing Capability Checklist -->
            <div class="capabilities-box">
              <div class="cap-title">RETAIL BILLING & PRINT ENGINE:</div>
              <ul class="cap-list">
                <li>✓ <strong>Standard A4 Tax Invoice:</strong> HSN 8517, CGST/SGST 9%+9%, words-to-amount in INR, UPI QR code.</li>
                <li>✓ <strong>80mm Thermal Slip:</strong> Compact 76mm POS printout for thermal counter receipt printers.</li>
                <li>✓ <strong>Device Intake Token:</strong> 80mm claim token for customers + A4 10-point workshop job card.</li>
                <li>✓ <strong>Live SMTP Dispatch:</strong> Send email copies of bills and repair tokens to customers via Gmail.</li>
              </ul>
            </div>

            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center;">
              <span class="text-muted" style="font-size: 0.85rem;">Need to audit today's reviews?</span>
              <a routerLink="/admin/reviews" class="btn ghost" style="padding: 4px 10px; font-size: 0.82rem;">Review Queue →</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Low Stock Immediate Reorder Table -->
      <section class="panel">
        <div class="panel-header" style="justify-content: space-between;">
          <div>
            <strong>📦 Critical Handset & Accessory Stock Levels</strong>
            <span class="muted" style="margin-left: 8px; font-size: 0.85rem;">Items below reorder point requiring replenishment</span>
          </div>
          <a class="btn primary ghost" routerLink="/purchasing" style="font-size: 0.85rem;">+ Create Supplier PO</a>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (item of lowStock; track item.sku) {
                <tr>
                  <td><strong>{{ item.productName }}</strong></td>
                  <td><code>{{ item.sku }}</code></td>
                  <td>
                    <span class="badge" [class.bad]="item.quantityOnHand <= 0" [class.warn]="item.quantityOnHand > 0">
                      {{ item.quantityOnHand }} units
                    </span>
                  </td>
                  <td>{{ item.reorderLevel }} units</td>
                  <td>
                    <span class="badge" [class.bad]="item.quantityOnHand <= 0" [class.warn]="item.quantityOnHand > 0">
                      {{ item.quantityOnHand <= 0 ? 'CRITICAL (Out of Stock)' : 'LOW STOCK' }}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <a routerLink="/purchasing" class="btn ghost" style="padding: 4px 10px; font-size: 0.8rem;">Reorder →</a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6">
                    <div class="empty-state" style="padding: 30px;">
                      ✅ All inventory levels are healthy! No handsets or accessories below threshold.
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Store Identity Banner */
    .store-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 20px 24px;
      border-radius: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15);
    }

    .banner-left {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .brand-line {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .store-icon {
      font-size: 2.2rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 10px;
    }

    .store-name {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: 0.02em;
      color: #ffffff;
    }

    .store-sub {
      margin: 2px 0 0;
      font-size: 0.82rem;
      color: #94a3b8;
    }

    .meta-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .pill-item {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.78rem;
      color: #cbd5e1;
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 10px 16px;
      border-radius: 10px;
    }

    .status-indicator.online {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
    }

    .status-texts {
      display: flex;
      flex-direction: column;
    }

    .status-main {
      font-size: 0.85rem;
      font-weight: 700;
      color: #a7f3d0;
    }

    .status-sub {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    /* Launcher Hub */
    .launcher-hub {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }

    .launcher-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      text-decoration: none;
      transition: all 0.2s ease;
      position: relative;
    }

    .launcher-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
      border-color: #cbd5e1;
    }

    .launcher-icon {
      font-size: 1.8rem;
    }

    .launcher-content {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .launcher-content strong {
      font-size: 0.92rem;
      color: #0f172a;
    }

    .launcher-content span {
      font-size: 0.75rem;
      color: #64748b;
    }

    .launcher-arrow {
      font-size: 1.1rem;
      color: #94a3b8;
      font-weight: bold;
    }

    /* KPI Metrics */
    .kpi-metric {
      background: #ffffff;
      padding: 18px 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      position: relative;
      overflow: hidden;
    }

    .kpi-metric::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }

    .kpi-metric.blue::before { background: #0284c7; }
    .kpi-metric.green::before { background: #0d7a5f; }
    .kpi-metric.red::before { background: #dc2626; }
    .kpi-metric.emerald::before { background: #16a34a; }

    .kpi-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .kpi-num {
      display: block;
      font-size: 1.7rem;
      font-weight: 900;
      margin: 4px 0 2px;
    }

    .kpi-sub {
      margin: 0;
      font-size: 0.78rem;
      color: #94a3b8;
    }

    /* Action Cards */
    .action-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .action-card:hover {
      background: #ffffff;
      border-color: #cbd5e1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .action-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action-emoji {
      font-size: 1.4rem;
    }

    .action-card strong {
      font-size: 0.88rem;
      color: #0f172a;
    }

    .action-card p {
      margin: 2px 0 0;
      font-size: 0.78rem;
    }

    /* Mini Stat Cards */
    .stat-mini-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
    }

    .stat-mini-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }

    .stat-mini-value {
      font-size: 1.4rem;
      color: #0f172a;
      font-weight: 800;
      margin: 2px 0;
    }

    .stat-mini-sub {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    /* Capabilities Box */
    .capabilities-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 14px;
    }

    .cap-title {
      font-size: 0.75rem;
      font-weight: 800;
      color: #166534;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }

    .cap-list {
      margin: 0;
      padding-left: 16px;
      font-size: 0.78rem;
      color: #14532d;
      line-height: 1.5;
    }
  `]
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummaryDto | null = null;
  lowStock: StockReportItemDto[] = [];
  loading = false;
  error = '';
  readonly money = money;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';

    this.api.get<DashboardSummaryDto>('/api/reports/dashboard-summary').subscribe({
      next: (summary) => (this.summary = summary),
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });

    this.api.get<StockReportItemDto[]>('/api/reports/low-stock').subscribe({
      next: (items) => (this.lowStock = items),
      error: (error) => (this.error = apiErrorMessage(error))
    });
  }
}
