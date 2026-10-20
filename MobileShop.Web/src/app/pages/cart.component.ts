import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CartItem, CartService } from '../core/cart.service';
import { CustomerDto, OrderDto, BillDto, PromoCodeDto } from '../core/api.models';
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
      <section class="panel panel-accent" style="border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
        <div class="panel-header" style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <div>
            <strong style="font-size: 1rem; color: #0f172a;">🛒 Shopping Bag ({{ cart.count() }} items)</strong>
            <p style="margin: 2px 0 0; font-size: 0.78rem; color: #64748b;">Review quantities before proceeding to checkout</p>
          </div>
          @if (cart.items().length > 0) {
            <button class="btn danger" type="button" (click)="cart.clear()" style="padding: 4px 10px; font-size: 0.8rem;">Clear All</button>
          }
        </div>
        <div class="panel-body" style="padding: 16px;">
          @for (item of cart.items(); track item.productId) {
            <div class="cart-line" style="display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; margin-bottom: 10px; background: #ffffff; transition: box-shadow 0.15s ease;">
              <div style="flex: 1; min-width: 0;">
                <strong style="display: block; font-size: 0.95rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.name }}</strong>
                <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px; flex-wrap: wrap;">
                  <span class="code-pill">{{ item.sku }}</span>
                  <span class="cell-price" style="color: #0d7a5f;">{{ money(item.price) }} / unit</span>
                  @if (item.quantity > 1) {
                    <span style="font-size: 0.8rem; font-weight: 700; color: #334155;">= {{ money(item.price * item.quantity) }}</span>
                  }
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <label class="field" style="margin: 0; min-width: 70px;">
                  <input class="input" type="number" min="1" [max]="item.quantityOnHand" [name]="'qty' + item.productId" [ngModel]="item.quantity" (ngModelChange)="updateQuantity(item, $event)" style="min-height: 36px; padding: 4px 8px; text-align: center; font-weight: 700;">
                </label>
                <button class="btn danger" type="button" (click)="cart.remove(item.productId)" style="padding: 6px 10px; min-height: 36px;" title="Remove from cart">🗑️</button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <div style="font-size: 2.4rem; margin-bottom: 8px;">🛍️</div>
              <strong>Your shopping cart is empty</strong>
              <p>Explore our latest smartphones, flagship models, and premium accessories.</p>
              <a class="btn primary" routerLink="/catalog" style="margin-top: 14px; display: inline-flex;">
                Browse Smartphones & Accessories
              </a>
            </div>
          }
        </div>
      </section>

      <aside class="panel">
        <div class="panel-header">
          <strong>Checkout</strong>
        </div>
        <div class="panel-body grid">
          <div class="grid summary-box">
            <div class="toolbar">
              <span class="muted">Gross Items Subtotal</span>
              <strong>{{ money(cart.subtotal()) }}</strong>
            </div>
            @if (cart.itemDiscount() > 0) {
              <div class="toolbar discount-row">
                <span class="discount-label">Product Discounts</span>
                <strong class="discount-val">-{{ money(cart.itemDiscount()) }}</strong>
              </div>
            }
            @if (cart.promoDiscount() > 0) {
              <div class="toolbar promo-row">
                <span class="promo-label">🏷️ Promo ({{ cart.appliedPromo()?.code }})</span>
                <strong class="promo-val">-{{ money(cart.promoDiscount()) }}</strong>
              </div>
            }
            <div class="toolbar taxable-row">
              <span class="taxable-label">Net Taxable Value</span>
              <strong class="taxable-val">{{ money(cart.taxableValue()) }}</strong>
            </div>
            <div class="toolbar tax-breakup-row">
              <span class="muted">Central GST (CGST &#64; 9.0%)</span>
              <strong class="tax-val">+{{ money(cart.cgst()) }}</strong>
            </div>
            <div class="toolbar tax-breakup-row">
              <span class="muted">State GST (SGST &#64; 9.0%)</span>
              <strong class="tax-val">+{{ money(cart.sgst()) }}</strong>
            </div>
            <div class="toolbar total-toolbar">
              <span class="total-title">Total Amount Payable</span>
              <strong class="total-amount">{{ money(cart.total()) }}</strong>
            </div>
          </div>

          <!-- Promo Code Interactive Box -->
          <div class="promo-box">
            <div class="promo-header">
              <span>🏷️ APPLY PROMO / COUPON</span>
            </div>
            @if (cart.appliedPromo()) {
              <div class="applied-badge">
                <div class="applied-info">
                  <strong>✓ {{ cart.appliedPromo()?.code }} Applied</strong>
                  <span class="saved-amt">You save {{ money(cart.promoDiscount()) }}!</span>
                </div>
                <button type="button" class="btn-remove-promo" (click)="removePromo()" title="Remove coupon">✕ Remove</button>
              </div>
            } @else {
              <div class="promo-input-row">
                <input
                  class="input promo-input"
                  name="promoCodeInput"
                  [(ngModel)]="promoInput"
                  placeholder="Enter Promo Code"
                  (keyup.enter)="applyPromoCode()"
                  style="text-transform: uppercase;"
                />
                <button
                  type="button"
                  class="btn-apply-promo"
                  [disabled]="validatingPromo || !promoInput.trim()"
                  (click)="applyPromoCode()"
                >
                  {{ validatingPromo ? 'Checking...' : 'Apply' }}
                </button>
              </div>
              @if (promoError) {
                <div class="promo-error">{{ promoError }}</div>
              }
              @if (promoSuccess) {
                <div class="promo-success-msg">{{ promoSuccess }}</div>
              }

              <!-- Active Available Offers Chips -->
              @if (activePromos.length > 0) {
                <div class="offers-list">
                  <div class="offers-title">Available Store Coupons:</div>
                  <div class="offers-chips">
                    @for (promo of activePromos; track promo.id) {
                      <button
                        type="button"
                        class="offer-chip"
                        (click)="selectPromo(promo.code)"
                        [title]="'Click to apply ' + promo.code"
                      >
                        <strong>{{ promo.code }}</strong>
                        <span class="offer-desc">
                          {{ promo.discountAmount > 0 ? '₹' + promo.discountAmount + ' OFF' : (promo.discountPercentage ? promo.discountPercentage + '% OFF' : '') }}
                        </span>
                      </button>
                    }
                  </div>
                </div>
              }
            }
          </div>

          @if (!auth.isAuthenticated()) {
            <div class="message">
              Sign in before checkout. Customers can place orders; staff can place counter sales.
            </div>
            <a class="btn primary" routerLink="/login" [queryParams]="{ returnUrl: '/cart' }">Sign in</a>
          } @else {
            @if (auth.hasAtLeastStaffRole()) {
              <label class="field">
                <span>Customer Profile</span>
                <select class="select" name="customerProfileId" [(ngModel)]="customerProfileId" required>
                  <option value="">-- Select Walk-in / Registered Customer --</option>
                  @for (customer of customers; track customer.id) {
                    <option [value]="customer.id">{{ customer.fullName }} ({{ customer.phoneNumber }})</option>
                  }
                </select>
              </label>
              <a class="btn ghost" routerLink="/admin/customers">Add new customer</a>
            } @else {
              <div class="message">
                Your customer profile is automatically mapped from your account.
              </div>
            }

            <div style="display: flex; gap: 8px; margin-top: 10px;">
              <button class="btn primary" type="button" (click)="checkout('80mm')" [disabled]="loading || cart.items().length === 0" style="flex: 1;" title="Place order and print 80mm thermal receipt">
                {{ loading ? 'Placing...' : '🧾 Place & 80mm Slip' }}
              </button>
              <button class="btn secondary" type="button" (click)="checkout('a4')" [disabled]="loading || cart.items().length === 0" style="flex: 1;" title="Place order and print A4 GST Tax Invoice">
                📄 Place & A4 Bill
              </button>
            </div>
          }
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .summary-box {
      background: #f8fafc;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      gap: 8px;
    }
    .discount-row { color: #dc2626; font-weight: 500; }
    .promo-row { color: #0d7a5f; font-weight: 600; }
    .total-toolbar {
      border-top: 2px solid #0f172a;
      padding-top: 8px;
      margin-top: 4px;
    }
    .total-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; }
    .total-amount { font-size: 1.25rem; font-weight: 800; color: #0d7a5f; }

    .promo-box {
      background: #ffffff;
      border: 1px dashed #0d7a5f;
      border-radius: 8px;
      padding: 12px;
      margin-top: 6px;
    }
    .promo-header {
      font-size: 0.72rem;
      font-weight: 700;
      color: #0d7a5f;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .promo-input-row {
      display: flex;
      gap: 6px;
    }
    .promo-input {
      flex: 1;
      padding: 7px 10px;
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .btn-apply-promo {
      background: #0d7a5f;
      color: #ffffff;
      border: none;
      padding: 7px 14px;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-apply-promo:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .promo-error {
      font-size: 0.78rem;
      color: #dc2626;
      margin-top: 6px;
      font-weight: 500;
    }
    .promo-success-msg {
      font-size: 0.78rem;
      color: #16a34a;
      margin-top: 6px;
      font-weight: 600;
    }

    .applied-badge {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #dcfce7;
      border: 1px solid #86efac;
      padding: 8px 12px;
      border-radius: 6px;
    }
    .applied-info strong { color: #166534; display: block; font-size: 0.88rem; }
    .saved-amt { font-size: 0.78rem; color: #15803d; font-weight: 600; }
    .btn-remove-promo {
      background: transparent;
      border: 1px solid #dc2626;
      color: #dc2626;
      border-radius: 4px;
      padding: 3px 8px;
      font-size: 0.75rem;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-remove-promo:hover { background: #fee2e2; }

    .offers-list {
      margin-top: 10px;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
    }
    .offers-title {
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 6px;
    }
    .offers-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .offer-chip {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .offer-chip:hover {
      background: #dcfce7;
      border-color: #86efac;
      transform: translateY(-1px);
    }
    .offer-desc {
      background: #166534;
      color: #ffffff;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 0.65rem;
      font-weight: 700;
    }
  `]
})
export class CartComponent implements OnInit {
  customers: CustomerDto[] = [];
  customerProfileId = '';
  promoInput = '';
  validatingPromo = false;
  promoError = '';
  promoSuccess = '';
  activePromos: PromoCodeDto[] = [];

  loading = false;
  error = '';
  success = '';
  readonly money = money;

  constructor(
    readonly cart: CartService,
    readonly auth: AuthService,
    private readonly api: ApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.hasAtLeastStaffRole()) {
      this.api.list<CustomerDto>('/api/customers', { pageNumber: 1, pageSize: 100 }).subscribe({
        next: (result) => this.customers = result.items,
        error: (error) => this.error = apiErrorMessage(error)
      });
    }

    this.loadActivePromos();
  }

  loadActivePromos(): void {
    this.api.get<any>('/api/promocodes/active').subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.activePromos = res;
        } else if (res && Array.isArray(res.value)) {
          this.activePromos = res.value;
        }
      },
      error: () => {
        // Fallback common promo chips if offline
        this.activePromos = [
          { id: '1', code: 'DIWALI2026', discountAmount: 2500, validFromUtc: '', validToUtc: '', isActive: true },
          { id: '2', code: 'SAVE10', discountAmount: 0, discountPercentage: 10, validFromUtc: '', validToUtc: '', isActive: true },
          { id: '3', code: 'FLAT500', discountAmount: 500, validFromUtc: '', validToUtc: '', isActive: true },
          { id: '4', code: 'SUPERDEAL', discountAmount: 1000, validFromUtc: '', validToUtc: '', isActive: true }
        ];
      }
    });
  }

  selectPromo(code: string): void {
    this.promoInput = code;
    this.applyPromoCode();
  }

  applyPromoCode(): void {
    const code = this.promoInput.trim().toUpperCase();
    if (!code) return;

    this.validatingPromo = true;
    this.promoError = '';
    this.promoSuccess = '';

    this.api.get<PromoCodeDto>(`/api/promocodes/validate/${code}`).subscribe({
      next: (promo) => {
        this.validatingPromo = false;
        this.cart.applyPromo({
          id: promo.id,
          code: promo.code,
          discountAmount: promo.discountAmount,
          discountPercentage: promo.discountPercentage
        });
        this.promoSuccess = `Coupon ${promo.code} applied successfully!`;
        this.promoInput = '';
      },
      error: (err) => {
        this.validatingPromo = false;
        this.promoError = apiErrorMessage(err) || `Promo code '${code}' is invalid or expired.`;
      }
    });
  }

  removePromo(): void {
    this.cart.removePromo();
    this.promoSuccess = '';
    this.promoError = '';
  }

  updateQuantity(item: CartItem, value: number): void {
    this.cart.updateQuantity(item.productId, Number(value));
  }

  checkout(format: 'a4' | '80mm' = '80mm'): void {
    if (!this.auth.isAuthenticated()) {
      this.error = 'Please sign in before checkout.';
      return;
    }

    if (this.auth.hasAtLeastStaffRole() && !this.customerProfileId) {
      this.error = 'Choose a customer before placing the order.';
      return;
    }

    const appliedPromoCode = this.cart.appliedPromo()?.code || null;

    const payload: any = {
      customerProfileId: this.auth.hasAtLeastStaffRole() ? this.customerProfileId : null,
      promoCode: appliedPromoCode,
      items: this.cart.items().map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    this.loading = true;
    this.error = '';
    this.success = '';
    this.api.post<OrderDto>('/api/orders', payload).subscribe({
      next: (order) => {
        saveOrderHistory(order);
        this.cart.clear();
        this.customerProfileId = '';
        this.promoInput = '';
        this.openBillForOrder(order, format);
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      }
    });
  }

  private openBillForOrder(order: OrderDto, format: 'a4' | '80mm' = '80mm'): void {
    this.api.post<BillDto>(`/api/billing/orders/${order.id}/ensure`, {}).subscribe({
      next: (bill) => {
        this.loading = false;
        // Seamlessly navigate to the 80mm print slip using Angular Router (exact same mechanism as billing list)
        this.router.navigate(['/billing', bill.id, 'print'], {
          queryParams: { format }
        });
      },
      error: (error) => {
        this.loading = false;
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
