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
        <h2>Sales and orders</h2>
        <p>Staff order history, payment capture, invoice lookup, and return processing.</p>
      </div>
      <a class="btn primary" routerLink="/cart">Create sale from cart</a>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <section class="panel" [class.loading]="loading">
      <div class="panel-header toolbar">
        <div class="toolbar-left">
          <input class="input" style="width: min(360px, 100%);" name="orderSearch" [(ngModel)]="orderQuery.search" (keyup.enter)="loadOrders()" placeholder="Search orders or customers">
          <button class="btn" type="button" (click)="loadOrders()">Search</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Created</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders; track order.id) {
              <tr>
                <td>{{ order.orderNumber }}</td>
                <td>{{ order.customerName || 'Counter sale' }}</td>
                <td>{{ money(order.totalAmount) }}</td>
                <td>{{ money(order.paidAmount) }}</td>
                <td>{{ money(order.balanceAmount) }}</td>
                <td><span class="badge">{{ enumLabel(orderStatusOptions, order.status) }}</span></td>
                <td>{{ dateTime(order.createdAtUtc) }}</td>
                <td>
                  <select class="select" style="min-width: 150px;" [name]="'status' + order.id" [(ngModel)]="orderStatusDrafts[order.id]">
                    @for (status of orderStatusOptions; track status.value) {
                      <option [ngValue]="status.value">{{ status.label }}</option>
                    }
                  </select>
                  <div style="display:flex; gap:8px; margin-top:8px;">
                    <button class="btn" type="button" (click)="printOrder(order)">Print</button>
                    <button class="btn ghost" type="button" (click)="updateOrderStatus(order)">Save</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8"><div class="empty-state">No orders found.</div></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid two" style="margin-top: 16px;">
      <div class="panel">
        <div class="panel-header">
          <strong>Record payment</strong>
          <button class="btn ghost" type="button" (click)="loadPayments()">Refresh payments</button>
        </div>
        <div class="panel-body grid">
          <label class="field">
            <span>Order</span>
            <select class="select" name="paymentOrderId" [(ngModel)]="paymentModel.orderId" required>
              <option [ngValue]="''">Select order</option>
              @for (order of orders; track order.id) {
                <option [ngValue]="order.id">{{ order.orderNumber }} — {{ order.customerName || 'Counter sale' }}</option>
              }
            </select>
          </label>
          <div class="grid two">
            <label class="field">
              <span>Amount</span>
              <input class="input" type="number" min="0.01" step="0.01" name="paymentAmount" [(ngModel)]="paymentModel.amount" required>
            </label>
            <label class="field">
              <span>Status</span>
              <select class="select" name="paymentStatus" [(ngModel)]="paymentModel.status">
                @for (status of paymentStatusOptions; track status.value) {
                  <option [ngValue]="status.value">{{ status.label }}</option>
                }
              </select>
            </label>
          </div>
          <div class="grid two">
            <label class="field">
              <span>Payment method</span>
              <select class="select" name="paymentMethod" [(ngModel)]="paymentModel.paymentMethod">
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label class="field">
              <span>Reference</span>
              <input class="input" name="transactionReference" [(ngModel)]="paymentModel.transactionReference">
            </label>
          </div>
          <button class="btn primary" type="button" (click)="createPayment()">Save payment</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <strong>Invoice lookup</strong>
        </div>
        <div class="panel-body grid">
          <label class="field">
            <span>Order ID</span>
            <input class="input" name="invoiceOrderId" [(ngModel)]="invoiceOrderId">
          </label>
          <button class="btn" type="button" (click)="loadInvoice()">Load invoice</button>
          @if (invoice) {
            <div class="message success">
              Invoice {{ invoice.invoiceNumber }} for order {{ invoice.orderId }} issued {{ dateTime(invoice.issuedAtUtc) }}.
            </div>
          }
        </div>
      </div>
    </section>

    <section class="grid two" style="margin-top: 16px;">
      <div class="panel">
        <div class="panel-header">
          <strong>Recent payments</strong>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (payment of payments; track payment.id) {
                <tr>
                  <td>{{ payment.orderId }}</td>
                  <td>{{ money(payment.amount) }}</td>
                  <td>{{ payment.paymentMethod }}</td>
                  <td>{{ enumLabel(paymentStatusOptions, payment.status) }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4"><div class="empty-state">No payments found.</div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <strong>Returns</strong>
          <button class="btn ghost" type="button" (click)="loadReturns()">Refresh</button>
        </div>
        <div class="panel-body grid">
          <div class="grid two">
            <label class="field">
              <span>Order ID</span>
              <input class="input" name="returnOrderId" [(ngModel)]="returnModel.orderId">
            </label>
            <label class="field">
              <span>Refund amount</span>
              <input class="input" type="number" min="0" step="0.01" name="refundAmount" [(ngModel)]="returnModel.refundAmount">
            </label>
          </div>
          <label class="field">
            <span>Reason</span>
            <textarea class="textarea" name="returnReason" [(ngModel)]="returnModel.reason"></textarea>
          </label>
          <button class="btn primary" type="button" (click)="createReturn()">Create return</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Refund</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              @for (request of returns; track request.id) {
                <tr>
                  <td>{{ request.orderId }}</td>
                  <td>{{ money(request.refundAmount) }}</td>
                  <td>{{ enumLabel(returnStatusOptions, request.status) }}</td>
                  <td>
                    <select class="select" [name]="'returnStatus' + request.id" [(ngModel)]="returnStatusDrafts[request.id]">
                      @for (status of returnStatusOptions; track status.value) {
                        <option [ngValue]="status.value">{{ status.label }}</option>
                      }
                    </select>
                    <button class="btn ghost" type="button" style="margin-top: 8px;" (click)="updateReturnStatus(request)">Save</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4"><div class="empty-state">No returns found.</div></td>
                </tr>
              }
            </tbody>
          </table>
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

  printOrder(order: OrderDto): void {
    this.error = '';
    const printWindow = openPrintWindow();

    this.api.post<BillDto>(`/api/billing/orders/${order.id}/ensure`, {}).subscribe({
      next: (bill) => openBillPrint(bill, printWindow),
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

function openBillPrint(bill: BillDto, printWindow: Window | null): void {
  const url = `/billing/${bill.id}/print`;
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
