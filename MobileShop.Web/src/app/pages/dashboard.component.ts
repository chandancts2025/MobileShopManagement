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
    <div class="page-header">
      <div>
        <h2>📊 Executive Dashboard</h2>
        <p>Live business performance, real-time operating metrics, and urgent store actions</p>
      </div>
      <div class="toolbar-right">
        <button class="btn ghost" (click)="load()">↻ Refresh</button>
        <a class="btn primary" routerLink="/reports">Full Business Reports →</a>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    <!-- Financial KPIs (4 Cards) -->
    <section class="grid four" [class.loading]="loading" style="margin-bottom: 20px;">
      <div class="metric" style="border-top: 4px solid #0d9488;">
        <span>Monthly Sales</span>
        <strong style="color: #0d9488; font-size: 1.6rem;">{{ money(summary?.monthlySales) }}</strong>
        <p class="muted" style="font-size: 0.78rem; margin: 4px 0 0;">Gross revenue this month</p>
      </div>

      <div class="metric" style="border-top: 4px solid var(--primary);">
        <span>Today's Sales</span>
        <strong style="color: var(--primary); font-size: 1.6rem;">{{ money(summary?.todaySales) }}</strong>
        <p class="muted" style="font-size: 0.78rem; margin: 4px 0 0;">Cash & digital payments</p>
      </div>

      <div class="metric" style="border-top: 4px solid #b42318;">
        <span>Today's Expenses</span>
        <strong style="color: #b42318; font-size: 1.6rem;">{{ money(summary?.todayExpenses) }}</strong>
        <p class="muted" style="font-size: 0.78rem; margin: 4px 0 0;">Operating shop costs</p>
      </div>

      <div class="metric" style="border-top: 4px solid #16a34a;">
        <span>Today's Net Profit</span>
        <strong style="color: #16a34a; font-size: 1.6rem;">{{ money(summary?.todayProfit) }}</strong>
        <p class="muted" style="font-size: 0.78rem; margin: 4px 0 0;">Sales - COGS - Expenses</p>
      </div>
    </section>

    <!-- Operational Action Grid (2 Panels) -->
    <section class="grid two" style="margin-bottom: 20px;">
      <!-- Urgent Attention Cards -->
      <div class="panel">
        <div class="panel-header">
          <strong>⚡ Action Center</strong>
          <span class="badge warn">Immediate Tasks</span>
        </div>
        <div class="panel-body">
          <div style="display: grid; gap: 10px;">
            <a routerLink="/sales" class="action-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--surface-2); border-radius: 8px; text-decoration: none;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.4rem;">📦</span>
                <div>
                  <strong>Pending Orders</strong>
                  <p class="muted" style="margin: 0; font-size: 0.8rem;">Orders awaiting packing or payment</p>
                </div>
              </div>
              <span class="badge" [class.warn]="(summary?.pendingOrders ?? 0) > 0">
                {{ summary?.pendingOrders ?? 0 }} Pending
              </span>
            </a>

            <a routerLink="/repairs" class="action-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--surface-2); border-radius: 8px; text-decoration: none;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.4rem;">🔧</span>
                <div>
                  <strong>Active Repairs</strong>
                  <p class="muted" style="margin: 0; font-size: 0.8rem;">Devices in technician diagnostics/repair</p>
                </div>
              </div>
              <span class="badge primary">
                {{ summary?.openRepairTickets ?? 0 }} Open
              </span>
            </a>

            <a routerLink="/inventory" class="action-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--surface-2); border-radius: 8px; text-decoration: none;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.4rem;">⚠️</span>
                <div>
                  <strong>Low Stock Warnings</strong>
                  <p class="muted" style="margin: 0; font-size: 0.8rem;">Products at or below reorder threshold</p>
                </div>
              </div>
              <span class="badge bad">
                {{ summary?.lowStockProducts ?? 0 }} Low
              </span>
            </a>

            <a routerLink="/purchasing" class="action-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--surface-2); border-radius: 8px; text-decoration: none;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.4rem;">📥</span>
                <div>
                  <strong>Supplier Purchase Orders</strong>
                  <p class="muted" style="margin: 0; font-size: 0.8rem;">Incoming stock shipments pending receipt</p>
                </div>
              </div>
              <span class="badge primary">
                {{ summary?.pendingPurchaseOrders ?? 0 }} Pending
              </span>
            </a>
          </div>
        </div>
      </div>

      <!-- Quick Operations Hub -->
      <div class="panel">
        <div class="panel-header">
          <strong>🚀 Quick Operations Hub</strong>
        </div>
        <div class="panel-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <a routerLink="/sales" class="btn ghost" style="padding: 16px 12px; height: auto; flex-direction: column; text-align: center; gap: 6px;">
              <span style="font-size: 1.6rem;">🛒</span>
              <strong>POS & Orders</strong>
              <small class="muted">Process new sale</small>
            </a>

            <a routerLink="/repairs" class="btn ghost" style="padding: 16px 12px; height: auto; flex-direction: column; text-align: center; gap: 6px;">
              <span style="font-size: 1.6rem;">🛠️</span>
              <strong>Intake Repair</strong>
              <small class="muted">New device ticket</small>
            </a>

            <a routerLink="/inventory" class="btn ghost" style="padding: 16px 12px; height: auto; flex-direction: column; text-align: center; gap: 6px;">
              <span style="font-size: 1.6rem;">📦</span>
              <strong>Stock In / Out</strong>
              <small class="muted">Receive or adjust</small>
            </a>

            <a routerLink="/admin/reviews" class="btn ghost" style="padding: 16px 12px; height: auto; flex-direction: column; text-align: center; gap: 6px;">
              <span style="font-size: 1.6rem;">⭐</span>
              <strong>Review Queue</strong>
              <small class="muted">Approve feedback</small>
            </a>
          </div>

          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; font-size: 0.85rem;">
            <span>Registered Customers: <strong>{{ summary?.totalCustomers ?? 0 }}</strong></span>
            <span>Total Catalog SKUs: <strong>{{ summary?.totalProducts ?? 0 }}</strong></span>
          </div>
        </div>
      </div>
    </section>

    <!-- Low Stock Immediate Reorder Table -->
    <section class="panel">
      <div class="panel-header" style="justify-content: space-between;">
        <div>
          <strong>📦 Low Stock Alert List</strong>
          <span class="muted" style="margin-left: 8px; font-size: 0.85rem;">Critical products requiring replenishment</span>
        </div>
        <a class="btn primary ghost" routerLink="/purchasing" style="font-size: 0.85rem;">+ Create Purchase Order</a>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Current On Hand</th>
              <th>Reorder Threshold</th>
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
                    ✅ All inventory levels are healthy! No products below reorder thresholds.
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .action-card:hover {
      background: var(--surface) !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
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
      next: (summary) => this.summary = summary,
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });

    this.api.get<StockReportItemDto[]>('/api/reports/low-stock').subscribe({
      next: (items) => this.lowStock = items,
      error: (error) => this.error = apiErrorMessage(error)
    });
  }
}
