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

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsState = signal<CartItem[]>(readCart());

  readonly items = this.itemsState.asReadonly();
  readonly count = computed(() => this.itemsState().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() => this.itemsState().reduce((sum, item) => sum + item.price * item.quantity, 0));
  readonly discount = computed(() => this.itemsState().reduce((sum, item) => sum + item.discountAmount * item.quantity, 0));
  readonly tax = computed(() => this.itemsState().reduce((sum, item) => sum + item.price * item.quantity * (item.taxPercentage / 100), 0));
  readonly total = computed(() => Math.max(0, this.subtotal() + this.tax() - this.discount()));

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
