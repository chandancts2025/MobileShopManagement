import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CartItem, CartService } from '../core/cart.service';
import { CustomerDto, OrderDto, BillDto } from '../core/api.models';
import { money } from '../core/formatters';

const ORDER_HISTORY_KEY = 'mobile-shop-order-history';

export interface LocalOrderHistoryItem {
  id: string;
  orderNumber: string;
  totalAmount: number;
  createdAtUtc: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Cart and checkout</h2>
        <p>Create orders through POST /api/orders. Staff can select a customer profile; customer self-checkout requires the profile id expected by the API.</p>
      </div>
      <a class="btn" routerLink="/catalog">Continue shopping</a>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <div class="split">
      <section class="panel">
        <div class="panel-header">
          <strong>{{ cart.count() }} items</strong>
          @if (cart.items().length > 0) {
            <button class="btn danger" type="button" (click)="cart.clear()">Clear</button>
          }
        </div>
        <div class="panel-body">
          @for (item of cart.items(); track item.productId) {
            <div class="cart-line">
              <div>
                <strong>{{ item.name }}</strong>
                <p class="muted" style="margin: 3px 0 0;">{{ item.sku }} - {{ money(item.price) }}</p>
              </div>
              <label class="field">
                <span>Qty</span>
                <input class="input" type="number" min="1" [max]="item.quantityOnHand" [name]="'qty' + item.productId" [ngModel]="item.quantity" (ngModelChange)="updateQuantity(item, $event)">
              </label>
              <button class="btn danger" type="button" (click)="cart.remove(item.productId)">Remove</button>
            </div>
          } @empty {
            <div class="empty-state">Your cart is empty.</div>
          }
        </div>
      </section>

      <aside class="panel">
        <div class="panel-header">
          <strong>Checkout</strong>
        </div>
        <div class="panel-body grid">
          <div class="grid">
            <div class="toolbar">
              <span class="muted">Subtotal</span>
              <strong>{{ money(cart.subtotal()) }}</strong>
            </div>
            <div class="toolbar">
              <span class="muted">Tax</span>
              <strong>{{ money(cart.tax()) }}</strong>
            </div>
            <div class="toolbar">
              <span class="muted">Discount</span>
              <strong>{{ money(cart.discount()) }}</strong>
            </div>
            <div class="toolbar">
              <span>Total</span>
              <strong>{{ money(cart.total()) }}</strong>
            </div>
          </div>

          @if (!auth.isAuthenticated()) {
            <div class="message">
              Sign in before checkout. Customers can place orders; staff can place counter sales.
            </div>
            <a class="btn primary" routerLink="/login" [queryParams]="{ returnUrl: '/cart' }">Sign in</a>
          } @else {
            @if (auth.hasAtLeastStaffRole()) {
              <label class="field">
                <span>Customer</span>
                <select class="select" name="customerProfileId" [(ngModel)]="customerProfileId" required>
                  <option value="">Select customer</option>
                  @for (customer of customers; track customer.id) {
                    <option [value]="customer.id">{{ customer.fullName }} - {{ customer.phoneNumber }}</option>
                  }
                </select>
              </label>
              <a class="btn ghost" routerLink="/admin/customers">Create customer</a>
            } @else {
              <div class="message">
                Your customer profile is automatically mapped from your account.
              </div>
            }

            <label class="field">
              <span>Promo code</span>
              <input class="input" name="promoCode" [(ngModel)]="promoCode" placeholder="Optional">
            </label>

            <button class="btn primary" type="button" (click)="checkout()" [disabled]="loading || cart.items().length === 0">
              {{ loading ? 'Placing order...' : 'Place order' }}
            </button>
          }
        </div>
      </aside>
    </div>
  `
})
export class CartComponent implements OnInit {
  customers: CustomerDto[] = [];
  customerProfileId = '';
  promoCode = '';
  loading = false;
  error = '';
  success = '';
  readonly money = money;

  constructor(
    readonly cart: CartService,
    readonly auth: AuthService,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    if (this.auth.hasAtLeastStaffRole()) {
      this.api.list<CustomerDto>('/api/customers', { pageNumber: 1, pageSize: 100 }).subscribe({
        next: (result) => this.customers = result.items,
        error: (error) => this.error = apiErrorMessage(error)
      });
    }
  }

  updateQuantity(item: CartItem, value: number): void {
    this.cart.updateQuantity(item.productId, Number(value));
  }

  checkout(): void {
    if (!this.auth.isAuthenticated()) {
      this.error = 'Please sign in before checkout.';
      return;
    }

    if (this.auth.hasAtLeastStaffRole() && !this.customerProfileId) {
      this.error = 'Choose a customer before placing the order.';
      return;
    }

    const payload: any = {
      customerProfileId: this.auth.hasAtLeastStaffRole() ? this.customerProfileId : null,
      promoCode: this.promoCode || null,
      items: this.cart.items().map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    const printWindow = openPrintWindow();
    this.loading = true;
    this.error = '';
    this.success = '';
    this.api.post<OrderDto>('/api/orders', payload).subscribe({
      next: (order) => {
        saveOrderHistory(order);
        this.cart.clear();
        this.customerProfileId = '';
        this.promoCode = '';
        this.success = `Order ${order.orderNumber} was placed for ${money(order.totalAmount)}.`;
        this.openBillForOrder(order, printWindow);
      },
      error: (error) => {
        closePrintWindow(printWindow);
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  private openBillForOrder(order: OrderDto, printWindow: Window | null): void {
    this.api.post<BillDto>(`/api/billing/orders/${order.id}/ensure`, {}).subscribe({
      next: (bill) => openBillPrint(bill, printWindow),
      error: (error) => {
        closePrintWindow(printWindow);
        this.error = `Order ${order.orderNumber} was placed, but the bill could not be opened: ${apiErrorMessage(error)}`;
      }
    });
  }
}

export function readOrderHistory(): LocalOrderHistoryItem[] {
  const raw = localStorage.getItem(ORDER_HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value as LocalOrderHistoryItem[] : [];
  } catch {
    localStorage.removeItem(ORDER_HISTORY_KEY);
    return [];
  }
}

function saveOrderHistory(order: OrderDto): void {
  const current = readOrderHistory();
  const next = [
    {
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      createdAtUtc: order.createdAtUtc
    },
    ...current.filter((item) => item.id !== order.id)
  ].slice(0, 20);
  localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(next));
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
