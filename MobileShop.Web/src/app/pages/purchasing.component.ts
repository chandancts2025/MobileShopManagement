import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import {
  ProductDto,
  PurchaseOrderDto,
  purchaseOrderStatusOptions,
  SupplierDto
} from '../core/api.models';
import { dateTime, enumLabel, fromLocalInputValue, money } from '../core/formatters';

interface PurchaseOrderLineDraft {
  productId: string;
  productName: string;
  quantityOrdered: number;
  unitCost: number;
  taxPercentage: number;
}

@Component({
  selector: 'app-purchasing',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>
          Distributor Purchasing & POs
          <span class="badge" style="margin-left: 8px; font-size: 0.78rem;">{{ purchaseOrders.length }} orders</span>
        </h2>
        <p>Issue purchase orders to device distributors, receive shipments into inventory, and track vendor lines.</p>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        @if (auth.hasAnyRole(['SuperAdmin', 'Admin'])) {
          <button class="btn primary" type="button" (click)="toggleCreatePo()">
            {{ createOpen ? '✕ Close PO Form' : '📋 + Create Purchase Order' }}
          </button>
        }
        <a class="btn ghost" routerLink="/admin/suppliers">🏢 Supplier Master</a>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <!-- Top-Expandable Create PO Form -->
    @if (createOpen && auth.hasAnyRole(['SuperAdmin', 'Admin'])) {
      <section class="top-form-card">
        <div class="top-form-header">
          <div class="top-form-title">
            <span class="badge good">+ NEW PO</span>
            <h3>📋 Create Purchase Order to Distributor</h3>
          </div>
          <button class="btn ghost" type="button" (click)="createOpen = false" title="Collapse form">✕ Close</button>
        </div>
        <div class="top-form-body">
          <div class="grid two">
            <label class="field">
              <span>Distributor / Supplier <span class="required-star">*</span></span>
              <select class="select" name="supplierId" [(ngModel)]="createModel.supplierId">
                <option value="">-- Select supplier / vendor --</option>
                @for (supplier of suppliers; track supplier.id) {
                  <option [value]="supplier.id">{{ supplier.name }}</option>
                }
              </select>
            </label>
            <label class="field">
              <span>Expected Delivery Date</span>
              <input class="input" type="datetime-local" name="expectedAtUtc" [(ngModel)]="createModel.expectedAtUtc">
            </label>
          </div>
          <label class="field" style="margin-top: 10px;">
            <span>Purchase Order Notes</span>
            <textarea class="textarea" rows="2" name="notes" [(ngModel)]="createModel.notes" placeholder="e.g. Bulk handset discount applicable / payment terms 30 days net"></textarea>
          </label>

          <!-- Line Items Builder Sub-card -->
          <div style="border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; padding: 14px; margin-top: 12px;">
            <strong style="display: block; font-size: 0.88rem; color: #0f172a; margin-bottom: 10px;">📦 Add PO Line Item</strong>
            <div class="grid">
              <label class="field">
                <span>Product Model / SKU <span class="required-star">*</span></span>
                <select class="select" name="lineProductId" [(ngModel)]="lineDraft.productId">
                  <option value="">-- Select product to add --</option>
                  @for (product of products; track product.id) {
                    <option [value]="product.id">{{ product.name }} (SKU: {{ product.sku }})</option>
                  }
                </select>
              </label>
              <div class="grid three" style="margin-top: 8px;">
                <label class="field">
                  <span>Quantity</span>
                  <input class="input" type="number" min="1" name="quantityOrdered" [(ngModel)]="lineDraft.quantityOrdered">
                </label>
                <label class="field">
                  <span>Unit Cost (₹)</span>
                  <input class="input" type="number" min="0" step="0.01" name="unitCost" [(ngModel)]="lineDraft.unitCost" placeholder="0.00">
                </label>
                <label class="field">
                  <span>Tax %</span>
                  <input class="input" type="number" min="0" max="100" step="0.01" name="taxPercentage" [(ngModel)]="lineDraft.taxPercentage">
                </label>
              </div>
              <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                <button class="btn ghost" type="button" (click)="addLine()" [disabled]="!lineDraft.productId || lineDraft.quantityOrdered < 1" style="background: #ffffff; border-color: #cbd5e1;">
                  + Add Item Line
                </button>
              </div>
            </div>
          </div>

          @if (createModel.items.length > 0) {
            <div class="table-wrap" style="margin-top: 12px;">
              <table style="width: 100%;">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Cost</th>
                    <th>Tax</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of createModel.items; track line.productId) {
                    <tr>
                      <td><strong>{{ line.productName }}</strong></td>
                      <td>{{ line.quantityOrdered }}</td>
                      <td>{{ money(line.unitCost) }}</td>
                      <td>{{ line.taxPercentage }}%</td>
                      <td style="text-align: right;">
                        <button class="btn danger" type="button" (click)="removeLine(line.productId)" style="padding: 2px 8px; font-size: 0.75rem;">✕</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <div class="top-form-footer">
            <button class="btn ghost" type="button" (click)="createOpen = false">Cancel</button>
            <button class="btn primary" type="button" (click)="createPurchaseOrder()" [disabled]="!createModel.supplierId || createModel.items.length === 0">
              ✓ Issue Purchase Order
            </button>
          </div>
        </div>
      </section>
    }

    <!-- Top-Expandable Selected PO Inspector -->
    @if (selected) {
      <section class="top-form-card">
        <div class="top-form-header">
          <div class="top-form-title">
            <span class="badge" [class]="poStatusClass(selected.status)">
              {{ enumLabel(purchaseOrderStatusOptions, selected.status) }}
            </span>
            <h3>🔍 Purchase Order #{{ selected.purchaseOrderNumber }}</h3>
          </div>
          <button class="btn ghost" type="button" (click)="selected = null" title="Close inspector">✕ Close Inspector</button>
        </div>
        <div class="top-form-body">
          <div class="grid four" style="background: #f8fafc; padding: 14px 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 14px;">
            <div>
              <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Distributor</span>
              <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">{{ selected.supplierName }}</div>
            </div>
            <div>
              <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Expected At</span>
              <div style="font-size: 0.9rem; color: #334155; margin-top: 2px;">{{ dateTime(selected.expectedAtUtc) }}</div>
            </div>
            <div>
              <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Valuation</span>
              <div class="cell-price" style="font-size: 1.15rem; color: #0d7a5f; margin-top: 2px;">{{ money(selected.totalAmount) }}</div>
            </div>
            <div>
              <span style="font-size: 0.72rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Notes</span>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 2px;">{{ selected.notes || 'No notes' }}</div>
            </div>
          </div>

          <div class="table-wrap">
            <table style="width: 100%;">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Ordered</th>
                  <th>Received</th>
                  <th style="min-width: 140px;">Receive Now</th>
                </tr>
              </thead>
              <tbody>
                @for (item of selected.items; track item.productId) {
                  <tr>
                    <td><strong>{{ item.productName }}</strong></td>
                    <td>{{ item.quantityOrdered }}</td>
                    <td style="color: #16a34a; font-weight: 700;">{{ item.quantityReceived }}</td>
                    <td>
                      <input class="input" type="number" min="0" style="max-width: 110px; min-height: 32px; padding: 4px 8px;" [name]="'recv' + item.productId" [(ngModel)]="receiveQuantities[item.productId]">
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="top-form-footer">
            @if (auth.hasAnyRole(['SuperAdmin', 'Admin']) && selected.status !== 4 && selected.status !== 5) {
              <button class="btn danger" type="button" (click)="cancelSelected()">Cancel PO</button>
            }
            <button class="btn ghost" type="button" (click)="selected = null">Close</button>
            <button class="btn primary" type="button" (click)="receiveSelected()">✓ Receive Quantities</button>
          </div>
        </div>
      </section>
    }

    <!-- Full-Width Purchase Orders List Table -->
    <section class="panel" style="margin-top: 20px;" [class.loading]="loading">
      <div class="panel-header toolbar">
        <div class="toolbar-left" style="flex: 1;">
          <input class="input" style="max-width: 360px;" name="purchaseSearch" [(ngModel)]="query.search" (keyup.enter)="loadOrders()" placeholder="🔍 Search PO # or distributor name...">
          <button class="btn" type="button" (click)="loadOrders()">Search</button>
          @if (query.search) {
            <button class="btn ghost" type="button" (click)="query.search = ''; loadOrders()">Clear</button>
          }
        </div>
        <button class="btn ghost" type="button" (click)="loadOrders()">🔄 Refresh</button>
      </div>
      <div class="table-wrap">
        <table style="width: 100%;">
          <thead>
            <tr>
              <th>PO #</th>
              <th>Distributor / Supplier</th>
              <th>Status</th>
              <th>Total Amount</th>
              <th>Expected At</th>
              <th class="actions">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (order of purchaseOrders; track order.id) {
              <tr [class.active-row]="selected && selected.id === order.id">
                <td>
                  <span class="code-pill">#{{ order.purchaseOrderNumber }}</span>
                </td>
                <td>
                  <span class="cell-chip brand">{{ order.supplierName }}</span>
                </td>
                <td>
                  <span class="badge" [class]="poStatusClass(order.status)">
                    {{ enumLabel(purchaseOrderStatusOptions, order.status) }}
                  </span>
                </td>
                <td>
                  <strong class="cell-price">{{ money(order.totalAmount) }}</strong>
                </td>
                <td style="font-size: 0.84rem; color: #475569;">{{ dateTime(order.expectedAtUtc) }}</td>
                <td class="actions">
                  <button class="btn ghost" type="button" (click)="loadDetails(order.id)">Inspect 🔍</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">
                  <div class="empty-state">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">📋</div>
                    <strong>No purchase orders found</strong>
                    <p>Create a new purchase order above to start procuring devices.</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class PurchasingComponent implements OnInit {
  suppliers: SupplierDto[] = [];
  products: ProductDto[] = [];
  purchaseOrders: PurchaseOrderDto[] = [];
  selected: PurchaseOrderDto | null = null;
  createOpen = false;
  receiveQuantities: Record<string, number> = {};
  query = { search: '', pageNumber: 1, pageSize: 20 };
  createModel = {
    supplierId: '',
    expectedAtUtc: '',
    notes: '',
    items: [] as PurchaseOrderLineDraft[]
  };
  lineDraft = {
    productId: '',
    quantityOrdered: 1,
    unitCost: 0,
    taxPercentage: 18
  };
  loading = false;
  error = '';
  success = '';
  readonly money = money;
  readonly dateTime = dateTime;
  readonly enumLabel = enumLabel;
  readonly purchaseOrderStatusOptions = purchaseOrderStatusOptions;

  poStatusClass(status: number): string {
    switch (status) {
      case 4: return 'good';
      case 2:
      case 3: return 'warn';
      case 5: return 'bad';
      default: return '';
    }
  }

  constructor(
    private readonly api: ApiService,
    readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMasters();
    this.loadOrders();
  }

  toggleCreatePo(): void {
    this.createOpen = !this.createOpen;
    if (this.createOpen) {
      this.selected = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  loadMasters(): void {
    this.api.list<SupplierDto>('/api/suppliers', { pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => this.suppliers = result.items,
      error: (error) => this.error = apiErrorMessage(error)
    });
    this.api.list<ProductDto>('/api/products', { pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => this.products = result.items,
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  loadOrders(): void {
    this.loading = true;
    this.api.list<PurchaseOrderDto>('/api/purchaseorders', this.query).subscribe({
      next: (result) => this.purchaseOrders = result.items,
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  loadDetails(id: string): void {
    this.error = '';
    this.createOpen = false;
    this.api.get<PurchaseOrderDto>(`/api/purchaseorders/${id}`).subscribe({
      next: (order) => {
        this.selected = order;
        this.receiveQuantities = Object.fromEntries(order.items.map((item) => [item.productId, Math.max(0, item.quantityOrdered - item.quantityReceived)]));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  addLine(): void {
    const product = this.products.find((item) => item.id === this.lineDraft.productId);
    if (!product) {
      this.error = 'Select a product before adding a line.';
      return;
    }

    this.createModel.items = [
      ...this.createModel.items.filter((line) => line.productId !== product.id),
      {
        productId: product.id,
        productName: product.name,
        quantityOrdered: Number(this.lineDraft.quantityOrdered),
        unitCost: Number(this.lineDraft.unitCost),
        taxPercentage: Number(this.lineDraft.taxPercentage)
      }
    ];
    this.lineDraft = { productId: '', quantityOrdered: 1, unitCost: 0, taxPercentage: 18 };
    this.error = '';
  }

  removeLine(productId: string): void {
    this.createModel.items = this.createModel.items.filter((line) => line.productId !== productId);
  }

  createPurchaseOrder(): void {
    const payload = {
      supplierId: this.createModel.supplierId,
      expectedAtUtc: fromLocalInputValue(this.createModel.expectedAtUtc),
      notes: this.createModel.notes || null,
      items: this.createModel.items.map((item) => ({
        productId: item.productId,
        quantityOrdered: item.quantityOrdered,
        unitCost: item.unitCost,
        taxPercentage: item.taxPercentage
      }))
    };

    this.success = '';
    this.error = '';
    this.api.post<PurchaseOrderDto>('/api/purchaseorders', payload).subscribe({
      next: (order) => {
        this.success = `Purchase order ${order.purchaseOrderNumber} created.`;
        this.createModel = { supplierId: '', expectedAtUtc: '', notes: '', items: [] };
        this.createOpen = false;
        this.loadOrders();
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  receiveSelected(): void {
    if (!this.selected) {
      return;
    }

    const items = Object.entries(this.receiveQuantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([productId, quantity]) => ({ productId, quantityReceived: Number(quantity) }));

    this.success = '';
    this.error = '';
    this.api.post<PurchaseOrderDto>(`/api/purchaseorders/${this.selected.id}/receive`, { items }).subscribe({
      next: (order) => {
        this.success = `Purchase order ${order.purchaseOrderNumber} received.`;
        this.selected = order;
        this.loadOrders();
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  cancelSelected(): void {
    if (!this.selected || !confirm(`Cancel ${this.selected.purchaseOrderNumber}?`)) {
      return;
    }

    this.api.post<void>(`/api/purchaseorders/${this.selected.id}/cancel`, {}).subscribe({
      next: () => {
        this.success = 'Purchase order cancelled.';
        this.selected = null;
        this.loadOrders();
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }
}
