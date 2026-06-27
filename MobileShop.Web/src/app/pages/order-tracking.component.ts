import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { OrderDto, OrderStatus, BillDto } from '../core/api.models';
import { money } from '../core/formatters';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Order Tracking</h2>
        <p>Monitor your orders from confirmation to delivery</p>
      </div>
      <div class="toolbar-right">
        <button class="btn ghost" (click)="load()">Refresh</button>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    <div class="panel" [class.loading]="loading">
      @if (orders.length === 0) {
        <div class="empty-state">No orders to track. <a routerLink="/catalog">Start shopping</a></div>
      } @else {
        <div style="display: grid; gap: 16px;">
          @for (order of orders; track order.id) {
            <div style="border: 1px solid var(--line); border-radius: var(--radius); padding: 16px;">
              <!-- Order Header -->
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <div>
                  <h3 style="margin: 0 0 4px; font-size: 1rem;">Order {{ order.orderNumber }}</h3>
                  <p class="muted" style="margin: 0; font-size: 0.85rem;">
                    {{ order.createdAtUtc | date: 'medium' }}
                  </p>
                </div>
                <span [class]="'badge ' + getStatusClass(order.status)">
                  {{ getStatusLabel(order.status) }}
                </span>
              </div>

              <!-- Order Details -->
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--line);">
                <div>
                  <p class="muted" style="margin: 0 0 4px; font-size: 0.85rem;">Customer</p>
                  <strong>{{ order.customerName }}</strong>
                </div>
                <div>
                  <p class="muted" style="margin: 0 0 4px; font-size: 0.85rem;">Order Total</p>
                  <strong>{{ money(order.totalAmount) }}</strong>
                </div>
                <div>
                  <p class="muted" style="margin: 0 0 4px; font-size: 0.85rem;">Payment Status</p>
                  <strong>{{ money(order.paidAmount) }} / {{ money(order.totalAmount) }}</strong>
                </div>
              </div>

              <!-- Order Timeline -->
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                  @for (step of getStatusSteps(); track step.status) {
                    <div style="display: flex; align-items: center;">
                      <div [style.width]="'20px'" [style.height]="'20px'" 
                        [style.background]="isStatusComplete(order.status, step.status) ? 'var(--primary)' : 'var(--line)'"
                        [style.border-radius]="'50%'"
                        style="display: flex; align-items: center; justify-content: center;">
                        @if (isStatusComplete(order.status, step.status)) {
                          <span style="color: white; font-size: 0.9rem;">✓</span>
                        }
                      </div>
                      @if (step.status !== 6) {
                        <div [style.height]="'30px'" 
                          [style.width]="'2px'"
                          [style.background]="isStatusComplete(order.status, step.status) ? 'var(--primary)' : 'var(--line)'"
                          style="margin: 4px 0;"></div>
                      }
                    </div>
                  }
                </div>
                <div style="padding: 2px 0;">
                  @for (step of getStatusSteps(); track step.status) {
                    <div style="padding: 8px 0; margin-bottom: 12px;">
                      <p style="margin: 0; font-weight: 600; font-size: 0.9rem;">
                        {{ step.label }}
                      </p>
                      <p style="margin: 0; color: var(--muted); font-size: 0.85rem;">
                        @if (isStatusComplete(order.status, step.status)) {
                          Completed
                        } @else {
                          Pending
                        }
                      </p>
                    </div>
                  }
                </div>
              </div>

              <!-- Actions -->
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="btn ghost">View Details</button>
                <button class="btn ghost" (click)="downloadInvoice(order)">Download Invoice</button>
                <button class="btn" (click)="printOrder(order)">Print</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class OrderTrackingComponent implements OnInit {
  orders: OrderDto[] = [];
  loading = false;
  error = '';
  success = '';
  readonly money = money;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';

    this.api.list<OrderDto>('/api/orders', { pageNumber: 1, pageSize: 20 }).subscribe({
      next: (response) => {
        this.orders = response.items;
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });
  }

  getStatusSteps() {
    return [
      { status: 2, label: 'Order Placed' },
      { status: 3, label: 'Confirmed' },
      { status: 4, label: 'Packed' },
      { status: 5, label: 'Shipped' },
      { status: 6, label: 'Delivered' }
    ];
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [1]: 'Draft',
      [2]: 'Pending',
      [3]: 'Confirmed',
      [4]: 'Packed',
      [5]: 'Shipped',
      [6]: 'Delivered',
      [7]: 'Cancelled',
      [8]: 'Returned'
    };
    return labels[status] || 'Unknown';
  }

  getStatusClass(status: OrderStatus): string {
    if ([6].includes(status)) return 'good';
    if ([7, 8].includes(status)) return 'bad';
    if ([5].includes(status)) return 'warn';
    return '';
  }

  isStatusComplete(orderStatus: OrderStatus, stepStatus: number): boolean {
    return orderStatus >= stepStatus;
  }

  downloadInvoice(order: OrderDto): void {
    this.error = '';
    this.api.get(`/api/invoices/${order.id}`).subscribe({
      next: () => {
        this.success = `Invoice lookup requested for order ${order.orderNumber}.`;
      },
      error: (err) => {
        this.error = apiErrorMessage(err);
      }
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
