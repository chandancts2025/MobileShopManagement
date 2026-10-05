import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { WishlistItemDto, WishlistSummaryDto, ProductDto } from '../core/api.models';
import { money } from '../core/formatters';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>❤️ My Wishlist</h2>
        <p>Save favorite mobile devices and track automatic price drops</p>
      </div>
      <div class="toolbar-right">
        <span class="badge">{{ summary?.totalItems ?? items.length }} saved items</span>
        <a class="btn primary" routerLink="/catalog">Browse Store</a>
        @if (items.length > 0) {
          <button class="btn danger" (click)="clearWishlist()">Clear All</button>
        }
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (successMessage) {
      <div class="message success" style="margin-bottom: 14px;">{{ successMessage }}</div>
    }

    <!-- Summary Metrics -->
    @if (summary) {
      <div class="grid two" style="margin-bottom: 16px;">
        <div class="panel">
          <div class="panel-body">
            <p class="muted" style="margin: 0 0 6px;">Total Wishlist Value</p>
            <strong style="font-size: 1.8rem; color: var(--primary);">{{ money(summary.totalValue) }}</strong>
            <p class="muted" style="margin: 4px 0 0; font-size: 0.82rem;">Across {{ summary.totalItems }} product(s)</p>
          </div>
        </div>
        <div class="panel">
          <div class="panel-body">
            <p class="muted" style="margin: 0 0 6px;">🔥 Price Drops Detected</p>
            <strong style="font-size: 1.8rem; color: var(--danger);">{{ summary.itemsWithPriceDrop }}</strong>
            <p class="muted" style="margin: 4px 0 0; font-size: 0.82rem;">Products currently cheaper than when added!</p>
          </div>
        </div>
      </div>
    }

    <!-- Wishlist Table & Mobile Cards -->
    <div class="panel" [class.loading]="loading">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Saved At Price</th>
              <th>Current Price</th>
              <th>Target Alert Price</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items; track item.id) {
              <tr [class.highlight]="item.isPriceDropped">
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="device-thumb" style="width: 38px; height: 38px; border-radius: 6px; background: var(--surface-2); display: grid; place-items: center; font-size: 1.2rem;">
                      📱
                    </div>
                    <div>
                      <strong>{{ item.productName }}</strong><br>
                      <span class="muted" style="font-size: 0.8rem;">SKU: {{ item.sku }}</span>
                      @if (item.isPriceDropped) {
                        <span class="badge good" style="margin-left: 6px;">🎉 Price Dropped!</span>
                      }
                    </div>
                  </div>
                </td>
                <td>
                  <span class="muted" style="text-decoration: line-through;">{{ money(item.priceWhenAdded) }}</span>
                </td>
                <td>
                  <strong [style.color]="item.isPriceDropped ? 'var(--danger)' : 'var(--text)'">
                    {{ money(item.currentPrice) }}
                  </strong>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <input type="number" [(ngModel)]="item.notifyAtPrice" 
                      class="input" placeholder="Notify below" style="max-width: 120px; padding: 4px 8px; font-size: 0.85rem;" />
                    <button class="btn ghost" (click)="savePriceAlert(item)" title="Save alert" style="padding: 4px 8px; font-size: 0.8rem;">Save</button>
                  </div>
                </td>
                <td style="text-align: right;">
                  <button class="btn primary" (click)="addToCart(item)" style="margin-right: 6px; padding: 6px 12px;">Add to Cart</button>
                  <button class="btn danger ghost" (click)="removeItem(item.id)" style="padding: 6px 10px;">Remove</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5">
                  <div class="empty-state" style="padding: 40px 20px;">
                    <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">🤍</span>
                    <h3>Your wishlist is empty</h3>
                    <p class="muted">Explore our mobile phones, tablets and accessories catalog to save your favorites.</p>
                    <a class="btn primary" routerLink="/catalog" style="margin-top: 10px;">Explore Catalog</a>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    tr.highlight {
      background-color: var(--warning-soft);
    }
  `]
})
export class WishlistComponent implements OnInit {
  items: WishlistItemDto[] = [];
  summary: WishlistSummaryDto | null = null;
  loading = false;
  error = '';
  successMessage = '';
  readonly money = money;

  constructor(
    private readonly api: ApiService,
    private readonly cart: CartService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.loading = true;
    this.error = '';

    this.api.list<WishlistItemDto>('/api/wishlist', { pageNumber: 1, pageSize: 50 }).subscribe({
      next: (result) => {
        this.items = result.items;
        this.loading = false;
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      }
    });

    this.api.get<WishlistSummaryDto>('/api/wishlist/summary').subscribe({
      next: (summary) => this.summary = summary,
      error: () => {}
    });
  }

  addToCart(item: WishlistItemDto): void {
    const product: ProductDto = {
      id: item.productId,
      sku: item.sku,
      name: item.productName,
      productType: 1,
      categoryId: '',
      categoryName: '',
      brandId: '',
      brandName: '',
      price: item.currentPrice,
      costPrice: 0,
      taxPercentage: 18,
      discountAmount: 0,
      quantityOnHand: 99,
      reorderLevel: 0
    };
    this.cart.add(product, 1);
    this.successMessage = `Added ${item.productName} to your cart!`;
    setTimeout(() => this.successMessage = '', 3500);
  }

  savePriceAlert(item: WishlistItemDto): void {
    this.api.put(`/api/wishlist/${item.id}`, {
      notifyAtPrice: item.notifyAtPrice,
      shouldNotifyOnPriceChange: true
    }).subscribe({
      next: () => {
        this.successMessage = `Alert updated for ${item.productName}!`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => this.error = apiErrorMessage(err)
    });
  }

  removeItem(id: string): void {
    if (confirm('Remove this product from your wishlist?')) {
      this.api.delete(`/api/wishlist/${id}`).subscribe({
        next: () => this.loadWishlist(),
        error: (error) => this.error = apiErrorMessage(error)
      });
    }
  }

  clearWishlist(): void {
    if (confirm('Clear your entire wishlist?')) {
      this.api.delete('/api/wishlist/clear').subscribe({
        next: () => this.loadWishlist(),
        error: (error) => this.error = apiErrorMessage(error)
      });
    }
  }
}
