import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { InventoryStockDto, ProductDto, StockTransactionDto } from '../core/api.models';
import { dateTime } from '../core/formatters';

const stockTransactionLabels: Record<number, string> = {
  1: 'Opening balance',
  2: 'Purchase',
  3: 'Sale',
  4: 'Return in',
  5: 'Return out',
  6: 'Adjustment'
};

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Inventory</h2>
        <p>Stock levels, transaction history, receiving, and manual adjustments.</p>
      </div>
      <a class="btn" routerLink="/admin/products">Product master</a>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <section class="grid two">
      <div class="panel">
        <div class="panel-header">
          <strong>Receive stock</strong>
        </div>
        <div class="panel-body grid">
          <label class="field">
            <span>Product</span>
            <select class="select" name="receiveProductId" [(ngModel)]="receiveModel.productId">
              <option value="">Select product</option>
              @for (product of products; track product.id) {
                <option [value]="product.id">{{ product.name }} - {{ product.sku }}</option>
              }
            </select>
          </label>
          <div class="grid two">
            <label class="field">
              <span>Quantity</span>
              <input class="input" type="number" min="1" name="receiveQuantity" [(ngModel)]="receiveModel.quantity">
            </label>
            <label class="field">
              <span>Supplier reference</span>
              <input class="input" name="supplierReference" [(ngModel)]="receiveModel.supplierReference">
            </label>
          </div>
          <button class="btn primary" type="button" (click)="receiveStock()">Receive</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <strong>Adjust stock</strong>
        </div>
        <div class="panel-body grid">
          <label class="field">
            <span>Product</span>
            <select class="select" name="adjustProductId" [(ngModel)]="adjustModel.productId">
              <option value="">Select product</option>
              @for (product of products; track product.id) {
                <option [value]="product.id">{{ product.name }} - {{ product.sku }}</option>
              }
            </select>
          </label>
          <div class="grid two">
            <label class="field">
              <span>Quantity change</span>
              <input class="input" type="number" name="adjustQuantity" [(ngModel)]="adjustModel.quantity">
            </label>
            <label class="field">
              <span>Reason</span>
              <input class="input" name="adjustReason" [(ngModel)]="adjustModel.reason">
            </label>
          </div>
          <button class="btn primary" type="button" (click)="adjustStock()">Adjust</button>
        </div>
      </div>
    </section>

    <section class="panel" style="margin-top: 16px;" [class.loading]="loading">
      <div class="panel-header toolbar">
        <div class="toolbar-left">
          <strong>Stock on hand</strong>
          <input class="input" style="width: min(320px, 100%);" name="stockSearch" [(ngModel)]="stockQuery.search" (keyup.enter)="loadStocks()" placeholder="Search stock">
          <button class="btn" type="button" (click)="loadStocks()">Search</button>
        </div>
        <button class="btn ghost" type="button" (click)="loadAll()">Refresh</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>On hand</th>
              <th>Reserved</th>
              <th>Reorder</th>
            </tr>
          </thead>
          <tbody>
            @for (stock of stocks; track stock.productId) {
              <tr>
                <td>{{ stock.productName }}</td>
                <td>{{ stock.sku }}</td>
                <td><span class="badge" [class.bad]="stock.quantityOnHand <= stock.reorderLevel">{{ stock.quantityOnHand }}</span></td>
                <td>{{ stock.reservedQuantity }}</td>
                <td>{{ stock.reorderLevel }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5"><div class="empty-state">No stock records found.</div></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel" style="margin-top: 16px;">
      <div class="panel-header">
        <strong>Recent transactions</strong>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Product</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            @for (transaction of transactions; track transaction.id) {
              <tr>
                <td>{{ dateTime(transaction.createdAtUtc) }}</td>
                <td>{{ transaction.productName }}</td>
                <td>{{ transactionLabel(transaction.transactionType) }}</td>
                <td>{{ transaction.quantity }}</td>
                <td>{{ transaction.reason }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5"><div class="empty-state">No transactions found.</div></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class InventoryComponent implements OnInit {
  products: ProductDto[] = [];
  stocks: InventoryStockDto[] = [];
  transactions: StockTransactionDto[] = [];
  stockQuery = { search: '', pageNumber: 1, pageSize: 20 };
  receiveModel = { productId: '', quantity: 1, supplierReference: '' };
  adjustModel = { productId: '', quantity: 0, reason: '' };
  loading = false;
  error = '';
  success = '';
  readonly dateTime = dateTime;

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
      next: (result) => this.products = result.items,
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  loadAll(): void {
    this.loadStocks();
    this.loadTransactions();
  }

  loadStocks(): void {
    this.loading = true;
    this.api.list<InventoryStockDto>('/api/inventory/stocks', this.stockQuery).subscribe({
      next: (result) => this.stocks = result.items,
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  loadTransactions(): void {
    this.api.list<StockTransactionDto>('/api/inventory/transactions', { pageNumber: 1, pageSize: 30 }).subscribe({
      next: (result) => this.transactions = result.items,
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  receiveStock(): void {
    this.success = '';
    this.error = '';
    this.api.post<void>('/api/inventory/receive', this.receiveModel).subscribe({
      next: () => {
        this.success = 'Stock received.';
        this.receiveModel = { productId: '', quantity: 1, supplierReference: '' };
        this.loadAll();
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  adjustStock(): void {
    this.success = '';
    this.error = '';
    this.api.post<void>('/api/inventory/adjustment', this.adjustModel).subscribe({
      next: () => {
        this.success = 'Stock adjusted.';
        this.adjustModel = { productId: '', quantity: 0, reason: '' };
        this.loadAll();
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }
}
