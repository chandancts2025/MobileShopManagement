import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { BillDto } from '../core/api.models';

@Component({
  selector: 'app-billing-print',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="billing-print-page">
      <div class="print-container">
        <div class="print-actions" style="text-align:right; margin-bottom:12px;">
          <button class="btn" (click)="print()">Print</button>
        </div>

      @if (error) {
        <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
      }

      @if (loading) {
        <div>Loading bill...</div>
      } @else if (bill) {
        <div class="invoice">
          <header class="invoice-header">
            <div class="shop">
              <h1>Mobile Shop</h1>
              <div>Retail operations</div>
              <div>Phone: 000-000-0000</div>
              <div>Address: 123 Retail Lane, City</div>
            </div>
            <div class="meta">
              <div><strong>Bill #</strong> {{ bill.billNumber }}</div>
              <div><strong>Date</strong> {{ bill.issuedAtUtc | date:'medium' }}</div>
              <div><strong>Status</strong> {{ bill.statusText }}</div>
            </div>
          </header>

          <section class="customer">
            <h3>Customer</h3>
            <div>{{ bill.customerName }}</div>
          </section>

          @if (bill.deliveryAddress) {
            <section class="address-block">
              <h4>Delivery address</h4>
              <div>{{ bill.deliveryAddress.line1 }}</div>
              @if (bill.deliveryAddress.line2) {
                <div>{{ bill.deliveryAddress.line2 }}</div>
              }
              <div>{{ bill.deliveryAddress.city }}, {{ bill.deliveryAddress.state }}</div>
              <div>{{ bill.deliveryAddress.country }} - {{ bill.deliveryAddress.postalCode }}</div>
            </section>
          }

          @if (bill.shippingAddress) {
            <section class="address-block">
              <h4>Shipping address</h4>
              <div>{{ bill.shippingAddress.line1 }}</div>
              @if (bill.shippingAddress.line2) {
                <div>{{ bill.shippingAddress.line2 }}</div>
              }
              <div>{{ bill.shippingAddress.city }}, {{ bill.shippingAddress.state }}</div>
              <div>{{ bill.shippingAddress.country }} - {{ bill.shippingAddress.postalCode }}</div>
            </section>
          }

          <section class="items">
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                @for (item of bill.items; track item.id) {
                  <tr>
                    <td>{{ item.description }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.unitPrice | number:'1.2-2' }}</td>
                    <td>{{ item.totalAmount | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </section>

          <section class="totals" style="margin-top:12px; text-align:right;">
            <div>Subtotal: {{ bill.subtotal | number:'1.2-2' }}</div>
            <div>Tax: {{ bill.taxAmount | number:'1.2-2' }}</div>
            <div>Discount: {{ bill.discountAmount | number:'1.2-2' }}</div>
            <div><strong>Grand total: {{ bill.totalAmount | number:'1.2-2' }}</strong></div>
            <div>Balance due: {{ bill.balanceDue | number:'1.2-2' }}</div>
          </section>

          <footer style="margin-top:20px; font-size:0.9rem; color:var(--muted);">
            <div>Thank you for your business.</div>
            <div>Powered by Mobile Shop Management</div>
          </footer>
        </div>
      } @else {
        <div>Bill not found.</div>
      }

      </div>
    </div>
  `,
  styles: [`
    .invoice { max-width: 800px; margin: 0 auto; padding: 16px; border: 1px solid var(--line); background: #fff }
    .invoice-header { display:flex; justify-content:space-between; align-items:flex-start }
    .invoice-header .shop h1 { margin:0 }
    .table { width:100%; border-collapse: collapse }
    .table th, .table td { padding:8px; border-bottom:1px solid var(--line); text-align:left }
    @media print { .print-actions { display:none } .invoice { border:none } }
  `]
})
export class BillingPrintComponent implements OnInit {
  bill: BillDto | null = null;
  loading = false;
  error = '';

  constructor(private readonly route: ActivatedRoute, private readonly api: ApiService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No bill id provided.';
      return;
    }

    this.loadBill(id);
  }

  loadBill(id: string): void {
    this.loading = true;
    this.error = '';
    this.api.get<BillDto>(`/api/billing/${id}`).subscribe({
      next: (b) => this.bill = b,
      error: (err) => this.error = apiErrorMessage(err),
      complete: () => this.loading = false
    });
  }

  print(): void {
    window.print();
  }
}
