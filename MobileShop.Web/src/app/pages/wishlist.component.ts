import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { WishlistItemDto, WishlistSummaryDto } from '../core/api.models';
import { money } from '../core/formatters';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>My Wishlist</h2>
        <p>Save your favorite products for later</p>
      </div>
      <div class="toolbar-right">
        <span class="badge">{{ summary?.totalItems ?? 0 }} items</span>
        <button class="btn danger" (click)="clearWishlist()" [disabled]="!items.length">Clear</button>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    @if (summary) {
      <div class="grid two" style="margin-bottom: 16px;">
        <div class="panel">
          <div class="panel-body">
            <p class="muted">Total Value</p>
            <strong style="font-size: 1.8rem;">{{ money(summary?.totalValue) }}</strong>
          </div>
        </div>
        <div class="panel">
          <div class="panel-body">
            <p class="muted">Price Drops</p>
            <strong style="font-size: 1.8rem; color: var(--danger);">{{ summary?.itemsWithPriceDrop ?? 0 }}</strong>
          </div>
        </div>
      </div>
    }

    <div class="panel" [class.loading]="loading">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Original Price</th>
              <th>Current Price</th>
              <th>Notify At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items; track item.id) {
              <tr [class]="item.isPriceDropped ? 'highlight' : ''">
                <td>
                  <strong>{{ item.productName }}</strong><br>
                  <span class="muted" style="font-size: 0.8rem;">SKU: {{ item.sku }}</span>
                </td>
                <td>{{ money(item.priceWhenAdded) }}</td>
                <td>
                  <span [class]="item.isPriceDropped ? 'badge good' : ''">
                    {{ money(item.currentPrice) }}
                  </span>
                </td>
                <td>
                  <input type="number" [(ngModel)]="item.notifyAtPrice" 
                    class="input" placeholder="Optional" style="max-width: 100px;" />
                </td>
                <td>
                  <button class="btn ghost" style="margin-right: 4px;">Add to Cart</button>
                  <button class="btn danger" (click)="removeItem(item.id)">Remove</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5"><div class="empty-state">Your wishlist is empty. <a routerLink="/catalog">Browse products</a></div></td>
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
  readonly money = money;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadWishlist();
  }

  loadWishlist(): void {
    this.loading = true;
    this.error = '';

    this.api.get<WishlistItemDto[]>('/api/wishlist').subscribe({
      next: (items) => this.items = items,
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });

    this.api.get<WishlistSummaryDto>('/api/wishlist/summary').subscribe({
      next: (summary) => this.summary = summary,
      error: () => {}
    });
  }

  removeItem(id: Guid): void {
    if (confirm('Remove from wishlist?')) {
      this.api.delete(`/api/wishlist/${id}`).subscribe({
        next: () => this.loadWishlist(),
        error: (error) => this.error = apiErrorMessage(error)
      });
    }
  }

  clearWishlist(): void {
    if (confirm('Clear entire wishlist?')) {
      this.api.delete('/api/wishlist/clear').subscribe({
        next: () => this.loadWishlist(),
        error: (error) => this.error = apiErrorMessage(error)
      });
    }
  }
}

type Guid = string;
