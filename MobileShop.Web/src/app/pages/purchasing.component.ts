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
        <h2>Purchasing</h2>
        <p>Create purchase orders, inspect details, receive ordered lines, and cancel pending supplier orders.</p>
      </div>
      <a class="btn" routerLink="/admin/suppliers">Supplier master</a>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <section class="grid two">
      @if (auth.hasAnyRole(['SuperAdmin', 'Admin'])) {
        <div class="panel">
          <div class="panel-header">
            <strong>Create purchase order</strong>
          </div>
          <div class="panel-body grid">
            <label class="field">
              <span>Supplier</span>
              <select class="select" name="supplierId" [(ngModel)]="createModel.supplierId">
                <option value="">Select supplier</option>
                @for (supplier of suppliers; track supplier.id) {
                  <option [value]="supplier.id">{{ supplier.name }}</option>
                }
              </select>
            </label>
            <label class="field">
              <span>Expected at</span>
              <input class="input" type="datetime-local" name="expectedAtUtc" [(ngModel)]="createModel.expectedAtUtc">
            </label>
            <label class="field">
              <span>Notes</span>
              <textarea class="textarea" name="notes" [(ngModel)]="createModel.notes"></textarea>
            </label>

            <div style="border: 1px solid var(--line); border-radius: var(--radius);">
              <div class="panel-header">
                <strong>Add line</strong>
              </div>
              <div class="panel-body grid">
                <label class="field">
                  <span>Product</span>
                  <select class="select" name="lineProductId" [(ngModel)]="lineDraft.productId">
                    <option value="">Select product</option>
                    @for (product of products; track product.id) {
                      <option [value]="product.id">{{ product.name }} - {{ product.sku }}</option>
                    }
                  </select>
                </label>
                <div class="grid three">
                  <label class="field">
                    <span>Qty</span>
                    <input class="input" type="number" min="1" name="quantityOrdered" [(ngModel)]="lineDraft.quantityOrdered">
                  </label>
                  <label class="field">
                    <span>Unit cost</span>
                    <input class="input" type="number" min="0" step="0.01" name="unitCost" [(ngModel)]="lineDraft.unitCost">
                  </label>
                  <label class="field">
                    <span>Tax %</span>
                    <input class="input" type="number" min="0" max="100" step="0.01" name="taxPercentage" [(ngModel)]="lineDraft.taxPercentage">
                  </label>
                </div>
                <button class="btn" type="button" (click)="addLine()">Add line</button>
              </div>
            </div>

            @if (createModel.items.length > 0) {
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit cost</th>
                      <th>Tax</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of createModel.items; track line.productId) {
                      <tr>
                        <td>{{ line.productName }}</td>
                        <td>{{ line.quantityOrdered }}</td>
                        <td>{{ money(line.unitCost) }}</td>
                        <td>{{ line.taxPercentage }}%</td>
                        <td><button class="btn danger" type="button" (click)="removeLine(line.productId)">Remove</button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <button class="btn primary" type="button" (click)="createPurchaseOrder()">Create PO</button>
          </div>
        </div>
      }

      <div class="panel">
        <div class="panel-header">
          <strong>Selected order</strong>
          @if (selected) {
            <button class="btn ghost" type="button" (click)="selected = null">Close</button>
          }
        </div>
        <div class="panel-body">
          @if (selected) {
            <div class="grid">
              <div class="grid two">
                <div>
                  <p class="muted">PO number</p>
                  <strong>{{ selected.purchaseOrderNumber }}</strong>
                </div>
                <div>
                  <p class="muted">Status</p>
                  <span class="badge">{{ enumLabel(purchaseOrderStatusOptions, selected.status) }}</span>
                </div>
                <div>
                  <p class="muted">Supplier</p>
                  <strong>{{ selected.supplierName }}</strong>
                </div>
                <div>
                  <p class="muted">Total</p>
                  <strong>{{ money(selected.totalAmount) }}</strong>
                </div>
              </div>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Ordered</th>
                      <th>Received</th>
                      <th>Receive now</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of selected.items; track item.productId) {
                      <tr>
                        <td>{{ item.productName }}</td>
                        <td>{{ item.quantityOrdered }}</td>
                        <td>{{ item.quantityReceived }}</td>
                        <td>
                          <input class="input" type="number" min="0" style="width: 110px;" [name]="'recv' + item.productId" [(ngModel)]="receiveQuantities[item.productId]">
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="toolbar">
                <button class="btn primary" type="button" (click)="receiveSelected()">Receive quantities</button>
                @if (auth.hasAnyRole(['SuperAdmin', 'Admin'])) {
                  <button class="btn danger" type="button" (click)="cancelSelected()">Cancel PO</button>
                }
              </div>
            </div>
          } @else {
            <p class="muted">Choose a purchase order from the list to load GET /api/purchaseorders/:id.</p>
          }
        </div>
      </div>
    </section>

    <section class="panel" style="margin-top: 16px;" [class.loading]="loading">
      <div class="panel-header toolbar">
        <div class="toolbar-left">
          <strong>Purchase orders</strong>
          <input class="input" style="width: min(320px, 100%);" name="purchaseSearch" [(ngModel)]="query.search" (keyup.enter)="loadOrders()" placeholder="Search PO or supplier">
          <button class="btn" type="button" (click)="loadOrders()">Search</button>
        </div>
        <button class="btn ghost" type="button" (click)="loadOrders()">Refresh</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PO</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Total</th>
              <th>Expected</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @for (order of purchaseOrders; track order.id) {
              <tr>
                <td>{{ order.purchaseOrderNumber }}</td>
                <td>{{ order.supplierName }}</td>
                <td>{{ enumLabel(purchaseOrderStatusOptions, order.status) }}</td>
                <td>{{ money(order.totalAmount) }}</td>
                <td>{{ dateTime(order.expectedAtUtc) }}</td>
                <td><button class="btn ghost" type="button" (click)="loadDetails(order.id)">Details</button></td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6"><div class="empty-state">No purchase orders found.</div></td>
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
