import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { InventoryStockDto, ProductDto, StockTransactionDto } from '../core/api.models';
import { dateTime, money } from '../core/formatters';

const stockTransactionLabels: Record<number, string> = {
  1: 'Opening Balance',
  2: 'Supplier Purchase',
  3: 'Retail Sale',
  4: 'Customer Return',
  5: 'Return to Vendor',
  6: 'Stock Adjustment'
};

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="inventory-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <div class="store-badge">
            <span class="dot-online"></span>
            <span>MOBILE STORE INVENTORY & WAREHOUSE</span>
          </div>
          <h2>Inventory Management</h2>
          <p>Real-time handset tracking, inventory valuation at cost vs retail, reorder triggers, and quick stock-in.</p>
        </div>
        <div class="header-actions">
          <button class="btn primary" type="button" (click)="toggleTopForm('inward')">
            {{ activeTopForm === 'inward' ? '✕ Close Inward' : '📥 + Fast Inward Stock' }}
          </button>
          <button class="btn" type="button" (click)="toggleTopForm('adjust')">
            {{ activeTopForm === 'adjust' ? '✕ Close Adjust' : '⚖️ Stock Adjustment' }}
          </button>
          <button class="btn ghost" type="button" (click)="exportInventoryCsv()">📥 Export CSV</button>
          <a class="btn ghost" routerLink="/admin/products">📦 Product Master</a>
        </div>
      </div>

      @if (error) {
        <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
      }
      @if (success) {
        <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
      }

      <!-- Top-Expandable Inward Handset Form -->
      @if (activeTopForm === 'inward') {
        <section class="top-form-card">
          <div class="top-form-header">
            <div class="top-form-title">
              <span class="badge good">+ FAST INWARD</span>
              <h3>📥 Inward Stock to Shelves</h3>
            </div>
            <button class="btn ghost" type="button" (click)="closeTopForm()" title="Collapse form">✕ Close</button>
          </div>
          <div class="top-form-body">
            <div class="grid three">
              <label class="field" style="grid-column: span 2;">
                <span>Handset Model / Accessory SKU <span class="required-star">*</span></span>
                <select class="select" name="receiveProductId" [(ngModel)]="receiveModel.productId">
                  <option value="">-- Choose Handset / Accessory to Inward --</option>
                  @for (product of products; track product.id) {
                    <option [value]="product.id">{{ product.name }} (SKU: {{ product.sku }}) — Current Stock: {{ product.quantityOnHand }}</option>
                  }
                </select>
              </label>
              <label class="field">
                <span>Units Received <span class="required-star">*</span></span>
                <input class="input" type="number" min="1" name="receiveQuantity" [(ngModel)]="receiveModel.quantity" placeholder="e.g. 10">
              </label>
            </div>
            <div class="grid two" style="margin-top: 10px;">
              <label class="field">
                <span>Distributor Invoice / PO Ref</span>
                <input class="input" name="supplierReference" [(ngModel)]="receiveModel.supplierReference" placeholder="e.g. INV-DIST-2026-084">
              </label>
            </div>
            <div class="top-form-footer">
              <button class="btn ghost" type="button" (click)="closeTopForm()">Cancel</button>
              <button class="btn primary" type="button" (click)="receiveStock()" [disabled]="!receiveModel.productId || receiveModel.quantity < 1">
                ✓ Inward Stock to Shelves
              </button>
            </div>
          </div>
        </section>
      }

      <!-- Top-Expandable Stock Adjustment Form -->
      @if (activeTopForm === 'adjust') {
        <section class="top-form-card">
          <div class="top-form-header">
            <div class="top-form-title">
              <span class="badge warn">AUDIT CORRECTION</span>
              <h3>⚖️ Manual Stock Adjustment & Audit Reconciliation</h3>
            </div>
            <button class="btn ghost" type="button" (click)="closeTopForm()" title="Collapse form">✕ Close</button>
          </div>
          <div class="top-form-body">
            <div class="grid three">
              <label class="field" style="grid-column: span 2;">
                <span>Select Handset / Accessory <span class="required-star">*</span></span>
                <select class="select" name="adjustProductId" [(ngModel)]="adjustModel.productId">
                  <option value="">-- Select Product for Physical Reconciliation --</option>
                  @for (product of products; track product.id) {
                    <option [value]="product.id">{{ product.name }} (Current: {{ product.quantityOnHand }})</option>
                  }
                </select>
              </label>
              <label class="field">
                <span>Quantity Change (+ / -) <span class="required-star">*</span></span>
                <input class="input" type="number" name="adjustQuantity" [(ngModel)]="adjustModel.quantity" placeholder="e.g. -1 for demo display">
              </label>
            </div>
            <div class="grid two" style="margin-top: 10px;">
              <label class="field" style="grid-column: span 2;">
                <span>Reason / Authorization Note <span class="required-star">*</span></span>
                <input class="input" name="adjustReason" [(ngModel)]="adjustModel.reason" placeholder="e.g. Floor demo unit / stock audit discrepancy">
              </label>
            </div>
            <div class="top-form-footer">
              <button class="btn ghost" type="button" (click)="closeTopForm()">Cancel</button>
              <button class="btn primary" type="button" (click)="adjustStock()" [disabled]="!adjustModel.productId || adjustModel.quantity === 0">
                Apply Stock Correction
              </button>
            </div>
          </div>
        </section>
      }

      <!-- Inventory Executive Valuation Cards -->
      <section class="grid five metrics-row">
        <div class="metric-card">
          <span class="m-label">Total In-Stock Units</span>
          <strong class="m-val">{{ totalStockUnits }}</strong>
          <small class="m-sub">Across {{ stocks.length }} distinct SKUs</small>
        </div>
        <div class="metric-card">
          <span class="m-label">Inventory Cost Value</span>
          <strong class="m-val">{{ money(totalCostValue) }}</strong>
          <small class="m-sub">Total capital invested at cost</small>
        </div>
        <div class="metric-card highlight">
          <span class="m-label">Retail Selling Value</span>
          <strong class="m-val">{{ money(totalRetailValue) }}</strong>
          <small class="m-sub">Expected gross realization</small>
        </div>
        <div class="metric-card profit">
          <span class="m-label">Unrealized Gross Margin</span>
          <strong class="m-val">{{ money(totalProfitPotential) }}</strong>
          <small class="m-sub">{{ marginPercentage.toFixed(1) }}% Avg gross margin</small>
        </div>
        <div class="metric-card warn" [class.danger]="lowStockCount > 0">
          <span class="m-label">Reorder Alerts</span>
          <strong class="m-val">{{ lowStockCount }}</strong>
          <small class="m-sub">{{ outOfStockCount }} products out of stock</small>
        </div>
      </section>

      <!-- Stock On Hand Section with Filters -->
      <section class="panel" style="margin-top: 20px;" [class.loading]="loading">
        <div class="panel-header filter-toolbar">
          <div class="toolbar-left">
            <strong>Stock On Hand & Valuations</strong>
            <div class="filter-tabs">
              <button type="button" class="ftab" [class.active]="filterCategory === 'all'" (click)="filterCategory = 'all'">All ({{ stocks.length }})</button>
              <button type="button" class="ftab warn" [class.active]="filterCategory === 'low'" (click)="filterCategory = 'low'">⚠️ Low Stock ({{ lowStockCount }})</button>
              <button type="button" class="ftab danger" [class.active]="filterCategory === 'out'" (click)="filterCategory = 'out'">🚫 Out of Stock ({{ outOfStockCount }})</button>
              <button type="button" class="ftab" [class.active]="filterCategory === 'mobiles'" (click)="filterCategory = 'mobiles'">📱 Mobiles</button>
              <button type="button" class="ftab" [class.active]="filterCategory === 'tablets'" (click)="filterCategory = 'tablets'">💻 Tablets</button>
            </div>
          </div>
          <div class="toolbar-right">
            <input class="input search-input" name="stockSearch" [(ngModel)]="searchTerm" placeholder="Search SKU, Handset Model, Brand...">
            <button class="btn ghost" type="button" (click)="loadAll()">🔄 Refresh</button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="inventory-table" style="width: 100%;">
            <thead>
              <tr>
                <th>Product Model & Specs</th>
                <th>SKU</th>
                <th>Category</th>
                <th style="text-align: right;">Cost Price (₹)</th>
                <th style="text-align: right;">Selling Price (₹)</th>
                <th style="text-align: center;">Margin</th>
                <th style="text-align: center;">On Hand</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: right;">Valuation (₹)</th>
                <th class="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredStocks; track item.stock.productId) {
                <tr class="stock-row" [class.active-row]="adjustModel.productId === item.stock.productId && activeTopForm === 'adjust'" [class.out-of-stock-row]="item.stock.quantityOnHand === 0">
                  <td>
                    <strong>{{ item.stock.productName }}</strong>
                    @if (item.product?.brandName) {
                      <span class="brand-chip">{{ item.product?.brandName }}</span>
                    }
                  </td>
                  <td><code>{{ item.stock.sku }}</code></td>
                  <td>{{ item.product?.categoryName || 'Mobile' }}</td>
                  <td class="text-right">₹{{ (item.product?.costPrice || 0) | number:'1.2-2' }}</td>
                  <td class="text-right font-bold">₹{{ (item.product?.price || 0) | number:'1.2-2' }}</td>
                  <td class="text-center">
                    @if (item.product) {
                      <span class="margin-pill" [class.good]="getMarginPct(item.product) >= 15">
                        {{ getMarginPct(item.product).toFixed(0) }}%
                      </span>
                    } @else {
                      <span>-</span>
                    }
                  </td>
                  <td class="text-center">
                    <strong class="stock-qty" [class.low]="item.stock.quantityOnHand <= item.stock.reorderLevel" [class.zero]="item.stock.quantityOnHand === 0">
                      {{ item.stock.quantityOnHand }}
                    </strong>
                    <div class="reorder-sub">Min: {{ item.stock.reorderLevel }}</div>
                  </td>
                  <td class="text-center">
                    @if (item.stock.quantityOnHand === 0) {
                      <span class="status-badge out">OUT OF STOCK</span>
                    } @else if (item.stock.quantityOnHand <= item.stock.reorderLevel) {
                      <span class="status-badge low">REORDER NEEDED</span>
                    } @else {
                      <span class="status-badge ok">IN STOCK</span>
                    }
                  </td>
                  <td class="text-right font-bold">
                    ₹{{ (item.stock.quantityOnHand * (item.product?.costPrice || 0)) | number:'1.2-2' }}
                  </td>
                  <td class="actions">
                    <div class="quick-in-buttons">
                      <button type="button" class="btn-fast-in" (click)="quickReceive(item.stock.productId, 5)" title="Quick Receive +5 units">+5</button>
                      <button type="button" class="btn-fast-in" (click)="quickReceive(item.stock.productId, 10)" title="Quick Receive +10 units">+10</button>
                      <button type="button" class="btn-fast-in" style="color: #d97706;" (click)="openAdjustForProduct(item.stock.productId)" title="Adjust physical stock count">⚖️</button>
                    </div>
                  </td>
              } @empty {
                <tr>
                  <td colspan="10"><div class="empty-state">No matching stock records found.</div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Recent Transactions Audit Log -->
      <section class="panel" style="margin-top: 20px;">
        <div class="panel-header">
          <strong>📋 Recent Stock In/Out Transactions & Audit Log</strong>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product Description</th>
                <th>Transaction Type</th>
                <th style="text-align: center;">Quantity</th>
                <th>Reason / Invoice Ref</th>
              </tr>
            </thead>
            <tbody>
              @for (transaction of transactions; track transaction.id) {
                <tr>
                  <td>{{ dateTime(transaction.createdAtUtc) }}</td>
                  <td><strong>{{ transaction.productName }}</strong></td>
                  <td>
                    <span class="tx-badge" [class.in]="transaction.quantity > 0" [class.out]="transaction.quantity < 0">
                      {{ transactionLabel(transaction.transactionType) }}
                    </span>
                  </td>
                  <td class="text-center">
                    <strong [style.color]="transaction.quantity > 0 ? '#16a34a' : '#dc2626'">
                      {{ transaction.quantity > 0 ? '+' : '' }}{{ transaction.quantity }}
                    </strong>
                  </td>
                  <td>{{ transaction.reason }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5"><div class="empty-state">No recent inventory transactions recorded.</div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .inventory-page {
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

    /* Valuation Metric Cards */
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
    .metric-card.warn { border-color: #fde68a; background: #fffbeb; }
    .metric-card.danger { border-color: #fca5a5; background: #fef2f2; }
    .m-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .m-val { font-size: 1.45rem; font-weight: 800; color: #0f172a; }
    .m-sub { font-size: 0.74rem; color: #64748b; }

    /* Filter Toolbar */
    .filter-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      padding: 12px 18px;
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .filter-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .ftab {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .ftab:hover { background: #e2e8f0; }
    .ftab.active { background: #0d7a5f; color: #fff; border-color: #0d7a5f; }
    .ftab.warn.active { background: #d97706; color: #fff; border-color: #d97706; }
    .ftab.danger.active { background: #dc2626; color: #fff; border-color: #dc2626; }
    .search-input { min-width: 240px; }

    /* Table Styles */
    .inventory-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .inventory-table th { background: #1e293b; color: #fff; padding: 10px 12px; font-weight: 600; font-size: 0.78rem; }
    .inventory-table td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    .brand-chip {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }
    .margin-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.72rem;
      background: #f1f5f9;
      color: #475569;
    }
    .margin-pill.good { background: #dcfce7; color: #15803d; }
    .stock-qty { font-size: 1.05rem; }
    .stock-qty.low { color: #d97706; }
    .stock-qty.zero { color: #dc2626; }
    .reorder-sub { font-size: 0.68rem; color: #94a3b8; }

    .status-badge {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .status-badge.ok { background: #dcfce7; color: #166534; }
    .status-badge.low { background: #fef3c7; color: #b45309; }
    .status-badge.out { background: #fee2e2; color: #991b1b; }

    .quick-in-buttons { display: flex; gap: 4px; justify-content: flex-end; }
    .btn-fast-in {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #0d7a5f;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-fast-in:hover { background: #0d7a5f; color: #fff; border-color: #0d7a5f; }

    .tx-badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .tx-badge.in { background: #dcfce7; color: #166534; }
    .tx-badge.out { background: #fee2e2; color: #991b1b; }
  `]
})
export class InventoryComponent implements OnInit {
  products: ProductDto[] = [];
  stocks: InventoryStockDto[] = [];
  transactions: StockTransactionDto[] = [];
  stockQuery = { search: '', pageNumber: 1, pageSize: 100 };
  receiveModel = { productId: '', quantity: 1, supplierReference: '' };
  adjustModel = { productId: '', quantity: 0, reason: '' };

  activeTopForm: 'inward' | 'adjust' | null = null;
  filterCategory: 'all' | 'low' | 'out' | 'mobiles' | 'tablets' = 'all';
  searchTerm = '';

  loading = false;
  error = '';
  success = '';
  readonly dateTime = dateTime;
  readonly money = money;

  toggleTopForm(form: 'inward' | 'adjust'): void {
    if (this.activeTopForm === form) {
      this.closeTopForm();
    } else {
      this.activeTopForm = form;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  closeTopForm(): void {
    this.activeTopForm = null;
  }

  openAdjustForProduct(productId: string): void {
    this.adjustModel.productId = productId;
    this.activeTopForm = 'adjust';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadAll();
  }

  transactionLabel(value: number): string {
    return stockTransactionLabels[value] ?? String(value);
  }

  loadProducts(): void {
    this.api.list<ProductDto>('/api/products', { pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => (this.products = result.items),
      error: (error) => (this.error = apiErrorMessage(error))
    });
  }

  loadAll(): void {
    this.loadStocks();
    this.loadTransactions();
  }

  loadStocks(): void {
    this.loading = true;
    this.api.list<InventoryStockDto>('/api/inventory/stocks', this.stockQuery).subscribe({
      next: (result) => (this.stocks = result.items),
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });
  }

  loadTransactions(): void {
    this.api.list<StockTransactionDto>('/api/inventory/transactions', { pageNumber: 1, pageSize: 40 }).subscribe({
      next: (result) => (this.transactions = result.items),
      error: (error) => (this.error = apiErrorMessage(error))
    });
  }

  // Stock Items with Product metadata
  get filteredStocks(): Array<{ stock: InventoryStockDto; product?: ProductDto }> {
    const term = this.searchTerm.trim().toLowerCase();
    return this.stocks
      .map((stock) => ({
        stock,
        product: this.products.find((p) => p.id === stock.productId || p.sku === stock.sku)
      }))
      .filter(({ stock, product }) => {
        // Tab Filters
        if (this.filterCategory === 'low' && (stock.quantityOnHand > stock.reorderLevel || stock.quantityOnHand === 0)) return false;
        if (this.filterCategory === 'out' && stock.quantityOnHand !== 0) return false;
        if (this.filterCategory === 'mobiles' && product?.productType !== 1) return false;
        if (this.filterCategory === 'tablets' && product?.productType !== 2) return false;

        // Search Filter
        if (!term) return true;
        const nameMatch = (stock.productName || '').toLowerCase().includes(term);
        const skuMatch = (stock.sku || '').toLowerCase().includes(term);
        const brandMatch = (product?.brandName || '').toLowerCase().includes(term);
        const catMatch = (product?.categoryName || '').toLowerCase().includes(term);
        return nameMatch || skuMatch || brandMatch || catMatch;
      });
  }

  // Financial & Inventory KPI Getters
  get totalStockUnits(): number {
    return this.stocks.reduce((sum, s) => sum + (s.quantityOnHand || 0), 0);
  }

  get totalCostValue(): number {
    return this.stocks.reduce((sum, s) => {
      const prod = this.products.find((p) => p.id === s.productId || p.sku === s.sku);
      const cost = prod?.costPrice || (prod?.price ? prod.price * 0.85 : 0);
      return sum + s.quantityOnHand * cost;
    }, 0);
  }

  get totalRetailValue(): number {
    return this.stocks.reduce((sum, s) => {
      const prod = this.products.find((p) => p.id === s.productId || p.sku === s.sku);
      const price = prod?.price || 0;
      return sum + s.quantityOnHand * price;
    }, 0);
  }

  get totalProfitPotential(): number {
    return Math.max(0, this.totalRetailValue - this.totalCostValue);
  }

  get marginPercentage(): number {
    if (this.totalRetailValue === 0) return 0;
    return (this.totalProfitPotential / this.totalRetailValue) * 100;
  }

  get lowStockCount(): number {
    return this.stocks.filter((s) => s.quantityOnHand <= s.reorderLevel).length;
  }

  get outOfStockCount(): number {
    return this.stocks.filter((s) => s.quantityOnHand === 0).length;
  }

  getMarginPct(product: ProductDto): number {
    if (!product || product.price === 0) return 0;
    const profit = product.price - product.costPrice;
    return Math.max(0, (profit / product.price) * 100);
  }

  // Fast In-line stock receiving
  quickReceive(productId: string, quantity: number): void {
    this.success = '';
    this.error = '';
    const payload = {
      productId,
      quantity,
      supplierReference: `Quick Stock In (+${quantity}) - ${new Date().toLocaleDateString()}`
    };
    this.api.post<void>('/api/inventory/receive', payload).subscribe({
      next: () => {
        this.success = `Successfully added +${quantity} units to inventory!`;
        setTimeout(() => (this.success = ''), 3500);
        this.loadAll();
      },
      error: (err) => (this.error = apiErrorMessage(err))
    });
  }

  receiveStock(): void {
    this.success = '';
    this.error = '';
    this.api.post<void>('/api/inventory/receive', this.receiveModel).subscribe({
      next: () => {
        this.success = 'Stock successfully received and added to inventory.';
        this.receiveModel = { productId: '', quantity: 1, supplierReference: '' };
        this.closeTopForm();
        this.loadAll();
      },
      error: (error) => (this.error = apiErrorMessage(error))
    });
  }

  adjustStock(): void {
    this.success = '';
    this.error = '';
    this.api.post<void>('/api/inventory/adjustment', this.adjustModel).subscribe({
      next: () => {
        this.success = 'Stock physical adjustment recorded successfully.';
        this.adjustModel = { productId: '', quantity: 0, reason: '' };
        this.closeTopForm();
        this.loadAll();
      },
      error: (error) => (this.error = apiErrorMessage(error))
    });
  }

  exportInventoryCsv(): void {
    if (this.stocks.length === 0) return;

    const headers = ['Product Name', 'SKU', 'Brand', 'Category', 'Quantity On Hand', 'Reorder Level', 'Cost Price (INR)', 'Retail Price (INR)', 'Total Cost Valuation (INR)', 'Status'];
    const rows = this.stocks.map((s) => {
      const prod = this.products.find((p) => p.id === s.productId || p.sku === s.sku);
      const cost = prod?.costPrice || 0;
      const price = prod?.price || 0;
      const status = s.quantityOnHand === 0 ? 'Out of Stock' : (s.quantityOnHand <= s.reorderLevel ? 'Low Stock' : 'In Stock');
      return [
        `"${(s.productName || '').replace(/"/g, '""')}"`,
        `"${s.sku}"`,
        `"${prod?.brandName || ''}"`,
        `"${prod?.categoryName || ''}"`,
        s.quantityOnHand,
        s.reorderLevel,
        cost.toFixed(2),
        price.toFixed(2),
        (s.quantityOnHand * cost).toFixed(2),
        `"${status}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
