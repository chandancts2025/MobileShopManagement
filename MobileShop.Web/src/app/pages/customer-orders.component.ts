import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { OrderDto, InvoiceDto, ReturnRequestDto, BillDto } from '../core/api.models';
import { dateTime, money } from '../core/formatters';
import { LocalOrderHistoryItem, readOrderHistory } from './cart.component';

@Component({
  selector: 'app-customer-orders',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>
          My Purchase Orders & Receipts
          <span class="badge" style="margin-left: 8px; font-size: 0.78rem;">{{ orders.length || history.length }} orders</span>
        </h2>
        <p>Review completed handset purchases, download official GST tax invoices, and reprint 80mm POS thermal slips.</p>
      </div>
      <a class="btn primary" routerLink="/catalog">🛍️ Shop Catalog</a>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <div class="panel" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
      <div class="panel-header" style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
        <div>
          <strong style="font-size: 1rem; color: #0f172a;">📦 Order History</strong>
          <p style="margin: 2px 0 0; font-size: 0.78rem; color: #64748b;">Your previous retail transactions and online orders</p>
        </div>
        <button class="btn ghost" type="button" (click)="loadOrders()">🔄 Refresh</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Total Billed</th>
              <th>Date & Time</th>
              <th style="text-align: right; min-width: 140px;">Tax Invoices & Slips</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders; track order.id) {
              <tr>
                <td>
                  <span class="code-pill">#{{ order.orderNumber }}</span>
                </td>
                <td>
                  <strong class="cell-price">{{ money(order.totalAmount) }}</strong>
                </td>
                <td style="font-size: 0.84rem; color: #475569;">{{ dateTime(order.createdAtUtc) }}</td>
                <td style="text-align: right;">
                  <button class="btn ghost" type="button" style="padding: 4px 10px; font-size: 0.8rem; background: #e0f2fe; color: #0369a1; border-color: #bae6fd;" (click)="printOrder(order)" title="Print Tax Invoice / Bill">
                    🧾 View / Print Bill
                  </button>
                </td>
              </tr>
            } @empty {
              @if (history.length > 0) {
                @for (order of history; track order.id) {
                  <tr>
                    <td>
                      <span class="code-pill">#{{ order.orderNumber }}</span>
                    </td>
                    <td>
                      <strong class="cell-price">{{ money(order.totalAmount) }}</strong>
                    </td>
                    <td style="font-size: 0.84rem; color: #475569;">{{ dateTime(order.createdAtUtc) }}</td>
                    <td style="text-align: right;">
                      <span class="cell-chip">Saved in browser session</span>
                    </td>
                  </tr>
                }
              } @else {
                <tr>
                  <td colspan="4">
                    <div class="empty-state">
                      <div style="font-size: 2.2rem; margin-bottom: 8px;">🛍️</div>
                      <strong>No orders yet</strong>
                      <p>Browse our catalog of smartphones and genuine accessories to place your first order.</p>
                      <a class="btn primary" routerLink="/catalog" style="margin-top: 12px; display: inline-flex;">
                        Browse Smartphones
                      </a>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid two" style="margin-top: 24px;">
      <section class="panel panel-accent" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
        <div class="panel-header" style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <div>
            <strong style="font-size: 1rem; color: #0f172a;">🔍 Instant Invoice Lookup</strong>
            <p style="margin: 2px 0 0; font-size: 0.78rem; color: #64748b;">Verify invoice authenticity and GST compliance</p>
          </div>
        </div>
        <div class="panel-body grid" style="padding: 20px;">
          <label class="field">
            <span>Order ID / Reference <span class="required-star">*</span></span>
            <input class="input" name="invoiceOrderId" [(ngModel)]="invoiceOrderId" placeholder="Paste your Order ID or UUID">
          </label>
          <button class="btn primary" type="button" (click)="loadInvoice()" [disabled]="!invoiceOrderId">
            🔍 Check Invoice
          </button>
          @if (invoice) {
            <div class="message success" style="margin-top: 8px;">
              ✓ Invoice <strong>#{{ invoice.invoiceNumber }}</strong> issued on {{ dateTime(invoice.issuedAtUtc) }}.
            </div>
          }
        </div>
      </section>

      <section class="panel panel-accent" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
        <div class="panel-header" style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <div>
            <strong style="font-size: 1rem; color: #0f172a;">↩️ Request Return / Exchange</strong>
            <p style="margin: 2px 0 0; font-size: 0.78rem; color: #64748b;">Hassle-free return request for qualifying items</p>
          </div>
        </div>
        <div class="panel-body grid" style="padding: 20px;">
          <div class="grid two">
            <label class="field">
              <span>Order ID <span class="required-star">*</span></span>
              <input class="input" name="returnOrderId" [(ngModel)]="returnModel.orderId" placeholder="Order ID" required>
            </label>
            <label class="field">
              <span>Refund Amount (₹)</span>
              <input class="input" type="number" min="0" step="0.01" name="refundAmount" [(ngModel)]="returnModel.refundAmount" placeholder="0.00">
            </label>
          </div>
          <label class="field">
            <span>Return Reason <span class="required-star">*</span></span>
            <textarea class="textarea" name="reason" [(ngModel)]="returnModel.reason" placeholder="Please describe why you are requesting a return or exchange..." required></textarea>
          </label>
          <button class="btn primary" type="button" (click)="createReturn()" [disabled]="!returnModel.orderId || !returnModel.reason">
            Submit Return Request
          </button>
        </div>
      </section>
    </div>
  `
})
export class CustomerOrdersComponent implements OnInit {
  orders: OrderDto[] = [];
  history: LocalOrderHistoryItem[] = readOrderHistory();
  invoiceOrderId = '';
  invoice: InvoiceDto | null = null;
  returnModel = {
    orderId: '',
    reason: '',
    refundAmount: 0
  };
  error = '';
  success = '';
  readonly money = money;
  readonly dateTime = dateTime;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.error = '';
    this.api.list<OrderDto>('/api/orders', { pageNumber: 1, pageSize: 20 }).subscribe({
      next: (result) => {
        this.orders = result.items;
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.orders = [];
      }
    });
  }

  loadInvoice(): void {
    if (!this.invoiceOrderId) {
      this.error = 'Enter an order id first.';
      return;
    }

    this.error = '';
    this.invoice = null;
    this.api.get<InvoiceDto>(`/api/invoices/${this.invoiceOrderId}`).subscribe({
      next: (invoice) => this.invoice = invoice,
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  printOrder(order: OrderDto): void {
    this.error = '';
    this.success = '';
    const printWindow = openPrintWindow();

    this.api.post<BillDto>(`/api/billing/orders/${order.id}/ensure`, {}).subscribe({
      next: (bill) => {
        openBillPrint(bill, printWindow);
        this.success = `Opening bill ${bill.billNumber} for print.`;
      },
      error: (error) => {
        closePrintWindow(printWindow);
        this.error = apiErrorMessage(error);
      }
    });
  }

  createReturn(): void {
    this.error = '';
    this.success = '';
    this.api.post<ReturnRequestDto>('/api/returns', this.returnModel).subscribe({
      next: (result) => {
        this.success = `Return request ${result.id} was submitted.`;
        this.returnModel = { orderId: '', reason: '', refundAmount: 0 };
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
