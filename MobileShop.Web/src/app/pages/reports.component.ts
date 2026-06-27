import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, apiErrorMessage } from '../core/api.service';
import {
  DailyCashSummaryDto,
  DashboardSummaryDto,
  ExpenseReportItemDto,
  ProfitLossReportDto,
  SalesReportItemDto,
  StockReportItemDto
} from '../core/api.models';
import { dateOnly, money } from '../core/formatters';
import { ReportTableComponent } from './report-table.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, ReportTableComponent],
  template: `
    <div class="page-header">
      <div>
        <h2>Reports</h2>
        <p>Every reporting endpoint is represented here with shared date filters.</p>
      </div>
      <button class="btn primary" type="button" (click)="loadAll()">Run reports</button>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    <section class="panel" style="margin-bottom: 16px;">
      <div class="panel-body grid three">
        <label class="field">
          <span>From</span>
          <input class="input" type="date" name="fromDate" [(ngModel)]="filters.fromDate">
        </label>
        <label class="field">
          <span>To</span>
          <input class="input" type="date" name="toDate" [(ngModel)]="filters.toDate">
        </label>
        <label class="field">
          <span>Cash date</span>
          <input class="input" type="date" name="cashDate" [(ngModel)]="filters.cashDate">
        </label>
      </div>
    </section>

    <section class="grid four" [class.loading]="loading">
      <div class="metric">
        <span>Today sales</span>
        <strong>{{ money(summary?.todaySales) }}</strong>
      </div>
      <div class="metric">
        <span>Monthly sales</span>
        <strong>{{ money(summary?.monthlySales) }}</strong>
      </div>
      <div class="metric">
        <span>Tax collected</span>
        <strong>{{ money(taxCollected) }}</strong>
      </div>
      <div class="metric">
        <span>Net profit</span>
        <strong>{{ money(profitLoss?.netProfit) }}</strong>
      </div>
    </section>

    <section class="grid two" style="margin-top: 16px;">
      <report-table title="Sales by date" [rows]="salesByDate" valueLabel="Sales"></report-table>
      <report-table title="Sales by brand" [rows]="salesByBrand" valueLabel="Sales"></report-table>
      <report-table title="Sales by category" [rows]="salesByCategory" valueLabel="Sales"></report-table>

      <div class="panel">
        <div class="panel-header">
          <strong>Expenses by category</strong>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              @for (item of expensesByCategory; track item.category) {
                <tr>
                  <td>{{ item.category }}</td>
                  <td>{{ item.count }}</td>
                  <td>{{ money(item.totalAmount) }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3"><div class="empty-state">No expense data.</div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <strong>Low stock</strong>
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
                  <td>{{ item.quantityOnHand }}</td>
                  <td>{{ item.reorderLevel }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4"><div class="empty-state">No low stock rows.</div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <strong>Daily cash summary</strong>
        </div>
        <div class="panel-body grid two">
          <div>
            <p class="muted">Date</p>
            <strong>{{ dateOnly(dailyCash?.dateUtc) }}</strong>
          </div>
          <div>
            <p class="muted">Net cash flow</p>
            <strong>{{ money(dailyCash?.netCashFlow) }}</strong>
          </div>
          <div>
            <p class="muted">Cash</p>
            <strong>{{ money(dailyCash?.cashSales) }}</strong>
          </div>
          <div>
            <p class="muted">Card</p>
            <strong>{{ money(dailyCash?.cardSales) }}</strong>
          </div>
          <div>
            <p class="muted">UPI</p>
            <strong>{{ money(dailyCash?.upiSales) }}</strong>
          </div>
          <div>
            <p class="muted">Expenses</p>
            <strong>{{ money(dailyCash?.expenses) }}</strong>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <strong>Profit and loss</strong>
        </div>
        <div class="panel-body grid two">
          <div>
            <p class="muted">Orders</p>
            <strong>{{ profitLoss?.ordersCount ?? 0 }}</strong>
          </div>
          <div>
            <p class="muted">Sales</p>
            <strong>{{ money(profitLoss?.salesTotal) }}</strong>
          </div>
          <div>
            <p class="muted">COGS</p>
            <strong>{{ money(profitLoss?.costOfGoodsSold) }}</strong>
          </div>
          <div>
            <p class="muted">Gross profit</p>
            <strong>{{ money(profitLoss?.grossProfit) }}</strong>
          </div>
          <div>
            <p class="muted">Expenses</p>
            <strong>{{ money(profitLoss?.expenses) }}</strong>
          </div>
          <div>
            <p class="muted">Net profit</p>
            <strong>{{ money(profitLoss?.netProfit) }}</strong>
          </div>
        </div>
      </div>
    </section>
  `
})
export class ReportsComponent implements OnInit {
  filters = {
    fromDate: '',
    toDate: '',
    cashDate: new Date().toISOString().slice(0, 10)
  };
  summary: DashboardSummaryDto | null = null;
  salesByDate: SalesReportItemDto[] = [];
  salesByBrand: SalesReportItemDto[] = [];
  salesByCategory: SalesReportItemDto[] = [];
  lowStock: StockReportItemDto[] = [];
  expensesByCategory: ExpenseReportItemDto[] = [];
  dailyCash: DailyCashSummaryDto | null = null;
  profitLoss: ProfitLossReportDto | null = null;
  taxCollected = 0;
  loading = false;
  error = '';
  readonly money = money;
  readonly dateOnly = dateOnly;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    const rangeParams = this.rangeParams();

