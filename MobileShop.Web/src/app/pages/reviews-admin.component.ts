import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { ProductReviewDto } from '../core/api.models';
import { dateTime } from '../core/formatters';

@Component({
  selector: 'app-reviews-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>⭐ Review Moderation</h2>
        <p>Approve or moderate customer ratings and product feedback before public display</p>
      </div>
      <div class="toolbar-right">
        <button class="btn ghost" (click)="load()">↻ Refresh</button>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (successMessage) {
      <div class="message success" style="margin-bottom: 14px;">{{ successMessage }}</div>
    }

    <!-- Filter toolbar -->
    <div class="panel" style="margin-bottom: 16px;">
      <div class="panel-body toolbar" style="padding: 10px 16px; flex-wrap: wrap;">
        <div class="toolbar-left">
          <input
            type="text"
            class="input"
            placeholder="Search reviews, products or buyers..."
            [(ngModel)]="search"
            (keyup.enter)="load()"
            style="min-width: 260px;"
          />
          <button class="btn ghost" (click)="load()">Search</button>
        </div>
        <div class="toolbar-right">
          <button class="btn ghost" [class.active-pill]="statusFilter === 'all'" (click)="setStatusFilter('all')">
            All Reviews
          </button>
          <button class="btn ghost" [class.active-pill]="statusFilter === 'pending'" (click)="setStatusFilter('pending')">
            ⏳ Pending Approval
          </button>
          <button class="btn ghost" [class.active-pill]="statusFilter === 'approved'" (click)="setStatusFilter('approved')">
            ✅ Approved
          </button>
        </div>
      </div>
    </div>

    <!-- Reviews List -->
    <div class="panel" [class.loading]="loading">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating & Review</th>
              <th>Status</th>
              <th>Date</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (review of reviews; track review.id) {
              <tr>
                <td>
                  <strong>{{ review.productName }}</strong>
                </td>
                <td>
                  <span>{{ review.customerName }}</span>
                  @if (review.isVerifiedPurchase) {
                    <br><span class="badge good" style="font-size: 0.72rem;">Verified Buyer</span>
                  }
                </td>
                <td style="max-width: 320px;">
                  <div style="color: #f59e0b; margin-bottom: 4px;">
                    {{ renderStars(review.rating) }}
                    <strong style="color: var(--text); margin-left: 6px;">{{ review.title }}</strong>
                  </div>
                  <p class="muted" style="margin: 0; font-size: 0.85rem; line-height: 1.35;">{{ review.comment }}</p>
                  <small class="muted" style="font-size: 0.75rem;">👍 {{ review.helpfulCount }} helpful / 👎 {{ review.unhelpfulCount }}</small>
                </td>
                <td>
                  <span [class]="'badge ' + (review.isApproved ? 'good' : 'warn')">
                    {{ review.isApproved ? 'Approved' : 'Pending' }}
                  </span>
                </td>
                <td>
                  <span class="muted" style="font-size: 0.82rem;">{{ dateTime(review.createdAtUtc) }}</span>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                  @if (!review.isApproved) {
                    <button class="btn primary" (click)="approve(review.id)" style="padding: 4px 10px; font-size: 0.8rem; margin-right: 6px;">
                      Approve
                    </button>
                  }
                  <button class="btn danger ghost" (click)="reject(review.id)" style="padding: 4px 8px; font-size: 0.8rem;">
                    Delete
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">
                  <div class="empty-state" style="padding: 36px 20px;">
                    <span style="font-size: 2rem; display: block; margin-bottom: 6px;">💬</span>
                    <p class="muted">No customer reviews found matching criteria.</p>
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
    .active-pill {
      background: var(--primary-soft) !important;
      color: var(--primary-strong) !important;
      font-weight: 700;
    }
  `]
})
export class ReviewsAdminComponent implements OnInit {
  reviews: ProductReviewDto[] = [];
  statusFilter: 'all' | 'pending' | 'approved' = 'all';
  search = '';
  loading = false;
  error = '';
  successMessage = '';
  readonly dateTime = dateTime;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';

    const params: Record<string, string | number | boolean | null | undefined> = {
      search: this.search.trim() || undefined,
      pageNumber: 1,
      pageSize: 50
    };

    if (this.statusFilter === 'pending') params['isApproved'] = false;
    if (this.statusFilter === 'approved') params['isApproved'] = true;

    this.api.get<{ items: ProductReviewDto[]; totalCount: number }>('/api/reviews', params).subscribe({
      next: (res) => {
        this.reviews = res.items || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = apiErrorMessage(err);
        this.loading = false;
      }
    });
  }

  setStatusFilter(filter: 'all' | 'pending' | 'approved'): void {
    this.statusFilter = filter;
    this.load();
  }

  approve(id: string): void {
    this.api.post(`/api/reviews/${id}/approve`, {}).subscribe({
      next: () => {
        this.successMessage = 'Review approved successfully!';
        setTimeout(() => this.successMessage = '', 3000);
        this.load();
      },
      error: (err) => this.error = apiErrorMessage(err)
    });
  }

  reject(id: string): void {
    if (confirm('Delete this customer review?')) {
      this.api.delete(`/api/reviews/admin/${id}`).subscribe({
        next: () => {
          this.successMessage = 'Review deleted.';
          setTimeout(() => this.successMessage = '', 3000);
          this.load();
        },
        error: (err) => this.error = apiErrorMessage(err)
      });
    }
  }

  renderStars(rating: number): string {
    const full = Math.min(5, Math.max(0, Math.round(rating)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }
}
