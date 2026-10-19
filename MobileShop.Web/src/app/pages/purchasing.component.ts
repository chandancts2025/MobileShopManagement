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
      <a class="btn" routerLink="/admin/suppliers">🏢 Supplier Master</a>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <section class="grid two">
      @if (auth.hasAnyRole(['SuperAdmin', 'Admin'])) {
        <div class="panel panel-accent" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          <div class="panel-header" style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <div>
              <strong style="font-size: 1rem; color: #0f172a;">📋 Create Purchase Order</strong>
              <p style="margin: 2px 0 0; font-size: 0.78rem; color: #64748b;">Order fresh handset stock from authorized distributors</p>
            </div>
            <span class="badge good">+ New PO</span>
          </div>
          <div class="panel-body grid" style="padding: 20px;">
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
            <label class="field">
              <span>Purchase Order Notes</span>
              <textarea class="textarea" name="notes" [(ngModel)]="createModel.notes" placeholder="e.g. Bulk handset discount applicable / payment terms 30 days net"></textarea>
            </label>

            <!-- Line Items Builder Sub-card -->
            <div style="border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; padding: 14px; margin-top: 6px;">
              <strong style="display: block; font-size: 0.88rem; color: #0f172a; margin-bottom: 10px;">📦 Add Line Item</strong>
              <div class="grid">
                <label class="field">
                  <span>Product Model / SKU</span>
                  <select class="select" name="lineProductId" [(ngModel)]="lineDraft.productId">
                    <option value="">-- Select product to add --</option>
                    @for (product of products; track product.id) {
                      <option [value]="product.id">{{ product.name }} (SKU: {{ product.sku }})</option>
                    }
                  </select>
                </label>
                <div class="grid three">
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
                <button class="btn ghost" type="button" (click)="addLine()" [disabled]="!lineDraft.productId || lineDraft.quantityOrdered < 1" style="background: #ffffff;">
                  + Add Item Line
                </button>
              </div>
            </div>

            @if (createModel.items.length > 0) {
              <div class="table-wrap" style="margin-top: 10px;">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Cost</th>
                      <th>Tax</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of createModel.items; track line.productId) {
                      <tr>
                        <td><strong>{{ line.productName }}</strong></td>
                        <td>{{ line.quantityOrdered }}</td>
                        <td>{{ money(line.unitCost) }}</td>
                        <td>{{ line.taxPercentage }}%</td>
                        <td><button class="btn danger" type="button" (click)="removeLine(line.productId)" style="padding: 2px 8px; font-size: 0.75rem;">✕</button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <button class="btn primary" type="button" (click)="createPurchaseOrder()" [disabled]="!createModel.supplierId || createModel.items.length === 0" style="margin-top: 10px;">
              ✓ Issue Purchase Order
            </button>
          </div>
        </div>
      }

      <div class="panel panel-accent" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
        <div class="panel-header" style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <div>
            <strong style="font-size: 1rem; color: #0f172a;">🔍 Selected PO Inspector</strong>
            @if (selected) {
              <p style="margin: 2px 0 0; font-size: 0.78rem; color: #64748b;">Review PO lines and acknowledge inward shipment</p>
            }
          </div>
          @if (selected) {
            <button class="btn ghost" type="button" (click)="selected = null" style="padding: 4px 10px; font-size: 0.82rem;">✕ Close</button>
          }
        </div>
        <div class="panel-body" style="padding: 20px;">
          @if (selected) {
            <div class="grid">
              <div class="grid two" style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div>
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">PO Number</span>
                  <div style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-top: 2px;">{{ selected.purchaseOrderNumber }}</div>
                </div>
                <div>
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Status</span>
                  <div style="margin-top: 2px;">
                    <span class="badge" [class]="poStatusClass(selected.status)">
                      {{ enumLabel(purchaseOrderStatusOptions, selected.status) }}
                    </span>
                  </div>
                </div>
                <div style="margin-top: 8px;">
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Distributor</span>
                  <div style="font-weight: 700; color: #0f172a;">{{ selected.supplierName }}</div>
                </div>
                <div style="margin-top: 8px;">
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Valuation</span>
                  <div class="cell-price" style="font-size: 1.15rem; color: #0d7a5f;">{{ money(selected.totalAmount) }}</div>
                </div>
              </div>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Ordered</th>
                      <th>Received</th>
                      <th>Receive Now</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of selected.items; track item.productId) {
                      <tr>
                        <td><strong>{{ item.productName }}</strong></td>
                        <td>{{ item.quantityOrdered }}</td>
                        <td style="color: #16a34a; font-weight: 700;">{{ item.quantityReceived }}</td>
                        <td>
                          <input class="input" type="number" min="0" style="width: 100px; min-height: 32px; padding: 4px 8px;" [name]="'recv' + item.productId" [(ngModel)]="receiveQuantities[item.productId]">
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div style="display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end;">
                <button class="btn primary" type="button" (click)="receiveSelected()">✓ Receive Quantities</button>
                @if (auth.hasAnyRole(['SuperAdmin', 'Admin'])) {
                  <button class="btn danger" type="button" (click)="cancelSelected()">Cancel PO</button>
                }
              </div>
            </div>
          } @else {
            <div style="text-align: center; padding: 36px 14px; color: #64748b;">
              <div style="font-size: 2.2rem; margin-bottom: 8px;">📑</div>
              <strong style="color: #1e293b; display: block; margin-bottom: 4px;">No Purchase Order Selected</strong>
              <p style="font-size: 0.88rem; margin: 0;">Click "Details" on any purchase order in the table below to inspect items or receive goods.</p>
            </div>
          }
        </div>
      </div>
    </section>

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
        <table>
          <thead>
            <tr>
              <th>PO #</th>
              <th>Distributor / Supplier</th>
              <th>Status</th>
              <th>Total Amount</th>
              <th>Expected At</th>
              <th style="text-align: right; min-width: 110px;">Action</th>
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
                <td style="text-align: right;">
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
    this.api.get<PurchaseOrderDto>(`/api/purchaseorders/${id}`).subscribe({
      next: (order) => {
        this.selected = order;
        this.receiveQuantities = Object.fromEntries(order.items.map((item) => [item.productId, Math.max(0, item.quantityOrdered - item.quantityReceived)]));
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
