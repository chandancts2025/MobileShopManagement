import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { DashboardSummaryDto, StockReportItemDto } from '../core/api.models';
import { money } from '../core/formatters';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Dashboard</h2>
        <p>Live operating summary from the reporting endpoints.</p>
      </div>
      <div class="toolbar-right">
        <a class="btn" routerLink="/sales">Sales</a>
        <a class="btn" routerLink="/inventory">Inventory</a>
        <a class="btn primary" routerLink="/reports">Reports</a>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    <section class="grid four" [class.loading]="loading">
      <div class="metric">
        <span>Products</span>
        <strong>{{ summary?.totalProducts ?? 0 }}</strong>
      </div>
      <div class="metric">
        <span>Customers</span>
        <strong>{{ summary?.totalCustomers ?? 0 }}</strong>
      </div>
      <div class="metric">
        <span>Pending orders</span>
        <strong>{{ summary?.pendingOrders ?? 0 }}</strong>
      </div>
      <div class="metric">
        <span>Open repairs</span>
        <strong>{{ summary?.openRepairTickets ?? 0 }}</strong>
      </div>
      <div class="metric">
        <span>Today sales</span>
        <strong>{{ money(summary?.todaySales) }}</strong>
      </div>
      <div class="metric">
        <span>Today expenses</span>
        <strong>{{ money(summary?.todayExpenses) }}</strong>
      </div>
      <div class="metric">
        <span>Today profit</span>
        <strong>{{ money(summary?.todayProfit) }}</strong>
      </div>
      <div class="metric">
        <span>Monthly sales</span>
        <strong>{{ money(summary?.monthlySales) }}</strong>
      </div>
    </section>

    <section class="grid two" style="margin-top: 16px;">
      <div class="panel">
        <div class="panel-header">
          <strong>Attention needed</strong>
          <a class="btn ghost" routerLink="/inventory">Open inventory</a>
        </div>
        <div class="panel-body">
          <p class="muted">Low-stock products: {{ summary?.lowStockProducts ?? 0 }}</p>
          <p class="muted">Pending purchase orders: {{ summary?.pendingPurchaseOrders ?? 0 }}</p>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <strong>Low stock</strong>
          <a class="btn ghost" routerLink="/admin/products">Products</a>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Stock</th>
                <th>Reorder</th>
              </tr>
            </thead>
            <tbody>
              @for (item of lowStock; track item.sku) {
                <tr>
                  <td>{{ item.productName }}</td>
                  <td>{{ item.sku }}</td>
                  <td><span class="badge bad">{{ item.quantityOnHand }}</span></td>
                  <td>{{ item.reorderLevel }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4"><div class="empty-state">No low-stock products.</div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
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
