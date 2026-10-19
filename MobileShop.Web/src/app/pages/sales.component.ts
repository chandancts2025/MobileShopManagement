import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import {
  InvoiceDto,
  OrderDto,
  orderStatusOptions,
  PaymentDto,
  paymentStatusOptions,
  ReturnRequestDto,
  returnStatusOptions,
  BillDto
} from '../core/api.models';
import { dateTime, enumLabel, money } from '../core/formatters';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>
          Sales & Order Operations
          <span class="badge" style="margin-left: 8px; font-size: 0.78rem;">{{ orders.length }} orders</span>
        </h2>
        <p>Order fulfillment, payment recording, thermal receipt reprints, and return settlements.</p>
      </div>
      <a class="btn primary" routerLink="/cart">🛒 + New Sale from Cart</a>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <section class="panel" [class.loading]="loading">
      <div class="panel-header toolbar">
        <div class="toolbar-left" style="flex: 1;">
          <input class="input" style="max-width: 380px;" name="orderSearch" [(ngModel)]="orderQuery.search" (keyup.enter)="loadOrders()" placeholder="🔍 Search order # or customer name...">
          <button class="btn" type="button" (click)="loadOrders()">Search</button>
          @if (orderQuery.search) {
            <button class="btn ghost" type="button" (click)="orderQuery.search = ''; loadOrders()">Clear</button>
          }
        </div>
        <button class="btn ghost" type="button" (click)="loadOrders()">🔄 Refresh</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Total Amount</th>
              <th>Paid</th>
              <th>Balance Due</th>
              <th>Status</th>
              <th>Date Created</th>
              <th style="min-width: 170px;">Status & Print</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders; track order.id) {
              <tr>
                <td>
                  <span class="code-pill">#{{ order.orderNumber }}</span>
                </td>
                <td>
                  <strong>{{ order.customerName || 'Counter sale' }}</strong>
                </td>
                <td>
                  <strong class="cell-price">{{ money(order.totalAmount) }}</strong>
                </td>
                <td style="color: #16a34a; font-weight: 600;">{{ money(order.paidAmount) }}</td>
                <td>
                  @if (order.balanceAmount > 0) {
                    <span style="color: #dc2626; font-weight: 700;">{{ money(order.balanceAmount) }}</span>
                  } @else {
                    <span style="color: #16a34a;">₹0.00</span>
                  }
                </td>
                <td>
                  <span class="badge" [class]="orderStatusClass(order.status)">
                    {{ enumLabel(orderStatusOptions, order.status) }}
                  </span>
                </td>
                <td style="font-size: 0.84rem; color: #475569;">{{ dateTime(order.createdAtUtc) }}</td>
                <td>
                  <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <select class="select" style="min-width: 130px; min-height: 32px; padding: 4px 8px; font-size: 0.8rem;" [name]="'status' + order.id" [(ngModel)]="orderStatusDrafts[order.id]">
                      @for (status of orderStatusOptions; track status.value) {
                        <option [ngValue]="status.value">{{ status.label }}</option>
                      }
                    </select>
                    <button class="btn ghost" type="button" style="padding: 4px 8px; font-size: 0.78rem;" (click)="updateOrderStatus(order)" title="Save status update">Save</button>
                  </div>
                  <div style="display:flex; gap:6px; margin-top:6px; flex-wrap: wrap;">
                    <button class="btn" type="button" style="padding: 4px 8px; font-size: 0.78rem;" (click)="printOrder(order, 'a4')" title="Print Standard A4 Tax Invoice">📄 A4</button>
                    <button class="btn ghost" type="button" style="padding: 4px 8px; font-size: 0.78rem; background: #e0f2fe; color: #0369a1; border-color: #bae6fd;" (click)="printOrder(order, '80mm')" title="Print 80mm POS Thermal Slip">🧾 80mm</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8">
                  <div class="empty-state">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">🛒</div>
                    <strong>No orders found</strong>
                    <p>Start a new counter sale from the cart or catalog.</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid two" style="margin-top: 16px;">
      <div class="panel panel-accent" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
        <div class="panel-header" style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <div>
            <strong style="font-size: 1rem; color: #0f172a;">💳 Record Payment</strong>
            <p style="margin: 2px 0 0; font-size: 0.78rem; color: #64748b;">Capture cash, UPI, or card settlements against active orders</p>
          </div>
          <button class="btn ghost" type="button" (click)="loadPayments()">Refresh</button>
        </div>
        <div class="panel-body grid" style="padding: 20px;">
          <label class="field">
            <span>Select Target Order <span class="required-star">*</span></span>
            <select class="select" name="paymentOrderId" [(ngModel)]="paymentModel.orderId" required>
              <option [ngValue]="''">-- Select order --</option>
              @for (order of orders; track order.id) {
                <option [ngValue]="order.id">{{ order.orderNumber }} — {{ order.customerName || 'Counter sale' }} (Total: {{ money(order.totalAmount) }})</option>
              }
            </select>
          </label>
          <div class="grid two">
            <label class="field">
              <span>Amount (₹) <span class="required-star">*</span></span>
              <input class="input" type="number" min="0.01" step="0.01" name="paymentAmount" [(ngModel)]="paymentModel.amount" placeholder="0.00" required>
            </label>
            <label class="field">
              <span>Payment Status</span>
              <select class="select" name="paymentStatus" [(ngModel)]="paymentModel.status">
                @for (status of paymentStatusOptions; track status.value) {
                  <option [ngValue]="status.value">{{ status.label }}</option>
                }
              </select>
            </label>
          </div>
          <div class="grid two">
            <label class="field">
              <span>Payment Method <span class="required-star">*</span></span>
              <select class="select" name="paymentMethod" [(ngModel)]="paymentModel.paymentMethod">
                <option value="Cash">Cash</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Other">Bank Transfer / Other</option>
              </select>
            </label>
            <label class="field">
              <span>Reference / UTR #</span>
              <input class="input" name="transactionReference" [(ngModel)]="paymentModel.transactionReference" placeholder="e.g. UPI-1234567890">
            </label>
          </div>
          <button class="btn primary" type="button" (click)="createPayment()" [disabled]="!paymentModel.orderId || paymentModel.amount <= 0" style="margin-top: 6px;">
            ✓ Save Payment Record
          </button>
        </div>
      </div>

      <div class="panel panel-accent" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
        <div class="panel-header" style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <div>
            <strong style="font-size: 1rem; color: #0f172a;">↩️ Customer Returns</strong>
            <p style="margin: 2px 0 0; font-size: 0.78rem; color: #64748b;">Process item returns and authorize refunds</p>
          </div>
          <button class="btn ghost" type="button" (click)="loadReturns()">Refresh</button>
        </div>
        <div class="panel-body grid" style="padding: 20px;">
          <div class="grid two">
            <label class="field">
              <span>Order ID / Number <span class="required-star">*</span></span>
              <input class="input" name="returnOrderId" [(ngModel)]="returnModel.orderId" placeholder="Order ID or GUID">
            </label>
            <label class="field">
              <span>Refund Amount (₹) <span class="required-star">*</span></span>
              <input class="input" type="number" min="0" step="0.01" name="refundAmount" [(ngModel)]="returnModel.refundAmount" placeholder="0.00">
            </label>
          </div>
          <label class="field">
            <span>Return Reason & Inspection Notes <span class="required-star">*</span></span>
            <textarea class="textarea" name="returnReason" [(ngModel)]="returnModel.reason" placeholder="e.g. Unopened box / sealed handset returned within policy window"></textarea>
          </label>
          <button class="btn primary" type="button" (click)="createReturn()" [disabled]="!returnModel.orderId" style="margin-top: 6px;">
            Submit Return Request
          </button>
        </div>
      </div>
    </section>
  `
})
export class SalesComponent implements OnInit {
  orders: OrderDto[] = [];
  payments: PaymentDto[] = [];
  returns: ReturnRequestDto[] = [];
  invoice: InvoiceDto | null = null;
  invoiceOrderId = '';
  orderStatusDrafts: Record<string, number> = {};
  returnStatusDrafts: Record<string, number> = {};
  orderQuery = { search: '', pageNumber: 1, pageSize: 20 };
  paymentModel = {
    orderId: '',
    amount: 0,
    paymentMethod: 'Cash',
    status: 3,
    transactionReference: ''
  };
  returnModel = {
    orderId: '',
    reason: '',
    refundAmount: 0
  };
  loading = false;
  error = '';
  success = '';
  readonly money = money;
  readonly dateTime = dateTime;
  readonly enumLabel = enumLabel;
  readonly orderStatusOptions = orderStatusOptions;
  readonly paymentStatusOptions = paymentStatusOptions;
  readonly returnStatusOptions = returnStatusOptions;

  orderStatusClass(status: number): string {
    switch (status) {
      case 3: return 'good';
      case 1:
      case 2: return 'warn';
      case 4: return 'bad';
      default: return '';
    }
  }

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadPayments();
    this.loadReturns();
  }

  loadOrders(): void {
    this.loading = true;
    this.api.list<OrderDto>('/api/orders', this.orderQuery).subscribe({
      next: (result) => {
        this.orders = result.items;
        this.orderStatusDrafts = Object.fromEntries(result.items.map((order) => [order.id, order.status]));
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  loadPayments(): void {
    this.api.list<PaymentDto>('/api/payments', { pageNumber: 1, pageSize: 20 }).subscribe({
      next: (result) => this.payments = result.items,
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  loadReturns(): void {
    this.api.list<ReturnRequestDto>('/api/returns', { pageNumber: 1, pageSize: 20 }).subscribe({
      next: (result) => {
        this.returns = result.items;
        this.returnStatusDrafts = Object.fromEntries(result.items.map((request) => [request.id, request.status]));
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  updateOrderStatus(order: OrderDto): void {
    this.success = '';
    this.error = '';
    this.api.put<void>(`/api/orders/${order.id}/status`, null, { status: this.orderStatusDrafts[order.id] }).subscribe({
      next: () => {
        this.success = `Order ${order.orderNumber} status updated.`;
        this.loadOrders();
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  printOrder(order: OrderDto, format: 'a4' | '80mm' = 'a4'): void {
    this.error = '';
    const printWindow = openPrintWindow();

    this.api.post<BillDto>(`/api/billing/orders/${order.id}/ensure`, {}).subscribe({
      next: (bill) => openBillPrint(bill, printWindow, format),
      error: (err) => {
        closePrintWindow(printWindow);
        this.error = apiErrorMessage(err);
      }
    });
  }

  createPayment(): void {
    this.success = '';
    this.error = '';
    this.api.post<PaymentDto>('/api/payments', {
      ...this.paymentModel,
      transactionReference: this.paymentModel.transactionReference || null
    }).subscribe({
      next: (payment) => {
        this.success = `Payment ${payment.id} recorded.`;
        this.paymentModel = { orderId: '', amount: 0, paymentMethod: 'Cash', status: 3, transactionReference: '' };
        this.loadPayments();
        this.loadOrders();
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  loadInvoice(): void {
    if (!this.invoiceOrderId) {
      this.error = 'Enter an order id first.';
      return;
    }

    this.invoice = null;
    this.error = '';
    this.api.get<InvoiceDto>(`/api/invoices/${this.invoiceOrderId}`).subscribe({
      next: (invoice) => this.invoice = invoice,
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  createReturn(): void {
    this.success = '';
    this.error = '';
    this.api.post<ReturnRequestDto>('/api/returns', this.returnModel).subscribe({
      next: () => {
        this.success = 'Return request created.';
        this.returnModel = { orderId: '', reason: '', refundAmount: 0 };
        this.loadReturns();
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  updateReturnStatus(request: ReturnRequestDto): void {
    this.success = '';
    this.error = '';
    this.api.put<ReturnRequestDto>(`/api/returns/${request.id}/status`, { status: this.returnStatusDrafts[request.id] }).subscribe({
      next: () => {
        this.success = 'Return status updated.';
        this.loadReturns();
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }
}

function openPrintWindow(): Window | null {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write('<!doctype html><title>Preparing bill</title><p>Preparing bill...</p>');
    printWindow.document.close();
  }

  return printWindow;
}

function openBillPrint(bill: BillDto, printWindow: Window | null, format: 'a4' | '80mm' = 'a4'): void {
  const url = `/billing/${bill.id}/print?format=${format}`;
  if (printWindow && !printWindow.closed) {
    printWindow.location.href = url;
    return;
  }

  window.open(url, '_blank');
}

function closePrintWindow(printWindow: Window | null): void {
  if (printWindow && !printWindow.closed) {
    printWindow.close();
  }
}
