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
        <h2>Customer orders</h2>
        <p>View your order history, download invoices, and print bills from your account.</p>
      </div>
      <a class="btn primary" routerLink="/catalog">Shop catalog</a>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <div class="panel">
      <div class="panel-header">
        <strong>Recent orders</strong>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Total</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders; track order.id) {
              <tr>
                <td>{{ order.orderNumber }}</td>
                <td>{{ money(order.totalAmount) }}</td>
                <td>{{ dateTime(order.createdAtUtc) }}</td>
                <td>
                  <button class="btn ghost" type="button" (click)="printOrder(order)">Print bill</button>
                </td>
              </tr>
            } @empty {
              @if (history.length > 0) {
                @for (order of history; track order.id) {
                  <tr>
                    <td>{{ order.orderNumber }}</td>
                    <td>{{ money(order.totalAmount) }}</td>
                    <td>{{ dateTime(order.createdAtUtc) }}</td>
                    <td><span class="muted">Local copy</span></td>
                  </tr>
                }
              } @else {
                <tr>
                  <td colspan="4"><div class="empty-state">No orders yet. Place an order from the catalog.</div></td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid two" style="margin-top: 24px;">
      <section class="panel">
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
              Invoice {{ invoice.invoiceNumber }} issued {{ dateTime(invoice.issuedAtUtc) }}.
            </div>
          }
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <strong>Request a return</strong>
        </div>
        <div class="panel-body grid">
          <label class="field">
            <span>Order ID</span>
            <input class="input" name="returnOrderId" [(ngModel)]="returnModel.orderId" required>
          </label>
          <label class="field">
            <span>Reason</span>
            <textarea class="textarea" name="reason" [(ngModel)]="returnModel.reason" required></textarea>
          </label>
          <label class="field">
            <span>Refund amount</span>
            <input class="input" type="number" min="0" step="0.01" name="refundAmount" [(ngModel)]="returnModel.refundAmount">
          </label>
          <button class="btn primary" type="button" (click)="createReturn()">Submit return</button>
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