    this.api.get<DashboardSummaryDto>('/api/reports/dashboard-summary').subscribe({
      next: (value) => this.summary = value,
      error: (error) => this.error = apiErrorMessage(error)
    });
    this.api.get<SalesReportItemDto[]>('/api/reports/sales-by-date', rangeParams).subscribe({
      next: (value) => this.salesByDate = value,
      error: (error) => this.error = apiErrorMessage(error)
    });
    this.api.get<SalesReportItemDto[]>('/api/reports/sales-by-brand').subscribe({
      next: (value) => this.salesByBrand = value,
      error: (error) => this.error = apiErrorMessage(error)
    });
    this.api.get<SalesReportItemDto[]>('/api/reports/sales-by-category').subscribe({
      next: (value) => this.salesByCategory = value,
      error: (error) => this.error = apiErrorMessage(error)
    });
    this.api.get<StockReportItemDto[]>('/api/reports/low-stock').subscribe({
      next: (value) => this.lowStock = value,
      error: (error) => this.error = apiErrorMessage(error)
    });
    this.api.get<{ taxCollected: number }>('/api/reports/tax-report', rangeParams).subscribe({
      next: (value) => this.taxCollected = value.taxCollected,
      error: (error) => this.error = apiErrorMessage(error)
    });
    this.api.get<ExpenseReportItemDto[]>('/api/reports/expenses-by-category', rangeParams).subscribe({
      next: (value) => this.expensesByCategory = value,
      error: (error) => this.error = apiErrorMessage(error)
    });
    this.api.get<DailyCashSummaryDto>('/api/reports/daily-cash-summary', { dateUtc: this.dateParam(this.filters.cashDate) }).subscribe({
      next: (value) => this.dailyCash = value,
      error: (error) => this.error = apiErrorMessage(error)
    });
    this.api.get<ProfitLossReportDto>('/api/reports/profit-loss', rangeParams).subscribe({
      next: (value) => this.profitLoss = value,
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  private rangeParams(): Record<string, string | null> {
    return {
      fromUtc: this.dateParam(this.filters.fromDate),
      toUtc: this.dateParam(this.filters.toDate, true)
    };
  }

  private dateParam(value: string, endOfDay = false): string | null {
    if (!value) {
      return null;
    }

    const suffix = endOfDay ? 'T23:59:59' : 'T00:00:00';
    return new Date(`${value}${suffix}`).toISOString();
  }
}
