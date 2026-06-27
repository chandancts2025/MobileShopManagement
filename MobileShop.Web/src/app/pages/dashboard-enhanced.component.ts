import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { DashboardSummaryDto, SalesReportItemDto } from '../core/api.models';
import { money } from '../core/formatters';

@Component({
  selector: 'app-dashboard-enhanced',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <p>Real-time business overview and key metrics</p>
      </div>
      <div class="toolbar-right">
        <button class="btn ghost" (click)="refresh()">Refresh</button>
        <a class="btn primary" routerLink="/reports">View Reports</a>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    <!-- Key Metrics Grid -->
    <section class="grid four" [class.loading]="loading" style="margin-bottom: 16px;">
      <div class="metric">
        <span>Total Revenue</span>
        <strong>{{ money(summary?.monthlySales) }}</strong>
        <p class="muted" style="font-size: 0.8rem; margin-top: 4px;">This month</p>
      </div>
      <div class="metric">
        <span>Today's Sales</span>
        <strong style="color: var(--primary);">{{ money(summary?.todaySales) }}</strong>
        <p class="muted" style="font-size: 0.8rem; margin-top: 4px;">Total amount</p>
      </div>
      <div class="metric">
        <span>Today's Profit</span>
        <strong style="color: var(--accent);">{{ money(summary?.todayProfit) }}</strong>
        <p class="muted" style="font-size: 0.8rem; margin-top: 4px;">After expenses</p>
      </div>
      <div class="metric">
        <span>Pending Orders</span>
        <strong style="color: #d97706;">{{ summary?.pendingOrders ?? 0 }}</strong>
        <p class="muted" style="font-size: 0.8rem; margin-top: 4px;">Action required</p>
      </div>
    </section>

    <!-- Main Grid -->
    <section class="grid two" style="margin-bottom: 16px;">
      <!-- Quick Actions Panel -->
      <div class="panel">
        <div class="panel-header">
          <strong>Quick Actions</strong>
        </div>
        <div class="panel-body">
          <div style="display: grid; gap: 8px;">
            <a routerLink="/orders" class="btn ghost" style="justify-content: flex-start;">
              📋 Manage Orders ({{ summary?.pendingOrders }})
            </a>
            <a routerLink="/inventory" class="btn ghost" style="justify-content: flex-start;">
              📦 Inventory ({{ summary?.lowStockProducts }} low stock)
            </a>
            <a routerLink="/repairs" class="btn ghost" style="justify-content: flex-start;">
              🔧 Repairs ({{ summary?.openRepairTickets }} open)
            </a>
            <a routerLink="/purchase-orders" class="btn ghost" style="justify-content: flex-start;">
              📥 Purchase Orders ({{ summary?.pendingPurchaseOrders }} pending)
            </a>
          </div>
        </div>
      </div>

      <!-- Performance Summary -->
      <div class="panel">
        <div class="panel-header">
          <strong>Performance Summary</strong>
        </div>
        <div class="panel-body">
          <div style="display: grid; gap: 12px;">
            <div>
              <p class="muted" style="margin: 0 0 4px;">Total Products</p>
              <strong style="font-size: 1.5rem;">{{ summary?.totalProducts ?? 0 }}</strong>
            </div>
            <div>
              <p class="muted" style="margin: 0 0 4px;">Total Customers</p>
              <strong style="font-size: 1.5rem;">{{ summary?.totalCustomers ?? 0 }}</strong>
            </div>
            <div>
              <p class="muted" style="margin: 0 0 4px;">Today's Expenses</p>
              <strong style="font-size: 1.5rem; color: var(--danger);">{{ money(summary?.todayExpenses) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Low Stock Products -->
    <section class="grid" style="margin-bottom: 16px;">
      <div class="panel">
        <div class="panel-header">
          <strong>⚠️ Low Stock Products</strong>
          <a class="btn ghost" routerLink="/inventory">View All</a>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (item of lowStock | slice:0:5; track item.sku) {
                <tr>
                  <td>{{ item.productName }}</td>
                  <td><code style="background: var(--surface-2); padding: 2px 4px; border-radius: 2px;">{{ item.sku }}</code></td>
                  <td>{{ item.quantityOnHand }}</td>
                  <td>{{ item.reorderLevel }}</td>
                  <td>
                    <span class="badge bad">Critical</span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5"><div class="empty-state">All products are well stocked!</div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Activity Feed -->
    <section class="grid two">
      <div class="panel">
        <div class="panel-header">
          <strong>📊 Recent Activity</strong>
        </div>
        <div class="panel-body">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid var(--line);">
              <p style="margin: 0; font-size: 0.9rem;">
                <strong>{{ summary?.pendingOrders }}</strong> pending orders
              </p>
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid var(--line);">
              <p style="margin: 0; font-size: 0.9rem;">
                <strong>{{ summary?.openRepairTickets }}</strong> open repair tickets
              </p>
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid var(--line);">
              <p style="margin: 0; font-size: 0.9rem;">
                <strong>{{ summary?.lowStockProducts }}</strong> products low on stock
              </p>
            </li>
            <li style="padding: 8px 0;">
              <p style="margin: 0; font-size: 0.9rem;">
                <strong>{{ summary?.pendingPurchaseOrders }}</strong> pending purchase orders
              </p>
            </li>
          </ul>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <strong>💰 Financial Overview</strong>
        </div>
        <div class="panel-body">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid var(--line);">
              <p class="muted" style="margin: 0 0 4px; font-size: 0.85rem;">Monthly Sales</p>
              <strong style="font-size: 1.1rem;">{{ money(summary?.monthlySales) }}</strong>
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid var(--line);">
              <p class="muted" style="margin: 0 0 4px; font-size: 0.85rem;">Today Sales</p>
              <strong style="font-size: 1.1rem; color: var(--primary);">{{ money(summary?.todaySales) }}</strong>
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid var(--line);">
              <p class="muted" style="margin: 0 0 4px; font-size: 0.85rem;">Today Expenses</p>
              <strong style="font-size: 1.1rem; color: var(--danger);">{{ money(summary?.todayExpenses) }}</strong>
            </li>
            <li style="padding: 8px 0;">
              <p class="muted" style="margin: 0 0 4px; font-size: 0.85rem;">Today Profit</p>
              <strong style="font-size: 1.1rem; color: var(--accent);">{{ money(summary?.todayProfit) }}</strong>
            </li>
          </ul>
        </div>
      </div>
    </section>
  `
})
export class DashboardEnhancedComponent implements OnInit {
  summary: DashboardSummaryDto | null = null;
  lowStock: any[] = [];
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

    this.api.get<any[]>('/api/reports/low-stock').subscribe({
      next: (items) => (this.lowStock = items),
      error: (error) => (this.error = apiErrorMessage(error))
    });
  }

  refresh(): void {
    this.load();
  }
}
