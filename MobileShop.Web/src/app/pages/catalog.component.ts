import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import {
  optionLabel,
  ProductDto,
  ProductType,
  productTypeOptions,
  ProductReviewDto,
  ReviewSummaryDto,
  CreateReviewRequest
} from '../core/api.models';
import { money } from '../core/formatters';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Hero / Storefront Banner -->
    <div class="storefront-hero" style="margin-bottom: 24px; border-radius: 14px; padding: 28px 24px; background: linear-gradient(135deg, #0f5747 0%, #176f5b 50%, #0d9488 100%); color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; box-shadow: 0 12px 30px rgba(15, 87, 71, 0.25);">
      <div>
        <span style="background: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          Premium Handsets & Devices
        </span>
        <h2 style="margin: 10px 0 6px; font-size: 1.8rem; color: white;">Next-Gen Mobile Catalog</h2>
        <p style="margin: 0; opacity: 0.9; max-width: 520px; font-size: 0.95rem;">
          Explore smartphones, tablets, and authentic accessories with official brand warranty and lightning-fast delivery.
        </p>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <a class="btn" style="background: white; color: #0f5747; font-weight: 700; border: none; padding: 10px 18px;" routerLink="/cart">
          🛒 Cart ({{ cart.count() }}) - {{ money(cart.total()) }}
        </a>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (toastMessage) {
      <div class="message success" style="margin-bottom: 14px;">{{ toastMessage }}</div>
    }

    <!-- Search & Filters Panel -->
    <section class="panel" style="margin-bottom: 20px;">
      <div class="panel-body" style="padding: 16px 20px;">
        <!-- Search Bar with Suggestions -->
        <div style="position: relative; margin-bottom: 14px;">
          <div style="display: flex; gap: 8px;">
            <div style="position: relative; flex: 1;">
              <input
                type="text"
                class="input"
                style="width: 100%; font-size: 0.95rem; padding: 10px 14px;"
                placeholder="Search by product name, brand, model or SKU..."
                [(ngModel)]="search"
                (ngModelChange)="onSearchInput($event)"
                (keyup.enter)="applyFilters()"
              />
              @if (suggestions.length > 0 && showSuggestions) {
                <div class="suggestions-dropdown">
                  @for (s of suggestions; track s) {
                    <div class="suggestion-item" (click)="selectSuggestion(s)">
                      🔍 {{ s }}
                    </div>
                  }
                </div>
              }
            </div>
            <button class="btn primary" (click)="applyFilters()" style="padding: 10px 18px;">
              Search
            </button>
            @if (search || selectedCategory || selectedBrand || minPrice || maxPrice || minRating) {
              <button class="btn ghost" (click)="resetFilters()">Clear</button>
            }
          </div>
        </div>

        <!-- Filter Controls -->
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; font-size: 0.88rem;">
          <!-- Category Filter -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="muted" style="font-weight: 600;">Category:</span>
            <select class="select" [(ngModel)]="selectedCategory" (change)="applyFilters()" style="padding: 6px 10px;">
              <option value="">All Categories</option>
              @for (cat of categories; track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>

          <!-- Brand Filter -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="muted" style="font-weight: 600;">Brand:</span>
            <select class="select" [(ngModel)]="selectedBrand" (change)="applyFilters()" style="padding: 6px 10px;">
              <option value="">All Brands</option>
              @for (b of brands; track b.id) {
                <option [value]="b.id">{{ b.name }}</option>
              }
            </select>
          </div>

          <!-- Sort Order -->
          <div style="display: flex; align-items: center; gap: 6px; margin-left: auto;">
            <span class="muted" style="font-weight: 600;">Sort:</span>
            <select class="select" [(ngModel)]="sortBy" (change)="applyFilters()" style="padding: 6px 10px;">
              <option value="name">Name (A-Z)</option>
              <option value="price">Price</option>
              <option value="newest">Newest</option>
            </select>
            <button class="btn ghost" (click)="toggleSortDirection()" style="padding: 6px 10px;">
              {{ sortDescending ? '▼ Desc' : '▲ Asc' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Product Grid -->
    <section class="panel">
      <div class="panel-header" style="justify-content: space-between; flex-wrap: wrap;">
        <strong>Showing {{ products.length }} Products</strong>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn ghost" (click)="prevPage()" [disabled]="pageNumber <= 1" style="padding: 4px 10px;">Previous</button>
          <span class="badge">Page {{ pageNumber }}</span>
          <button class="btn ghost" (click)="nextPage()" [disabled]="products.length < pageSize" style="padding: 4px 10px;">Next</button>
        </div>
      </div>

      <div class="panel-body" [class.loading]="loading">
        <div class="product-grid">
          @for (product of products; track product.id) {
            <article class="product-card">
              <!-- Wishlist Quick Toggle -->
              <button
                class="wishlist-btn"
                (click)="toggleWishlist(product)"
                [title]="isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'"
                [class.active]="isInWishlist(product.id)"
              >
                {{ isInWishlist(product.id) ? '❤️' : '🤍' }}
              </button>

              <!-- Device Art Container with Feature Tag -->
              <div class="device-art" aria-hidden="true" style="margin-bottom: 12px;">
                <span style="position: absolute; bottom: 8px; left: 10px; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(4px); color: #34d399; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px;">
                  100% GENUINE
                </span>
                @if (product.discountAmount > 0) {
                  <span style="position: absolute; top: 10px; left: 10px; background: #dc2626; color: white; font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.3px;">
                    SPECIAL DEAL
                  </span>
                }
              </div>

              <div style="flex: 1; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 6px;">
                  <span class="badge" style="font-size: 0.72rem; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;">
                    {{ product.brandName }}
                  </span>
                  <span class="muted" style="font-size: 0.74rem; font-family: monospace;">SKU: {{ product.sku }}</span>
                </div>

                <h3 style="margin: 0 0 6px; font-size: 1.08rem; line-height: 1.35; font-weight: 700; color: #0f172a;">
                  {{ product.name }}
                </h3>

                <p class="muted" style="margin: 0 0 10px; font-size: 0.83rem; line-height: 1.45; min-height: 38px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  {{ product.description || (product.brandName + ' ' + product.categoryName + ' with official manufacturer warranty.') }}
                </p>

                <!-- Rating Preview Pill -->
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-size: 0.78rem;">
                  <span style="background: #fef3c7; color: #92400e; padding: 1px 6px; border-radius: 4px; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
                    ★ 4.8
                  </span>
                  <span class="muted" style="font-size: 0.74rem;">Verified Retail Stock</span>
                </div>
              </div>

              <!-- Price & Stock Row -->
              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; padding-top: 10px; border-top: 1px solid #f1f5f9;">
                <div>
                  <div style="display: flex; align-items: baseline; gap: 6px;">
                    <strong style="font-size: 1.35rem; color: #0d7a5f; font-weight: 900; letter-spacing: -0.02em;">
                      {{ money(product.price) }}
                    </strong>
                    @if (product.discountAmount > 0) {
                      <span class="muted" style="font-size: 0.8rem; text-decoration: line-through;">
                        {{ money(product.price + product.discountAmount) }}
                      </span>
                    }
                  </div>
                  @if (product.discountAmount > 0) {
                    <div style="color: #dc2626; font-size: 0.72rem; font-weight: 700; margin-top: 2px;">
                      Save {{ money(product.discountAmount) }} (Special Offer)
                    </div>
                  }
                </div>

                <div>
                  <span
                    class="badge"
                    [class.good]="product.quantityOnHand > product.reorderLevel"
                    [class.warn]="product.quantityOnHand > 0 && product.quantityOnHand <= product.reorderLevel"
                    [class.bad]="product.quantityOnHand <= 0"
                    style="font-size: 0.74rem; font-weight: 700;"
                  >
                    {{ product.quantityOnHand > 0 ? ('🟢 ' + product.quantityOnHand + ' in stock') : '🔴 Sold Out' }}
                  </span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display: grid; grid-template-columns: 1fr 1.35fr; gap: 8px;">
                <button class="btn ghost" type="button" (click)="openProductDetails(product)" style="padding: 8px 10px; font-size: 0.82rem;" title="View specs, reviews and warranty">
                  🔍 Specs
                </button>
                <button
                  class="btn primary"
                  type="button"
                  (click)="addToCart(product)"
                  [disabled]="product.quantityOnHand <= 0"
                  style="padding: 8px 12px; font-size: 0.86rem; font-weight: 700;"
                >
                  {{ product.quantityOnHand > 0 ? '🛒 Add to Cart' : 'Out of Stock' }}
                </button>
              </div>
            </article>
          } @empty {
            <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 20px;">
              <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">📱</span>
              <h3>No products match your criteria</h3>
              <p class="muted">Try adjusting your search query, brand, or category filters.</p>
              <button class="btn primary" (click)="resetFilters()" style="margin-top: 12px;">Reset Filters</button>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Product Details & Reviews Drawer / Modal -->
    @if (selectedProduct) {
      <div class="modal-backdrop" (click)="closeDetails()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <span class="badge" style="margin-bottom: 4px;">{{ selectedProduct.brandName }} • {{ selectedProduct.categoryName }}</span>
              <h2 style="margin: 2px 0 0;">{{ selectedProduct.name }}</h2>
              <span class="muted" style="font-size: 0.85rem;">SKU: {{ selectedProduct.sku }}</span>
            </div>
            <button class="btn ghost" (click)="closeDetails()" style="font-size: 1.2rem; padding: 4px 10px;">✕</button>
          </div>

          <div class="modal-body" style="max-height: 75vh; overflow-y: auto; padding: 20px;">
            <!-- Specs & Pricing Overview -->
            <div class="grid three" style="gap: 12px; margin-bottom: 20px; background: var(--surface-2); padding: 16px; border-radius: 8px;">
              <div>
                <p class="muted" style="margin: 0 0 2px;">Price</p>
                <strong style="font-size: 1.3rem; color: var(--primary);">{{ money(selectedProduct.price) }}</strong>
              </div>
              <div>
                <p class="muted" style="margin: 0 0 2px;">Stock Status</p>
                <strong>{{ selectedProduct.quantityOnHand }} units available</strong>
              </div>
              <div>
                <p class="muted" style="margin: 0 0 2px;">Tax & Discount</p>
                <strong>{{ selectedProduct.taxPercentage }}% GST ({{ money(selectedProduct.discountAmount) }} off)</strong>
              </div>
            </div>

            <!-- Description -->
            @if (selectedProduct.description) {
              <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 6px;">Product Overview</h4>
                <p style="margin: 0; line-height: 1.5; color: var(--text);">{{ selectedProduct.description }}</p>
              </div>
            }

            <!-- Quick Add to Cart from Modal -->
            <div style="display: flex; gap: 10px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--line);">
              <button class="btn primary" (click)="addToCart(selectedProduct)" [disabled]="selectedProduct.quantityOnHand <= 0" style="padding: 10px 24px;">
                🛒 Add to Cart ({{ money(selectedProduct.price) }})
              </button>
              <button class="btn ghost" (click)="toggleWishlist(selectedProduct)">
                {{ isInWishlist(selectedProduct.id) ? '❤️ In Wishlist' : '🤍 Save to Wishlist' }}
              </button>
            </div>

            <!-- Reviews Section -->
            <div class="reviews-section">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0;">Customer Reviews & Ratings</h3>
                @if (auth.isAuthenticated()) {
                  <button class="btn primary ghost" (click)="showReviewForm = !showReviewForm">
                    {{ showReviewForm ? '✕ Close Form' : '✍️ Write a Review' }}
                  </button>
                } @else {
                  <a routerLink="/login" class="btn ghost" style="font-size: 0.85rem;">Sign in to review</a>
                }
              </div>

              <!-- Rating Summary Header -->
              @if (reviewSummary && reviewSummary.totalReviews > 0) {
                <div style="display: flex; align-items: center; gap: 20px; background: var(--surface-2); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                  <div style="text-align: center; border-right: 1px solid var(--line); padding-right: 20px;">
                    <div style="font-size: 2.2rem; font-weight: 800; color: #f59e0b; line-height: 1;">
                      {{ reviewSummary.averageRating }}
                    </div>
                    <div style="color: #f59e0b; margin: 4px 0;">
                      {{ renderStars(reviewSummary.averageRating) }}
                    </div>
                    <span class="muted" style="font-size: 0.78rem;">Based on {{ reviewSummary.totalReviews }} reviews</span>
                  </div>
                  <div style="flex: 1;">
                    <span class="badge good" style="font-size: 0.8rem;">
                      ✓ {{ reviewSummary.verifiedPurchaseCount }} Verified Purchases
                    </span>
                    <p class="muted" style="margin: 6px 0 0; font-size: 0.85rem;">
                      Real customer feedback on performance, battery life, camera quality, and durability.
                    </p>
                  </div>
                </div>
              }

              <!-- Write a Review Form -->
              @if (showReviewForm) {
                <div class="panel" style="margin-bottom: 20px; background: #fafafa; border: 1px solid var(--primary-soft);">
                  <div class="panel-body">
                    <h4 style="margin: 0 0 12px;">Share Your Experience</h4>
                    <form (ngSubmit)="submitReview()">
                      <div style="margin-bottom: 12px;">
                        <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 4px;">Rating</label>
                        <div style="font-size: 1.6rem; color: #f59e0b; cursor: pointer;">
                          @for (star of [1,2,3,4,5]; track star) {
                            <span (click)="newReview.rating = star" [style.opacity]="newReview.rating >= star ? '1' : '0.35'">
                              ★
                            </span>
                          }
                          <span class="muted" style="font-size: 0.85rem; margin-left: 8px; color: var(--text);">
                            {{ newReview.rating }} / 5 Stars
                          </span>
                        </div>
                      </div>

                      <div style="margin-bottom: 12px;">
                        <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 4px;">Review Title</label>
                        <input type="text" class="input" [(ngModel)]="newReview.title" name="reviewTitle" placeholder="e.g. Excellent battery and display quality" required />
                      </div>

                      <div style="margin-bottom: 14px;">
                        <label style="font-size: 0.85rem; font-weight: 600; display: block; margin-bottom: 4px;">Review Details</label>
                        <textarea class="input" [(ngModel)]="newReview.comment" name="reviewComment" rows="3" placeholder="Tell other shoppers what you like or dislike about this phone..." required></textarea>
                      </div>

                      <button type="submit" class="btn primary" [disabled]="submittingReview || !newReview.title.trim() || !newReview.comment.trim()">
                        {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
                      </button>
                    </form>
                  </div>
                </div>
              }

              <!-- Reviews List -->
              @if (reviewsLoading) {
                <p class="muted">Loading reviews...</p>
              } @else if (productReviews.length === 0) {
                <div class="empty-state" style="padding: 24px;">
                  <p class="muted">No reviews yet for this product. Be the first to share your review!</p>
                </div>
              } @else {
                <div style="display: grid; gap: 14px;">
                  @for (rev of productReviews; track rev.id) {
                    <div style="border: 1px solid var(--line); border-radius: 8px; padding: 14px;">
                      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                        <div>
                          <span style="color: #f59e0b; font-size: 1rem;">{{ renderStars(rev.rating) }}</span>
                          <strong style="margin-left: 8px;">{{ rev.title }}</strong>
                        </div>
                        <span class="muted" style="font-size: 0.78rem;">{{ rev.createdAtUtc | date: 'mediumDate' }}</span>
                      </div>
                      <p style="margin: 0 0 8px; font-size: 0.9rem; line-height: 1.4; color: var(--text);">
                        {{ rev.comment }}
                      </p>
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="muted" style="font-size: 0.8rem;">
                          By <strong>{{ rev.customerName }}</strong>
                          @if (rev.isVerifiedPurchase) {
                            <span class="badge good" style="margin-left: 6px; font-size: 0.72rem;">Verified Buyer</span>
                          }
                        </span>
                        <div style="display: flex; gap: 6px;">
                          <button class="btn ghost" (click)="markHelpful(rev)" style="padding: 3px 8px; font-size: 0.78rem;">
                            👍 Helpful ({{ rev.helpfulCount }})
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
      z-index: 100;
      max-height: 220px;
      overflow-y: auto;
      margin-top: 4px;
    }
    .suggestion-item {
      padding: 10px 14px;
      cursor: pointer;
      font-size: 0.88rem;
      border-bottom: 1px solid var(--line);
    }
    .suggestion-item:last-child {
      border-bottom: none;
    }
    .suggestion-item:hover {
      background: var(--surface-2);
      color: var(--primary-strong);
    }
    .wishlist-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid var(--line);
      border-radius: 50%;
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      cursor: pointer;
      font-size: 1rem;
      transition: transform 0.15s ease;
      z-index: 2;
    }
    .wishlist-btn:hover {
      transform: scale(1.15);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      z-index: 999;
      padding: 16px;
    }
    .modal-card {
      background: white;
      width: 100%;
      max-width: 720px;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.25);
      overflow: hidden;
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: var(--surface-2);
    }
  `]
})
export class CatalogComponent implements OnInit {
  products: ProductDto[] = [];
  categories: { id: string; name: string }[] = [];
  brands: { id: string; name: string }[] = [];
  wishlistProductIds = new Set<string>();

  search = '';
  suggestions: string[] = [];
  showSuggestions = false;
  selectedCategory = '';
  selectedBrand = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minRating: number | null = null;
  sortBy = 'name';
  sortDescending = false;

  pageNumber = 1;
  pageSize = 12;
  loading = false;
  error = '';
  toastMessage = '';

  // Selected product modal
  selectedProduct: ProductDto | null = null;
  reviewSummary: ReviewSummaryDto | null = null;
  productReviews: ProductReviewDto[] = [];
  reviewsLoading = false;
  showReviewForm = false;
  submittingReview = false;
  newReview: CreateReviewRequest = {
    productId: '',
    rating: 5,
    title: '',
    comment: ''
  };

  readonly money = money;

  constructor(
    private readonly api: ApiService,
    readonly cart: CartService,
    readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadWishlistIds();
    this.applyFilters();
  }

  optionLabel(value: number): string {
    return optionLabel(productTypeOptions, value as ProductType);
  }

  loadFilterOptions(): void {
    this.api.get<{ categories: { id: string; name: string }[]; brands: { id: string; name: string }[] }>('/api/search/filter-options').subscribe({
      next: (res) => {
        this.categories = Array.isArray(res?.categories) ? res.categories : [];
        this.brands = Array.isArray(res?.brands) ? res.brands : [];
      },
      error: () => {
        // Fallback to direct lookups using api.list
        this.api.list<{ id: string; name: string }>('/api/categories', { pageSize: 100 }).subscribe({
          next: (c) => this.categories = Array.isArray(c?.items) ? c.items : []
        });
        this.api.list<{ id: string; name: string }>('/api/brands', { pageSize: 100 }).subscribe({
          next: (b) => this.brands = Array.isArray(b?.items) ? b.items : []
        });
      }
    });
  }

  loadWishlistIds(): void {
    if (this.auth.isAuthenticated() && this.auth.currentRole() === 'Customer') {
      this.api.list<{ productId: string }>('/api/wishlist', { pageNumber: 1, pageSize: 100 }).subscribe({
        next: (res) => {
          this.wishlistProductIds = new Set(res.items.map((i) => i.productId));
        },
        error: () => {}
      });
    }
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistProductIds.has(productId);
  }

  toggleWishlist(product: ProductDto): void {
    if (!this.auth.isAuthenticated()) {
      this.showToast('Please sign in as a customer to save favorites.');
      return;
    }

    if (this.isInWishlist(product.id)) {
      // Find item and remove
      this.api.list<{ id: string; productId: string }>('/api/wishlist').subscribe({
        next: (res) => {
          const item = res.items.find((i) => i.productId === product.id);
          if (item) {
            this.api.delete(`/api/wishlist/${item.id}`).subscribe({
              next: () => {
                this.wishlistProductIds.delete(product.id);
                this.showToast(`Removed ${product.name} from wishlist.`);
              }
            });
          }
        }
      });
    } else {
      this.api.post('/api/wishlist', {
        productId: product.id,
        notifyAtPrice: product.price * 0.9,
        shouldNotifyOnPriceChange: true
      }).subscribe({
        next: () => {
          this.wishlistProductIds.add(product.id);
          this.showToast(`❤️ Added ${product.name} to your wishlist!`);
        },
        error: (err) => this.error = apiErrorMessage(err)
      });
    }
  }

  onSearchInput(val: string): void {
    if (val && val.trim().length >= 2) {
      this.api.get<string[]>('/api/search/suggestions', { term: val.trim(), count: 5 }).subscribe({
        next: (list) => {
          this.suggestions = list || [];
          this.showSuggestions = this.suggestions.length > 0;
        },
        error: () => this.showSuggestions = false
      });
    } else {
      this.suggestions = [];
      this.showSuggestions = false;
    }
  }

  selectSuggestion(term: string): void {
    this.search = term;
    this.showSuggestions = false;
    this.applyFilters();
  }

  applyFilters(): void {
    this.showSuggestions = false;
    this.loading = true;
    this.error = '';

    const params: Record<string, string | number | boolean | null | undefined> = {
      search: this.search.trim() || undefined,
      categoryId: this.selectedCategory || undefined,
      brandId: this.selectedBrand || undefined,
      minPrice: this.minPrice ?? undefined,
      maxPrice: this.maxPrice ?? undefined,
      minRating: this.minRating ?? undefined,
      sortBy: this.sortBy,
      sortDescending: this.sortDescending,
      pageNumber: this.pageNumber,
      pageSize: this.pageSize
    };

    this.api.get<{ items: ProductDto[]; totalCount: number }>('/api/search', params).subscribe({
      next: (result) => {
        this.products = result.items || [];
        this.loading = false;
      },
      error: () => {
        // Fallback to /api/products
        this.api.list<ProductDto>('/api/products', {
          search: this.search,
          sortBy: this.sortBy,
          sortDescending: this.sortDescending,
          pageNumber: this.pageNumber,
          pageSize: this.pageSize
        }).subscribe({
          next: (res) => {
            this.products = res.items;
            this.loading = false;
          },
          error: (err) => {
            this.error = apiErrorMessage(err);
            this.loading = false;
          }
        });
      }
    });
  }

  resetFilters(): void {
    this.search = '';
    this.selectedCategory = '';
    this.selectedBrand = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.minRating = null;
    this.sortBy = 'name';
    this.sortDescending = false;
    this.pageNumber = 1;
    this.applyFilters();
  }

  toggleSortDirection(): void {
    this.sortDescending = !this.sortDescending;
    this.applyFilters();
  }

  prevPage(): void {
    this.pageNumber = Math.max(1, this.pageNumber - 1);
    this.applyFilters();
  }

  nextPage(): void {
    this.pageNumber += 1;
    this.applyFilters();
  }

  addToCart(product: ProductDto): void {
    this.cart.add(product, 1);
    this.showToast(`Added ${product.name} to cart!`);
  }

  openProductDetails(product: ProductDto): void {
    this.selectedProduct = product;
    this.showReviewForm = false;
    this.newReview = {
      productId: product.id,
      rating: 5,
      title: '',
      comment: ''
    };
    this.loadProductReviews(product.id);
  }

  closeDetails(): void {
    this.selectedProduct = null;
  }

  loadProductReviews(productId: string): void {
    this.reviewsLoading = true;
    this.api.get<ReviewSummaryDto>(`/api/reviews/summary/${productId}`).subscribe({
      next: (summary) => this.reviewSummary = summary,
      error: () => this.reviewSummary = null
    });

    this.api.list<ProductReviewDto>(`/api/reviews/product/${productId}`).subscribe({
      next: (res) => {
        this.productReviews = res.items || [];
        this.reviewsLoading = false;
      },
      error: () => {
        this.productReviews = [];
        this.reviewsLoading = false;
      }
    });
  }

  markHelpful(review: ProductReviewDto): void {
    this.api.post(`/api/reviews/${review.id}/helpful`, {}).subscribe({
      next: () => review.helpfulCount++
    });
  }

  submitReview(): void {
    if (!this.selectedProduct) return;
    this.submittingReview = true;
    this.newReview.productId = this.selectedProduct.id;

    this.api.post<ProductReviewDto>('/api/reviews', this.newReview).subscribe({
      next: () => {
        this.submittingReview = false;
        this.showReviewForm = false;
        this.showToast('Thank you! Your review has been submitted for moderation.');
        this.loadProductReviews(this.selectedProduct!.id);
      },
      error: (err) => {
        this.submittingReview = false;
        this.error = apiErrorMessage(err);
      }
    });
  }

  renderStars(rating: number): string {
    const full = Math.min(5, Math.max(0, Math.round(rating)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => this.toastMessage = '', 3500);
  }
}
