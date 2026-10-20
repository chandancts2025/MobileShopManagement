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
      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <button class="btn" type="button" (click)="toggleTopForm('payment')">
          {{ activeTopForm === 'payment' ? '✕ Close Payment' : '💳 + Record Payment' }}
        </button>
        <button class="btn" type="button" (click)="toggleTopForm('return')">
          {{ activeTopForm === 'return' ? '✕ Close Return' : '↩️ Customer Return' }}
        </button>
        <a class="btn primary" routerLink="/cart">🛒 + New Sale from Cart</a>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <!-- Top-Expandable Record Payment Form -->
    @if (activeTopForm === 'payment') {
      <section class="top-form-card">
        <div class="top-form-header">
          <div class="top-form-title">
            <span class="badge good">+ PAYMENT SETTLEMENT</span>
            <h3>💳 Record Order Payment</h3>
          </div>
          <button class="btn ghost" type="button" (click)="closeTopForm()" title="Collapse form">✕ Close</button>
        </div>
        <div class="top-form-body">
          <div class="grid two">
            <label class="field">
              <span>Select Target Order <span class="required-star">*</span></span>
              <select class="select" name="paymentOrderId" [(ngModel)]="paymentModel.orderId" required>
                <option [ngValue]="''">-- Select order to settle --</option>
                @for (order of orders; track order.id) {
                  <option [ngValue]="order.id">#{{ order.orderNumber }} — {{ order.customerName || 'Counter sale' }} (Total: {{ money(order.totalAmount) }} | Due: {{ money(order.balanceAmount) }})</option>
                }
              </select>
            </label>
            <label class="field">
              <span>Payment Amount (₹) <span class="required-star">*</span></span>
              <input class="input" type="number" min="0.01" step="0.01" name="paymentAmount" [(ngModel)]="paymentModel.amount" placeholder="0.00" required>
            </label>
          </div>
          <div class="grid three" style="margin-top: 10px;">
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
              <span>Payment Status</span>
              <select class="select" name="paymentStatus" [(ngModel)]="paymentModel.status">
                @for (status of paymentStatusOptions; track status.value) {
                  <option [ngValue]="status.value">{{ status.label }}</option>
                }
              </select>
            </label>
            <label class="field">
              <span>Reference / UTR #</span>
              <input class="input" name="transactionReference" [(ngModel)]="paymentModel.transactionReference" placeholder="e.g. UPI-1234567890">
            </label>
          </div>
          <div class="top-form-footer">
            <button class="btn ghost" type="button" (click)="closeTopForm()">Cancel</button>
            <button class="btn primary" type="button" (click)="createPayment()" [disabled]="!paymentModel.orderId || paymentModel.amount <= 0">
              ✓ Save Payment Record
            </button>
          </div>
        </div>
      </section>
    }

    <!-- Top-Expandable Customer Return Form -->
    @if (activeTopForm === 'return') {
      <section class="top-form-card">
        <div class="top-form-header">
          <div class="top-form-title">
            <span class="badge warn">RETURN & REFUND</span>
            <h3>↩️ Process Customer Return</h3>
          </div>
          <button class="btn ghost" type="button" (click)="closeTopForm()" title="Collapse form">✕ Close</button>
        </div>
        <div class="top-form-body">
          <div class="grid two">
            <label class="field">
              <span>Select Order / Order ID <span class="required-star">*</span></span>
              <select class="select" name="returnOrderId" [(ngModel)]="returnModel.orderId">
                <option [ngValue]="''">-- Select order for return --</option>
                @for (order of orders; track order.id) {
                  <option [ngValue]="order.id">#{{ order.orderNumber }} — {{ order.customerName || 'Counter sale' }} (Total: {{ money(order.totalAmount) }})</option>
                }
              </select>
            </label>
            <label class="field">
              <span>Refund Amount (₹) <span class="required-star">*</span></span>
              <input class="input" type="number" min="0" step="0.01" name="refundAmount" [(ngModel)]="returnModel.refundAmount" placeholder="0.00">
            </label>
          </div>
          <label class="field" style="margin-top: 10px;">
            <span>Return Reason & Inspection Notes <span class="required-star">*</span></span>
            <textarea class="textarea" rows="2" name="returnReason" [(ngModel)]="returnModel.reason" placeholder="e.g. Unopened box / sealed handset returned within policy window"></textarea>
          </label>
          <div class="top-form-footer">
            <button class="btn ghost" type="button" (click)="closeTopForm()">Cancel</button>
            <button class="btn primary" type="button" (click)="createReturn()" [disabled]="!returnModel.orderId">
              Submit Return Request
            </button>
          </div>
        </div>
      </section>
    }

    <!-- Full-Width Orders List Table -->
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
        <table style="width: 100%;">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Total Amount</th>
              <th>Paid</th>
              <th>Balance Due</th>
              <th>Status</th>
              <th>Date Created</th>
              <th class="actions">Actions & Print</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders; track order.id) {
              <tr [class.active-row]="(paymentModel.orderId === order.id && activeTopForm === 'payment') || (returnModel.orderId === order.id && activeTopForm === 'return')">
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
                <td class="actions">
                  <div style="display: inline-flex; gap: 4px; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
                    <button class="btn" type="button" style="padding: 4px 8px; font-size: 0.78rem;" (click)="printOrder(order, 'a4')" title="Print Standard A4 Tax Invoice">📄 A4</button>
                    <button class="btn ghost" type="button" style="padding: 4px 8px; font-size: 0.78rem; background: #e0f2fe; color: #0369a1; border-color: #bae6fd;" (click)="printOrder(order, '80mm')" title="Print 80mm POS Thermal Slip">🧾 80mm</button>
                    @if (order.balanceAmount > 0) {
                      <button class="btn ghost" type="button" style="padding: 4px 8px; font-size: 0.78rem; color: #0d7a5f; border-color: #a7f3d0; background: #ecfdf5;" (click)="openPaymentForOrder(order)" title="Record payment settlement">💳 Settle</button>
                    }
                    <button class="btn ghost" type="button" style="padding: 4px 8px; font-size: 0.78rem;" (click)="openReturnForOrder(order)" title="Process return">↩️</button>
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
  `
})
export class SalesComponent implements OnInit {
  orders: OrderDto[] = [];
  payments: PaymentDto[] = [];
  returns: ReturnRequestDto[] = [];
  invoice: InvoiceDto | null = null;
  invoiceOrderId = '';
  activeTopForm: 'payment' | 'return' | null = null;
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

  toggleTopForm(form: 'payment' | 'return'): void {
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

  openPaymentForOrder(order: OrderDto): void {
    this.paymentModel.orderId = order.id;
    this.paymentModel.amount = order.balanceAmount > 0 ? order.balanceAmount : order.totalAmount;
    this.activeTopForm = 'payment';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openReturnForOrder(order: OrderDto): void {
    this.returnModel.orderId = order.id;
    this.returnModel.refundAmount = order.paidAmount > 0 ? order.paidAmount : order.totalAmount;
    this.activeTopForm = 'return';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
        this.closeTopForm();
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
        this.closeTopForm();
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
