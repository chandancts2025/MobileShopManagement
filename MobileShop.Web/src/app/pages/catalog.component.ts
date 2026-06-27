import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { optionLabel, ProductDto, ProductType, productTypeOptions } from '../core/api.models';
import { CartService } from '../core/cart.service';
import { money } from '../core/formatters';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Product catalog</h2>
        <p>Anonymous product browsing is backed by GET /api/products. Staff-only product edits live under Management.</p>
      </div>
      <a class="btn primary" routerLink="/cart">Cart ({{ cart.count() }})</a>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    <section class="panel">
      <div class="panel-header toolbar">
        <div class="toolbar-left">
          <input class="input" style="width: min(360px, 100%);" name="search" [(ngModel)]="query.search" (keyup.enter)="load()" placeholder="Search products or SKU">
          <select class="select" style="width: 180px;" name="sortBy" [(ngModel)]="query.sortBy" (change)="load()">
            <option value="name">Name</option>
            <option value="sku">SKU</option>
            <option value="price">Price</option>
          </select>
          <button class="btn" type="button" (click)="toggleSort()">Sort {{ query.sortDescending ? 'desc' : 'asc' }}</button>
        </div>
        <div class="toolbar-right">
          <button class="btn ghost" type="button" (click)="previousPage()" [disabled]="query.pageNumber <= 1">Previous</button>
          <span class="badge">Page {{ query.pageNumber }}</span>
          <button class="btn ghost" type="button" (click)="nextPage()" [disabled]="products.length < query.pageSize">Next</button>
        </div>
      </div>
      <div class="panel-body" [class.loading]="loading">
        <div class="product-grid">
          @for (product of products; track product.id) {
            <article class="product-card">
              <div class="device-art" aria-hidden="true"></div>
              <div>
                <span class="badge">{{ optionLabel(product.productType) }}</span>
                <h3 style="margin: 8px 0 4px;">{{ product.name }}</h3>
                <p class="muted" style="margin: 0;">{{ product.brandName }} - {{ product.categoryName }}</p>
              </div>
              <p class="muted" style="min-height: 42px;">{{ product.description || product.sku }}</p>
              <div class="toolbar">
                <strong>{{ money(product.price) }}</strong>
                <span class="badge" [class.bad]="product.quantityOnHand <= 0" [class.warn]="product.quantityOnHand > 0 && product.quantityOnHand <= product.reorderLevel">
                  Stock {{ product.quantityOnHand }}
                </span>
              </div>
              <div class="toolbar">
                <button class="btn ghost" type="button" (click)="viewDetails(product.id)">Details</button>
                <button class="btn primary" type="button" (click)="cart.add(product)" [disabled]="product.quantityOnHand <= 0">Add to cart</button>
              </div>
            </article>
          } @empty {
            <div class="empty-state">No products found.</div>
          }
        </div>
      </div>
    </section>

    @if (selectedProduct) {
      <section class="panel" style="margin-top: 16px;">
        <div class="panel-header">
          <strong>{{ selectedProduct.name }}</strong>
          <button class="btn ghost" type="button" (click)="selectedProduct = null">Close</button>
        </div>
        <div class="panel-body grid three">
          <div>
            <p class="muted">SKU</p>
            <strong>{{ selectedProduct.sku }}</strong>
          </div>
          <div>
            <p class="muted">Pricing</p>
            <strong>{{ money(selectedProduct.price) }}</strong>
          </div>
          <div>
            <p class="muted">Tax and discount</p>
            <strong>{{ selectedProduct.taxPercentage }}% tax, {{ money(selectedProduct.discountAmount) }} off</strong>
          </div>
          <div>
            <p class="muted">Category</p>
            <strong>{{ selectedProduct.categoryName }}</strong>
          </div>
          <div>
            <p class="muted">Brand</p>
            <strong>{{ selectedProduct.brandName }}</strong>
          </div>
          <div>
            <p class="muted">Inventory</p>
            <strong>{{ selectedProduct.quantityOnHand }} on hand</strong>
          </div>
        </div>
      </section>
    }
  `
})
export class CatalogComponent implements OnInit {
  products: ProductDto[] = [];
  selectedProduct: ProductDto | null = null;
  query = {
    search: '',
    sortBy: 'name',
    sortDescending: false,
    pageNumber: 1,
    pageSize: 12
  };
  loading = false;
  error = '';
  readonly money = money;

  constructor(
    private readonly api: ApiService,
    readonly cart: CartService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  optionLabel(value: number): string {
    return optionLabel(productTypeOptions, value as ProductType);
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.list<ProductDto>('/api/products', this.query).subscribe({
      next: (result) => {
        this.products = result.items;
        this.query.pageNumber = result.pageNumber;
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  viewDetails(productId: string): void {
    this.api.get<ProductDto>(`/api/products/${productId}`).subscribe({
      next: (product) => this.selectedProduct = product,
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  toggleSort(): void {
    this.query.sortDescending = !this.query.sortDescending;
    this.load();
  }

  previousPage(): void {
    this.query.pageNumber = Math.max(1, this.query.pageNumber - 1);
    this.load();
  }

  nextPage(): void {
    this.query.pageNumber += 1;
    this.load();
  }
}
