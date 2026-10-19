import { computed, Injectable, signal } from '@angular/core';

import { ProductDto } from './api.models';

const STORAGE_KEY = 'mobile-shop-cart';

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  taxPercentage: number;
  discountAmount: number;
  quantityOnHand: number;
  quantity: number;
}

export interface AppliedPromo {
  id?: string;
  code: string;
  discountAmount: number;
  discountPercentage?: number | null;
}

const PROMO_STORAGE_KEY = 'mobile-shop-promo';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsState = signal<CartItem[]>(readCart());
  private readonly appliedPromoState = signal<AppliedPromo | null>(readAppliedPromo());

  readonly items = this.itemsState.asReadonly();
  readonly appliedPromo = this.appliedPromoState.asReadonly();
  readonly count = computed(() => this.itemsState().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() => this.itemsState().reduce((sum, item) => sum + item.price * item.quantity, 0));
  readonly itemDiscount = computed(() => this.itemsState().reduce((sum, item) => sum + item.discountAmount * item.quantity, 0));
  
  readonly promoDiscount = computed(() => {
    const promo = this.appliedPromoState();
    if (!promo || this.itemsState().length === 0) return 0;
    const base = Math.max(0, this.subtotal() - this.itemDiscount());
    let disc = promo.discountAmount || 0;
    if (promo.discountPercentage) {
      disc += base * (promo.discountPercentage / 100);
    }
    return Math.min(disc, base);
  });

  readonly discount = computed(() => this.itemDiscount() + this.promoDiscount());
  readonly taxableValue = computed(() => Math.max(0, this.subtotal() - this.discount()));
  readonly cgst = computed(() => Math.round(this.taxableValue() * 0.09 * 100) / 100);
  readonly sgst = computed(() => Math.round(this.taxableValue() * 0.09 * 100) / 100);
  readonly tax = computed(() => this.cgst() + this.sgst());
  readonly total = computed(() => this.taxableValue() + this.tax());

  applyPromo(promo: AppliedPromo): void {
    this.appliedPromoState.set(promo);
    persistAppliedPromo(promo);
  }

  removePromo(): void {
    this.appliedPromoState.set(null);
    persistAppliedPromo(null);
  }

  add(product: ProductDto, quantity = 1): void {
    this.itemsState.update((items) => {
      const existing = items.find((item) => item.productId === product.id);
      const next = existing
        ? items.map((item) => item.productId === product.id ? { ...item, quantity: clampQuantity(item.quantity + quantity, product.quantityOnHand) } : item)
        : [
            ...items,
            {
              productId: product.id,
              sku: product.sku,
              name: product.name,
              price: product.price,
              taxPercentage: product.taxPercentage,
              discountAmount: product.discountAmount,
              quantityOnHand: product.quantityOnHand,
              quantity: clampQuantity(quantity, product.quantityOnHand)
            }
          ];
      persistCart(next);
      return next;
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    this.itemsState.update((items) => {
      const next = items
        .map((item) => item.productId === productId ? { ...item, quantity: clampQuantity(quantity, item.quantityOnHand) } : item)
        .filter((item) => item.quantity > 0);
      persistCart(next);
      return next;
    });
  }

  remove(productId: string): void {
    this.itemsState.update((items) => {
      const next = items.filter((item) => item.productId !== productId);
      persistCart(next);
      return next;
    });
  }

  clear(): void {
    persistCart([]);
    this.itemsState.set([]);
    this.removePromo();
  }
}

function clampQuantity(value: number, available: number): number {
  return Math.max(0, Math.min(Math.floor(Number(value) || 0), Math.max(0, available)));
}

function readCart(): CartItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value as CartItem[] : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistCart(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function readAppliedPromo(): AppliedPromo | null {
  const raw = localStorage.getItem(PROMO_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppliedPromo;
  } catch {
    localStorage.removeItem(PROMO_STORAGE_KEY);
    return null;
  }
}

function persistAppliedPromo(promo: AppliedPromo | null): void {
  if (!promo) {
    localStorage.removeItem(PROMO_STORAGE_KEY);
  } else {
    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promo));
  }
}

