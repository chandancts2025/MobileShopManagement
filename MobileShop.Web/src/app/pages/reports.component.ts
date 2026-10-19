import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, FormsModule, ReportTableComponent],
  template: `
    <div class="reports-page">
      <!-- Page Header -->
      <div class="page-header no-print">
        <div>
          <div class="store-badge">
            <span class="dot-online"></span>
            <span>STORE FINANCIAL AUDIT & GST ANALYTICS</span>
          </div>
          <h2>Executive Business Reports</h2>
          <p>Sales revenue trends, brand market share, cash drawer reconciliation, GST collected, and profit & loss analysis.</p>
        </div>
        <div class="header-actions">
          <button class="btn" type="button" (click)="exportReportsCsv()">📥 Export Sales CSV</button>
          <button class="btn primary" type="button" (click)="printReport()">🖨️ Print Report</button>
        </div>
      </div>

      @if (error) {
        <div class="message error no-print" style="margin-bottom: 14px;">{{ error }}</div>
      }

      <!-- Date Presets & Filter Bar -->
      <section class="panel filter-panel no-print" style="margin-bottom: 16px;">
        <div class="filter-top">
          <div class="preset-buttons">
            <span class="preset-lbl">Quick Presets:</span>
            <button type="button" class="preset-btn" [class.active]="activePreset === 'today'" (click)="setPreset('today')">Today</button>
            <button type="button" class="preset-btn" [class.active]="activePreset === 'yesterday'" (click)="setPreset('yesterday')">Yesterday</button>
            <button type="button" class="preset-btn" [class.active]="activePreset === 'week'" (click)="setPreset('week')">Last 7 Days</button>
            <button type="button" class="preset-btn" [class.active]="activePreset === 'month'" (click)="setPreset('month')">This Month</button>
            <button type="button" class="preset-btn" [class.active]="activePreset === 'fy'" (click)="setPreset('fy')">Fiscal Year</button>
          </div>
        </div>
        <div class="panel-body grid three" style="padding-top: 10px;">
          <label class="field">
            <span>From Date</span>
            <input class="input" type="date" name="fromDate" [(ngModel)]="filters.fromDate" (change)="activePreset = 'custom'; loadAll()">
          </label>
          <label class="field">
            <span>To Date</span>
            <input class="input" type="date" name="toDate" [(ngModel)]="filters.toDate" (change)="activePreset = 'custom'; loadAll()">
          </label>
          <label class="field">
            <span>Cash Reconciliation Date</span>
            <input class="input" type="date" name="cashDate" [(ngModel)]="filters.cashDate" (change)="loadAll()">
          </label>
        </div>
      </section>

      <!-- Key Financial Metrics Ribbon -->
      <section class="grid five metrics-row" [class.loading]="loading">
        <div class="metric-card">
          <span class="m-label">Today's Sales</span>
          <strong class="m-val">{{ money(summary?.todaySales) }}</strong>
          <small class="m-sub">Gross counter & online orders</small>
        </div>
        <div class="metric-card highlight">
          <span class="m-label">Monthly Sales</span>
          <strong class="m-val">{{ money(summary?.monthlySales) }}</strong>
          <small class="m-sub">Month-to-date total</small>
        </div>
        <div class="metric-card">
          <span class="m-label">GST Tax Collected</span>
          <strong class="m-val">{{ money(taxCollected) }}</strong>
          <small class="m-sub">18% GST (CGST 9% + SGST 9%)</small>
        </div>
        <div class="metric-card profit">
          <span class="m-label">Gross Margin</span>
          <strong class="m-val">{{ money(profitLoss?.grossProfit) }}</strong>
          <small class="m-sub">{{ getGrossMarginPct().toFixed(1) }}% Margin on goods</small>
        </div>
        <div class="metric-card net-profit">
          <span class="m-label">Net Store Profit</span>
          <strong class="m-val">{{ money(profitLoss?.netProfit) }}</strong>
          <small class="m-sub">After all store expenses</small>
        </div>
      </section>

      <!-- Daily Cash Register & Digital Collection Reconciliation -->
      <section class="panel cash-panel" style="margin-top: 18px;">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>💵 Daily Cash Register & Payment Modes Reconciliation</strong>
            <span class="cash-date-tag">Date: {{ dateOnly(dailyCash?.dateUtc) }}</span>
          </div>
          <span class="tx-count-pill">{{ dailyCash?.paymentsCount || 0 }} Settled Transactions</span>
        </div>
        <div class="panel-body cash-grid">
          <div class="cash-box cash-inflow">
            <span class="c-title">Cash in Drawer</span>
            <strong class="c-val">{{ money(dailyCash?.cashSales) }}</strong>
            <small>Physical currency notes</small>
          </div>
          <div class="cash-box upi-inflow">
            <span class="c-title">UPI / QR Collections</span>
            <strong class="c-val">{{ money(dailyCash?.upiSales) }}</strong>
            <small>GPay, PhonePe, Paytm, BHIM</small>
          </div>
          <div class="cash-box card-inflow">
            <span class="c-title">Card Swipes (POS)</span>
            <strong class="c-val">{{ money(dailyCash?.cardSales) }}</strong>
            <small>Credit & Debit cards</small>
          </div>
          <div class="cash-box expense-outflow">
            <span class="c-title">Store Expenses</span>
            <strong class="c-val">-{{ money(dailyCash?.expenses) }}</strong>
            <small>Cash payouts & operational costs</small>
          </div>
          <div class="cash-box net-flow" [class.positive]="(dailyCash?.netCashFlow || 0) >= 0">
            <span class="c-title">Net Daily Cash Flow</span>
            <strong class="c-val">{{ money(dailyCash?.netCashFlow) }}</strong>
            <small>Net bank & drawer increase</small>
          </div>
        </div>
      </section>

      <!-- Visual Brand Share & Category Breakdown Split -->
      <section class="grid two" style="margin-top: 18px;">
        <!-- Brand Performance with Visual Share Bars -->
        <div class="panel">
          <div class="panel-header">
            <strong>📱 Handset Brand Sales & Volume Share</strong>
          </div>
          <div class="panel-body">
            @if (salesByBrand.length === 0) {
              <div class="empty-state">No brand sales data in selected range.</div>
            } @else {
              <div class="brand-bars-list">
                @for (brand of salesByBrand; track brand.label) {
                  <div class="brand-bar-item">
                    <div class="bar-header">
                      <span class="brand-name"><strong>{{ brand.label }}</strong> ({{ brand.ordersCount }} units)</span>
                      <strong class="brand-rev">{{ money(brand.salesAmount) }}</strong>
                    </div>
                    <div class="progress-track">
                      <div class="progress-fill" [style.width.%]="getBrandSharePct(brand.salesAmount)"></div>
                    </div>
                    <div class="bar-footer">
                      <small>{{ getBrandSharePct(brand.salesAmount).toFixed(1) }}% of total phone sales</small>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Profit & Loss Performance Ledger -->
        <div class="panel">
          <div class="panel-header">
            <strong>📊 Comprehensive Profit & Loss Performance</strong>
          </div>
          <div class="panel-body">
            <table class="pnl-table">
              <tr>
                <td>Total Orders Placed:</td>
                <td class="text-right"><strong>{{ profitLoss?.ordersCount ?? 0 }} orders</strong></td>
              </tr>
              <tr>
                <td>Gross Sales Revenue:</td>
                <td class="text-right"><strong>{{ money(profitLoss?.salesTotal) }}</strong></td>
              </tr>
              <tr>
                <td>Less: Cost of Goods Sold (COGS):</td>
                <td class="text-right text-danger">-{{ money(profitLoss?.costOfGoodsSold) }}</td>
              </tr>
              <tr class="highlight-row">
                <td><strong>Gross Store Margin:</strong></td>
                <td class="text-right"><strong>{{ money(profitLoss?.grossProfit) }}</strong></td>
              </tr>
              <tr>
                <td>Less: Store Operating Expenses:</td>
                <td class="text-right text-danger">-{{ money(profitLoss?.expenses) }}</td>
              </tr>
              <tr class="net-row">
                <td><strong>NET BUSINESS PROFIT:</strong></td>
                <td class="text-right"><strong class="net-val">{{ money(profitLoss?.netProfit) }}</strong></td>
              </tr>
            </table>
          </div>
        </div>
      </section>

      <!-- Sales By Category & Expenses By Category -->
      <section class="grid two" style="margin-top: 18px;">
        <report-table title="Category Sales Breakdown" [rows]="salesByCategory" valueLabel="Sales"></report-table>

        <div class="panel">
          <div class="panel-header">
            <strong>💸 Operational Expenses by Category</strong>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Expense Category</th>
                  <th>Vouchers</th>
                  <th style="text-align: right;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (item of expensesByCategory; track item.category) {
                  <tr>
                    <td><strong>{{ item.category }}</strong></td>
                    <td>{{ item.count }}</td>
                    <td class="text-right font-bold text-danger">{{ money(item.totalAmount) }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3"><div class="empty-state">No operating expense vouchers found.</div></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Sales Trend & Low Stock Warning -->
      <section class="grid two" style="margin-top: 18px;">
        <report-table title="Daily Sales Timeline" [rows]="salesByDate" valueLabel="Sales"></report-table>

        <div class="panel">
          <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center;">
            <strong>⚠️ Low Stock Replenishment Warning</strong>
            <span class="badge bad">{{ lowStock.length }} SKUs</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product Model</th>
                  <th>SKU</th>
                  <th style="text-align: center;">On Hand</th>
                  <th style="text-align: center;">Reorder Min</th>
                </tr>
              </thead>
              <tbody>
                @for (item of lowStock; track item.sku) {
                  <tr>
                    <td><strong>{{ item.productName }}</strong></td>
                    <td><code>{{ item.sku }}</code></td>
                    <td class="text-center font-bold" style="color: #dc2626;">{{ item.quantityOnHand }}</td>
                    <td class="text-center">{{ item.reorderLevel }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4"><div class="empty-state">All store inventory levels are healthy!</div></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .reports-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .store-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #0d7a5f;
      background: #e6f4ea;
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: 6px;
      border: 1px solid #b7e1cd;
      letter-spacing: 0.04em;
    }
    .dot-online {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #16a34a;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.25);
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .page-header h2 { margin: 0; font-size: 1.6rem; color: #0f172a; }
    .page-header p { margin: 4px 0 0; color: #64748b; font-size: 0.9rem; }
    .header-actions { display: flex; gap: 10px; align-items: center; }

    /* Date Preset Filter Bar */
    .filter-panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
    .filter-top { padding: 10px 16px 0; display: flex; align-items: center; gap: 10px; }
    .preset-buttons { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .preset-lbl { font-size: 0.75rem; font-weight: 700; color: #64748b; }
    .preset-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .preset-btn:hover { background: #f1f5f9; color: #0f172a; }
    .preset-btn.active { background: #0d7a5f; color: #ffffff; border-color: #0d7a5f; }

    /* KPI Metric Cards */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 18px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .metric-card.highlight { border-color: #0d7a5f; background: #f0fdf9; }
    .metric-card.profit { border-color: #86efac; background: #f0fdf4; }
    .metric-card.net-profit { border-color: #3b82f6; background: #eff6ff; }
    .m-label { font-size: 0.74rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .m-val { font-size: 1.45rem; font-weight: 800; color: #0f172a; }
    .m-sub { font-size: 0.72rem; color: #64748b; }

    /* Cash Panel */
    .cash-date-tag {
      font-size: 0.72rem;
      background: #e2e8f0;
      color: #334155;
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 8px;
      font-weight: 600;
    }
    .tx-count-pill {
      font-size: 0.72rem;
      font-weight: 700;
      color: #0d7a5f;
      background: #dcfce7;
      padding: 3px 8px;
      border-radius: 999px;
    }
    .cash-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }
    .cash-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .cash-box.cash-inflow { border-left: 4px solid #16a34a; }
    .cash-box.upi-inflow { border-left: 4px solid #2563eb; }
    .cash-box.card-inflow { border-left: 4px solid #7c3aed; }
    .cash-box.expense-outflow { border-left: 4px solid #dc2626; }
    .cash-box.net-flow { border-left: 4px solid #0d7a5f; background: #f0fdf9; }
    .c-title { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .c-val { font-size: 1.25rem; font-weight: 800; color: #0f172a; }
    .cash-box small { font-size: 0.7rem; color: #64748b; }

    /* Brand Share Bars */
    .brand-bars-list { display: flex; flex-direction: column; gap: 14px; }
    .brand-bar-item { display: flex; flex-direction: column; gap: 4px; }
    .bar-header { display: flex; justify-content: space-between; font-size: 0.85rem; }
    .brand-name { color: #0f172a; }
    .brand-rev { color: #0d7a5f; font-weight: 700; }
    .progress-track {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #0d7a5f, #16a34a);
      border-radius: 999px;
      transition: width 0.3s ease;
    }
    .bar-footer { display: flex; justify-content: flex-end; font-size: 0.7rem; color: #64748b; }

    /* PnL Table */
    .pnl-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .pnl-table td { padding: 9px 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    .pnl-table tr.highlight-row td { background: #f8fafc; font-weight: 700; color: #0f172a; }
    .pnl-table tr.net-row td {
      background: #f0fdf4;
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding: 12px 8px;
    }
    .net-val { color: #166534; font-size: 1.2rem; }
    .text-danger { color: #dc2626 !important; font-weight: 600; }

    @media print {
      .no-print { display: none !important; }
      .reports-page { padding: 0 !important; background: #fff !important; }
      .panel { box-shadow: none !important; border: 1px solid #cbd5e1 !important; page-break-inside: avoid; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  filters = {
    fromDate: '',
    toDate: '',
    cashDate: new Date().toISOString().slice(0, 10)
  };
  activePreset: 'today' | 'yesterday' | 'week' | 'month' | 'fy' | 'custom' = 'month';

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
    this.setPreset('month');
  }

  setPreset(preset: 'today' | 'yesterday' | 'week' | 'month' | 'fy'): void {
    this.activePreset = preset;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (preset === 'today') {
      this.filters.fromDate = todayStr;
      this.filters.toDate = todayStr;
      this.filters.cashDate = todayStr;
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      this.filters.fromDate = yStr;
      this.filters.toDate = yStr;
      this.filters.cashDate = yStr;
    } else if (preset === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      this.filters.fromDate = w.toISOString().slice(0, 10);
      this.filters.toDate = todayStr;
      this.filters.cashDate = todayStr;
    } else if (preset === 'month') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
      this.filters.fromDate = mStart.toISOString().slice(0, 10);
      this.filters.toDate = todayStr;
      this.filters.cashDate = todayStr;
    } else if (preset === 'fy') {
      // Indian Financial Year: April 1 to March 31
      const currentYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
      this.filters.fromDate = `${fyStartYear}-04-01`;
      this.filters.toDate = todayStr;
      this.filters.cashDate = todayStr;
    }

    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    const rangeParams = this.rangeParams();

    this.api.get<DashboardSummaryDto>('/api/reports/dashboard-summary').subscribe({
      next: (value) => (this.summary = value),
      error: (error) => (this.error = apiErrorMessage(error))
    });
    this.api.get<SalesReportItemDto[]>('/api/reports/sales-by-date', rangeParams).subscribe({
      next: (value) => (this.salesByDate = value),
      error: (error) => (this.error = apiErrorMessage(error))
    });
    this.api.get<SalesReportItemDto[]>('/api/reports/sales-by-brand').subscribe({
      next: (value) => (this.salesByBrand = value),
      error: (error) => (this.error = apiErrorMessage(error))
    });
    this.api.get<SalesReportItemDto[]>('/api/reports/sales-by-category').subscribe({
      next: (value) => (this.salesByCategory = value),
      error: (error) => (this.error = apiErrorMessage(error))
    });
    this.api.get<StockReportItemDto[]>('/api/reports/low-stock').subscribe({
      next: (value) => (this.lowStock = value),
      error: (error) => (this.error = apiErrorMessage(error))
    });
    this.api.get<{ taxCollected: number }>('/api/reports/tax-report', rangeParams).subscribe({
      next: (value) => (this.taxCollected = value.taxCollected),
      error: (error) => (this.error = apiErrorMessage(error))
    });
    this.api.get<ExpenseReportItemDto[]>('/api/reports/expenses-by-category', rangeParams).subscribe({
      next: (value) => (this.expensesByCategory = value),
      error: (error) => (this.error = apiErrorMessage(error))
    });
    this.api.get<DailyCashSummaryDto>('/api/reports/daily-cash-summary', { dateUtc: this.dateParam(this.filters.cashDate) }).subscribe({
      next: (value) => (this.dailyCash = value),
      error: (error) => (this.error = apiErrorMessage(error))
    });
    this.api.get<ProfitLossReportDto>('/api/reports/profit-loss', rangeParams).subscribe({
      next: (value) => (this.profitLoss = value),
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });
  }

  getGrossMarginPct(): number {
    if (!this.profitLoss || !this.profitLoss.salesTotal || this.profitLoss.salesTotal === 0) return 0;
    return (this.profitLoss.grossProfit / this.profitLoss.salesTotal) * 100;
  }

  getBrandSharePct(brandAmount: number): number {
    const totalBrandSales = this.salesByBrand.reduce((sum, b) => sum + (b.salesAmount || 0), 0);
    if (totalBrandSales === 0) return 0;
    return (brandAmount / totalBrandSales) * 100;
  }

  printReport(): void {
    window.print();
  }

  exportReportsCsv(): void {
    if (this.salesByBrand.length === 0 && this.salesByCategory.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += '--- MOBILE STORE EXECUTIVE SALES REPORT ---\n';
    csvContent += `Generated On,${new Date().toLocaleString()}\n`;
    csvContent += `Period From,${this.filters.fromDate || 'All'}\n`;
    csvContent += `Period To,${this.filters.toDate || 'All'}\n\n`;

    csvContent += 'BRAND SALES BREAKDOWN\nBrand,Units Sold,Gross Sales (INR)\n';
    this.salesByBrand.forEach((b) => {
      csvContent += `"${b.label}",${b.ordersCount},${b.salesAmount.toFixed(2)}\n`;
    });

    csvContent += '\nCATEGORY BREAKDOWN\nCategory,Orders,Sales (INR)\n';
    this.salesByCategory.forEach((c) => {
      csvContent += `"${c.label}",${c.ordersCount},${c.salesAmount.toFixed(2)}\n`;
    });

    csvContent += '\nPROFIT AND LOSS SUMMARY\n';
    csvContent += `Gross Revenue,${(this.profitLoss?.salesTotal || 0).toFixed(2)}\n`;
    csvContent += `Cost of Goods Sold (COGS),${(this.profitLoss?.costOfGoodsSold || 0).toFixed(2)}\n`;
    csvContent += `Gross Profit,${(this.profitLoss?.grossProfit || 0).toFixed(2)}\n`;
    csvContent += `Operating Expenses,${(this.profitLoss?.expenses || 0).toFixed(2)}\n`;
    csvContent += `Net Store Profit,${(this.profitLoss?.netProfit || 0).toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Store_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
