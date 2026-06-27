import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { BillDto, QueryParameters } from '../core/api.models';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Billing</h2>
        <p>Manage bills, view balances, and mark as paid.</p>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    <div class="panel" [class.loading]="loading">
      <div class="panel-body">
        @if (loading) {
          <div class="empty-state">Loading bills…</div>
        } @else {
          @if (bills.length === 0) {
            <div class="empty-state">No bills found. Create a bill from an order or seed sample data.</div>
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Due</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (bill of bills; track bill.id) {
                  <tr>
                    <td>{{ bill.billNumber }}</td>
                    <td>{{ bill.orderNumber }}</td>
                    <td>{{ bill.customerName }}</td>
                    <td>{{ bill.dueAtUtc | date:'short' }}</td>
                    <td>{{ bill.totalAmount | number:'1.2-2' }}</td>
                    <td>{{ bill.balanceDue | number:'1.2-2' }}</td>
                    <td>{{ bill.statusText }}</td>
                    <td>
                      <a class="btn ghost" [routerLink]="['/billing', bill.id, 'print']">Print</a>
                      @if (bill.balanceDue > 0) {
                        <button class="btn" (click)="markPaid(bill.id)" style="margin-left:8px;">Mark paid</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        }
      </div>
    </div>
  `
})
export class BillingComponent implements OnInit {
  bills: BillDto[] = [];
  loading = false;
  error = '';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading = true;
    this.error = '';

    const query: QueryParameters = { pageNumber: 1, pageSize: 50 };
    this.api.list<BillDto>('/api/billing', query).subscribe({
      next: (result) => (this.bills = result.items),
      error: (err) => {
        this.error = apiErrorMessage(err);
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });
  }

  markPaid(id: string): void {
    this.api.post(`/api/billing/${id}/pay`, {}).subscribe({
      next: () => this.loadBills(),
      error: (err) => (this.error = apiErrorMessage(err))
    });
  }
}
