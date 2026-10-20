import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { BillDto, CustomerDto, OrderDto, ProductDto, PromoCodeDto, QueryParameters } from '../core/api.models';
import { money, dateTime } from '../core/formatters';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="billing-page">
      <!-- Store Identity & Page Header -->
      <div class="page-header">
        <div>
          <div class="store-badge">
            <span class="dot-online"></span>
            <span>📱 Mobile Shop Management • Newtown Kolkata • Prop: Chandan Kr Mandal (+91 9851632391)</span>
          </div>
          <h2>🧾 Billing & POS Invoicing Center</h2>
          <p>Instant walk-in counter billing, standard A4 GST tax invoices, and 80mm POS thermal slips</p>
        </div>
        <div class="header-actions">
          <button class="btn secondary" type="button" (click)="loadBills()">
            🔄 Refresh
          </button>
          <button class="btn primary pos-btn" type="button" (click)="toggleQuickBill()">
            {{ showQuickBillModal ? '✕ Close POS Form' : '⚡ + Fast POS Walk-in Bill' }}
          </button>
        </div>
      </div>

      @if (error) {
        <div class="message error" style="margin-bottom: 16px;">{{ error }}</div>
      }
      @if (successMessage) {
        <div class="message success" style="margin-bottom: 16px;">{{ successMessage }}</div>
      }

      <!-- Financial Performance KPI Summary -->
      <section class="grid four kpi-grid">
        <div class="metric kpi-card blue">
          <span class="kpi-title">Total Invoices</span>
          <strong class="kpi-value">{{ bills.length }}</strong>
          <p class="kpi-sub">Total billed transactions</p>
        </div>

        <div class="metric kpi-card green">
          <span class="kpi-title">Total Billed Value</span>
          <strong class="kpi-value">{{ money(totalBilledAmount) }}</strong>
          <p class="kpi-sub">Gross invoiced volume</p>
        </div>

        <div class="metric kpi-card teal">
          <span class="kpi-title">Collected Revenue</span>
          <strong class="kpi-value">{{ money(totalCollectedAmount) }}</strong>
          <p class="kpi-sub">Cleared cash & UPI payments</p>
        </div>

        <div class="metric kpi-card amber">
          <span class="kpi-title">Outstanding Due</span>
          <strong class="kpi-value" [class.danger-text]="totalBalanceDue > 0">{{ money(totalBalanceDue) }}</strong>
          <p class="kpi-sub">{{ dueCount }} bills awaiting settlement</p>
        </div>
      </section>

      <!-- Top-Expandable Quick POS Walk-in Billing Form -->
      @if (showQuickBillModal) {
        <section class="top-form-card" [class.loading]="submittingQuickBill" style="margin-bottom: 22px;">
          <div class="top-form-header">
            <div class="top-form-title">
              <span class="badge good">⚡ FAST POS BILL</span>
              <h3>Quick Walk-in Counter POS Billing</h3>
            </div>
            <button class="btn ghost" type="button" (click)="closeQuickBillModal()" title="Collapse POS billing form">
              ✕ Close
            </button>
          </div>

          <div class="top-form-body">
            @if (modalError) {
              <div class="message error" style="margin-bottom: 12px;">{{ modalError }}</div>
            }

            <div class="grid three">
              <label class="field">
                <span>Select Existing Customer</span>
                <select class="input" [(ngModel)]="quickBill.customerProfileId" (change)="onCustomerSelected()">
                  @for (c of customers; track c.id) {
                    <option [value]="c.id">{{ c.fullName }} ({{ c.phoneNumber }})</option>
                  }
                </select>
              </label>

              <label class="field">
                <span>Customer Mobile Number</span>
                <input type="text" class="input" [(ngModel)]="quickBill.phoneNumber" placeholder="e.g. 9851632391" />
              </label>

              <label class="field">
                <span>Payment Mode</span>
                <select class="input" [(ngModel)]="quickBill.paymentMethod">
                  <option value="Cash">Cash Counter</option>
                  <option value="UPI (GPay / PhonePe / Paytm)">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Credit / Debit Card">Credit / Debit Card</option>
                </select>
              </label>
            </div>

            <div class="grid three" style="margin-top: 10px;">
              <label class="field" style="grid-column: span 2;">
                <span>Select Product Catalog SKU <span class="required-star">*</span></span>
                <select class="input" [(ngModel)]="quickBill.productId" (change)="onProductSelected()">
                  <option value="">-- Choose Smartphone / Accessory --</option>
                  @for (p of products; track p.id) {
                    <option [value]="p.id">
                      {{ p.name }} - ₹{{ p.price | number:'1.2-2' }} (Stock: {{ p.quantityOnHand }})
                    </option>
                  }
                </select>
              </label>

              <label class="field">
                <span>Quantity</span>
                <input type="number" min="1" class="input" [(ngModel)]="quickBill.quantity" (change)="recalcModalTotal()" />
              </label>
            </div>

            <div class="grid two" style="margin-top: 10px;">
              <label class="field">
                <span>Device IMEI / Serial Number (Optional)</span>
                <input type="text" class="input" [(ngModel)]="quickBill.imeiNumber" placeholder="e.g. 356789123456789" />
              </label>

              <div>
                <label class="field">
                  <span>Promotional Coupon Code (Optional)</span>
                  @if (quickBill.appliedPromo) {
                    <div class="modal-applied-promo">
                      <div>
                        <strong>✓ Coupon {{ quickBill.appliedPromo.code }} Applied!</strong>
                        <span class="disc-sub">Deduction: -₹{{ quickModalDiscount() | number:'1.2-2' }}</span>
                      </div>
                      <button type="button" class="btn-clear-promo" (click)="removeModalPromo()">✕ Remove</button>
                    </div>
                  } @else {
                    <div class="promo-apply-row">
                      <input
                        type="text"
                        class="input"
                        [(ngModel)]="quickBill.promoCode"
                        placeholder="e.g. DIWALI2026, SAVE10, FLAT500"
                        style="text-transform: uppercase;"
                        (keyup.enter)="applyModalPromo()"
                      />
                      <button
                        type="button"
                        class="btn-apply-code"
                        [disabled]="validatingModalPromo || !quickBill.promoCode.trim()"
                        (click)="applyModalPromo()"
                      >
                        {{ validatingModalPromo ? 'Checking...' : 'Apply Code' }}
                      </button>
                    </div>
                    @if (modalPromoError) {
                      <div class="modal-promo-err">{{ modalPromoError }}</div>
                    }
                    <div class="modal-quick-chips">
                      <span class="chips-lbl">Quick Deals:</span>
                      <button type="button" class="m-chip" (click)="setModalPromo('DIWALI2026')">DIWALI2026 (-₹2500)</button>
                      <button type="button" class="m-chip" (click)="setModalPromo('SAVE10')">SAVE10 (10% OFF)</button>
                      <button type="button" class="m-chip" (click)="setModalPromo('FLAT500')">FLAT500 (-₹500)</button>
                    </div>
                  }
                </label>
              </div>
            </div>

            <!-- Price & Tax Calculation Summary -->
            <div class="calc-box" style="margin-top: 14px;">
              <div class="calc-row">
                <span>Selected Item:</span>
                <strong>{{ quickBill.selectedProductName || 'None selected' }}</strong>
              </div>
              <div class="calc-row">
                <span>Gross Subtotal:</span>
                <span>{{ quickBill.quantity }} × ₹{{ quickBill.unitPrice | number:'1.2-2' }} = <strong>₹{{ quickModalSubtotal() | number:'1.2-2' }}</strong></span>
              </div>
              @if (quickModalDiscount() > 0) {
                <div class="calc-row disc-calc">
                  <span>Discount ({{ quickBill.appliedPromo?.code || 'Special' }}):</span>
                  <strong>-₹{{ quickModalDiscount() | number:'1.2-2' }}</strong>
                </div>
              }
              <div class="calc-row taxable-calc">
                <span>Net Taxable Value:</span>
                <strong>₹{{ quickModalTaxable() | number:'1.2-2' }}</strong>
              </div>
              <div class="calc-row">
                <span>Central GST (CGST &#64; 9.0%):</span>
                <span>+₹{{ quickModalCgst() | number:'1.2-2' }}</span>
              </div>
              <div class="calc-row">
                <span>State GST (SGST &#64; 9.0%):</span>
                <span>+₹{{ quickModalSgst() | number:'1.2-2' }}</span>
              </div>
              <div class="calc-row total-row">
                <span>Total Amount Payable:</span>
                <strong class="total-big">₹{{ quickModalTotal() | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div class="top-form-footer">
              <button class="btn ghost" type="button" (click)="closeQuickBillModal()">Cancel</button>
              <div style="display: flex; gap: 8px;">
                <button
                  type="button"
                  class="btn-format pos-80mm-btn"
                  [disabled]="submittingQuickBill || !quickBill.productId"
                  (click)="submitQuickBill('80mm')"
                >
                  {{ submittingQuickBill ? 'Processing...' : '🧾 Save & Print 80mm Slip' }}
                </button>
                <button
                  type="button"
                  class="btn-format a4-btn"
                  [disabled]="submittingQuickBill || !quickBill.productId"
                  (click)="submitQuickBill('a4')"
                >
                  {{ submittingQuickBill ? 'Processing...' : '📄 Save & Print A4 Invoice' }}
                </button>
              </div>
            </div>
          </div>
        </section>
      }

      <!-- Main Panel with Search, Filters & Invoices Table -->
      <div class="panel" [class.loading]="loading">
        <div class="panel-header toolbar-wrap">
          <!-- Search & Filter Controls -->
          <div class="toolbar-left">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                class="input search-input"
                [(ngModel)]="searchQuery"
                (input)="applyFilter()"
                placeholder="Search Bill #, Order #, or Customer..."
              />
              @if (searchQuery) {
                <button class="clear-btn" (click)="searchQuery = ''; applyFilter()">✕</button>
              }
            </div>

            <!-- Status Filter Tabs -->
            <div class="filter-tabs">
              <button
                type="button"
                class="tab-btn"
                [class.active]="statusFilter === 'all'"
                (click)="setStatusFilter('all')"
              >
                All ({{ bills.length }})
              </button>
              <button
                type="button"
                class="tab-btn"
                [class.active]="statusFilter === 'paid'"
                (click)="setStatusFilter('paid')"
              >
                Cleared ({{ paidCount }})
              </button>
              <button
                type="button"
                class="tab-btn warn"
                [class.active]="statusFilter === 'due'"
                (click)="setStatusFilter('due')"
              >
                Due ({{ dueCount }})
              </button>
            </div>
          </div>

          <div class="toolbar-right">
            <span class="text-muted" style="font-size: 0.85rem;">
              Showing {{ filteredBills.length }} of {{ bills.length }} bills
            </span>
          </div>
        </div>

        <div class="panel-body table-wrap">
          @if (loading) {
            <div class="empty-state">
              <div class="spinner"></div>
              <p>Loading billing records...</p>
            </div>
          } @else if (filteredBills.length === 0) {
            <div class="empty-state">
              <p>No bills found matching your criteria.</p>
              @if (bills.length === 0) {
                <button class="btn primary" style="margin-top: 10px;" (click)="openQuickBillModal()">
                  Create First POS Walk-in Bill
                </button>
              }
            </div>
          } @else {
            <table class="table billing-table">
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Order Ref</th>
                  <th>Customer</th>
                  <th>Date Issued</th>
                  <th>Total (₹)</th>
                  <th>Balance Due (₹)</th>
                  <th>Status</th>
                  <th class="actions">Print & Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (bill of filteredBills; track bill.id) {
                  <tr class="bill-row">
                    <td>
                      <span class="bill-num-badge">{{ bill.billNumber }}</span>
                    </td>
                    <td>
                      <span class="order-ref">{{ bill.orderNumber || 'Counter POS' }}</span>
                    </td>
                    <td>
                      <div class="customer-cell">
                        <strong>{{ bill.customerName || 'Walk-in Customer' }}</strong>
                        @if (bill.deliveryAddress) {
                          <span class="city-subtext">{{ bill.deliveryAddress.city }}</span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="date-text">{{ bill.issuedAtUtc | date:'dd-MMM-yyyy, HH:mm' }}</span>
                    </td>
                    <td>
                      <strong>₹{{ bill.totalAmount | number:'1.2-2' }}</strong>
                    </td>
                    <td>
                      @if (bill.balanceDue === 0) {
                        <span class="zero-balance">₹0.00</span>
                      } @else {
                        <span class="active-balance">₹{{ bill.balanceDue | number:'1.2-2' }}</span>
                      }
                    </td>
                    <td>
                      <span
                        class="status-tag"
                        [class.paid]="bill.balanceDue === 0"
                        [class.due]="bill.balanceDue > 0"
                      >
                        {{ bill.balanceDue === 0 ? '✓ PAID' : '⏳ BALANCE DUE' }}
                      </span>
                    </td>
                    <td class="actions">
                      <div class="action-btn-group">
                        <!-- Direct A4 Format Print -->
                        <a
                          class="btn-format a4-btn"
                          [routerLink]="['/billing', bill.id, 'print']"
                          [queryParams]="{ format: 'a4' }"
                          title="Print Standard A4 GST Tax Invoice"
                        >
                          📄 A4 Tax Invoice
                        </a>

                        <!-- Direct 80mm POS Thermal Slip Print -->
                        <a
                          class="btn-format pos-80mm-btn"
                          [routerLink]="['/billing', bill.id, 'print']"
                          [queryParams]="{ format: '80mm' }"
                          title="Print 80mm POS Thermal Receipt"
                        >
                          🧾 80mm POS Slip
                        </a>

                        <!-- Quick Mark Paid -->
                        @if (bill.balanceDue > 0) {
                          <button
                            type="button"
                            class="btn-settle"
                            (click)="markPaid(bill.id)"
                            title="Settle outstanding balance"
                          >
                            💳 Settle
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .billing-page {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .store-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #0d7a5f;
      background: #e6f4ea;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 6px;
      border: 1px solid #b7e1cd;
    }

    .dot-online {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #16a34a;
      box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.25);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .page-header h2 {
      margin: 0;
      font-size: 1.55rem;
      color: #0f172a;
    }

    .page-header p {
      margin: 4px 0 0 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .pos-btn {
      background: #0d7a5f;
      color: #fff;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(13, 122, 95, 0.25);
    }
    .pos-btn:hover { background: #09614b; }

    /* KPI Grid */
    .kpi-grid {
      margin-bottom: 2px;
    }

    .kpi-card {
      background: #ffffff;
      padding: 16px 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      position: relative;
      overflow: hidden;
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }

    .kpi-card.blue::before { background: #3b82f6; }
    .kpi-card.green::before { background: #10b981; }
    .kpi-card.teal::before { background: #0d7a5f; }
    .kpi-card.amber::before { background: #f59e0b; }

    .kpi-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-value {
      display: block;
      font-size: 1.65rem;
      font-weight: 800;
      color: #0f172a;
      margin: 4px 0 2px 0;
    }

    .kpi-sub {
      margin: 0;
      font-size: 0.78rem;
      color: #94a3b8;
    }

    .danger-text { color: #dc2626 !important; }

    /* Toolbar & Search */
    .toolbar-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
      padding: 14px 20px;
      border-bottom: 1px solid #e2e8f0;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      position: relative;
      width: 320px;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .search-input {
      padding-left: 32px !important;
      padding-right: 28px !important;
      font-size: 0.88rem;
      border-radius: 8px;
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      font-size: 0.8rem;
    }

    .filter-tabs {
      display: inline-flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .tab-btn {
      border: none;
      background: transparent;
      padding: 6px 12px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .tab-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .tab-btn.warn.active {
      color: #d97706;
    }

    /* Invoices Table */
    .billing-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }

    .billing-table th {
      background: #f8fafc;
      padding: 12px 16px;
      font-weight: 700;
      color: #475569;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid #e2e8f0;
    }

    .billing-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .bill-row:hover {
      background: #f8fafc;
    }

    .bill-num-badge {
      font-family: monospace;
      font-weight: 700;
      color: #0d7a5f;
      background: #e6f4ea;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.82rem;
    }

    .order-ref {
      font-size: 0.82rem;
      color: #64748b;
      font-family: monospace;
    }

    .customer-cell strong {
      display: block;
      color: #0f172a;
    }

    .city-subtext {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .date-text {
      font-size: 0.82rem;
      color: #475569;
    }

    .zero-balance {
      color: #16a34a;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .active-balance {
      color: #dc2626;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .status-tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }

    .status-tag.paid {
      background: #dcfce7;
      color: #15803d;
    }

    .status-tag.due {
      background: #fee2e2;
      color: #b91c1c;
    }

    .action-btn-group {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-format {
      padding: 6px 10px;
      font-size: 0.78rem;
      font-weight: 600;
      border-radius: 6px;
      text-decoration: none;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .a4-btn {
      background: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }
    .a4-btn:hover {
      background: #0d7a5f;
      color: #ffffff;
      border-color: #0d7a5f;
    }

    .pos-80mm-btn {
      background: #e0f2fe;
      color: #0369a1;
      border-color: #bae6fd;
    }
    .pos-80mm-btn:hover {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
    }

    .btn-settle {
      padding: 5px 9px;
      font-size: 0.75rem;
      font-weight: 700;
      background: #16a34a;
      color: #fff;
      border-radius: 6px;
      cursor: pointer;
      border: none;
    }
    .btn-settle:hover { background: #15803d; }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal-content {
      background: #ffffff;
      border-radius: 14px;
      width: 100%;
      max-width: 620px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      animation: modalIn 0.2s ease-out;
    }

    @keyframes modalIn {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      padding: 18px 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #0f172a;
    }

    .modal-header p {
      margin: 4px 0 0;
      font-size: 0.82rem;
      color: #64748b;
    }

    .close-modal-btn {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #94a3b8;
    }
    .close-modal-btn:hover { color: #0f172a; }

    .modal-body {
      padding: 20px 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .form-section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: #0d7a5f;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 8px;
    }

    .calc-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 14px;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #475569;
      margin: 4px 0;
    }

    .total-row {
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      margin-top: 6px;
      font-size: 1rem;
      color: #0f172a;
      font-weight: 800;
    }

    .total-row strong {
      color: #0d7a5f;
      font-size: 1.15rem;
    }

    .modal-footer {
      padding: 14px 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .modal-print-actions {
      display: flex;
      gap: 10px;
    }

    .promo-apply-row {
      display: flex;
      gap: 6px;
    }

    .btn-apply-code {
      background: #0d7a5f;
      color: #fff;
      border: none;
      padding: 6px 12px;
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-apply-code:disabled { opacity: 0.5; cursor: not-allowed; }

    .modal-promo-err {
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 4px;
      font-weight: 500;
    }

    .modal-applied-promo {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #dcfce7;
      border: 1px solid #86efac;
      padding: 8px 12px;
      border-radius: 6px;
    }
    .modal-applied-promo strong { color: #166534; font-size: 0.85rem; display: block; }
    .disc-sub { font-size: 0.75rem; color: #15803d; font-weight: 600; }

    .btn-clear-promo {
      background: transparent;
      border: 1px solid #dc2626;
      color: #dc2626;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.72rem;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-clear-promo:hover { background: #fee2e2; }

    .modal-quick-chips {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .chips-lbl { font-size: 0.7rem; color: #64748b; font-weight: 600; }
    .m-chip {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 0.72rem;
      color: #334155;
      cursor: pointer;
      font-weight: 600;
    }
    .m-chip:hover { background: #e2e8f0; color: #0f172a; border-color: #94a3b8; }

    .disc-calc { color: #dc2626; font-weight: 600; }
    .taxable-calc { color: #1e293b; font-weight: 600; }
    .total-big { font-size: 1.25rem !important; color: #0d7a5f !important; font-weight: 900 !important; }
  `]
})
export class BillingComponent implements OnInit {
  bills: BillDto[] = [];
  filteredBills: BillDto[] = [];
  customers: CustomerDto[] = [];
  products: ProductDto[] = [];

  loading = false;
  error = '';
  successMessage = '';
  searchQuery = '';
  statusFilter: 'all' | 'paid' | 'due' = 'all';

  // Fast POS Modal State
  showQuickBillModal = false;
  submittingQuickBill = false;
  validatingModalPromo = false;
  modalPromoError = '';
  modalError = '';
  quickBill = {
    customerProfileId: '',
    customerName: '',
    phoneNumber: '',
    productId: '',
    selectedProductName: '',
    unitPrice: 0,
    quantity: 1,
    imeiNumber: '',
    paymentMethod: 'Cash',
    promoCode: '',
    appliedPromo: null as PromoCodeDto | null
  };

  readonly money = money;
  readonly dateTime = dateTime;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadBills();
    this.loadPrerequisites();
  }

  loadBills(): void {
    this.loading = true;
    this.error = '';

    const query: QueryParameters = { pageNumber: 1, pageSize: 100 };
    this.api.list<BillDto>('/api/billing', query).subscribe({
      next: (result) => {
        this.bills = result.items;
        this.applyFilter();
      },
      error: (err) => {
        this.error = apiErrorMessage(err);
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });
  }

  loadPrerequisites(): void {
    // Load customers for quick modal
    this.api.list<CustomerDto>('/api/customers', { pageNumber: 1, pageSize: 50 }).subscribe({
      next: (res) => {
        this.customers = res.items;
        if (this.customers.length > 0 && !this.quickBill.customerProfileId) {
          this.quickBill.customerProfileId = this.customers[0].id;
          this.quickBill.phoneNumber = this.customers[0].phoneNumber;
          this.quickBill.customerName = this.customers[0].fullName;
        }
      }
    });

    // Load products for quick modal
    this.api.list<ProductDto>('/api/products', { pageNumber: 1, pageSize: 50 }).subscribe({
      next: (res) => (this.products = res.items)
    });
  }

  // Financial Metrics Getters
  get totalBilledAmount(): number {
    return this.bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }

  get totalCollectedAmount(): number {
    return this.bills.reduce((sum, b) => sum + ((b.totalAmount || 0) - (b.balanceDue || 0)), 0);
  }

  get totalBalanceDue(): number {
    return this.bills.reduce((sum, b) => sum + (b.balanceDue || 0), 0);
  }

  get paidCount(): number {
    return this.bills.filter((b) => b.balanceDue === 0).length;
  }

  get dueCount(): number {
    return this.bills.filter((b) => b.balanceDue > 0).length;
  }

  setStatusFilter(filter: 'all' | 'paid' | 'due'): void {
    this.statusFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredBills = this.bills.filter((bill) => {
      // Status match
      if (this.statusFilter === 'paid' && bill.balanceDue > 0) return false;
      if (this.statusFilter === 'due' && bill.balanceDue === 0) return false;

      // Query match
      if (!q) return true;
      const bNum = (bill.billNumber || '').toLowerCase();
      const oNum = (bill.orderNumber || '').toLowerCase();
      const cName = (bill.customerName || '').toLowerCase();
      return bNum.includes(q) || oNum.includes(q) || cName.includes(q);
    });
  }

  markPaid(id: string): void {
    this.error = '';
    this.api.post(`/api/billing/${id}/pay`, {}).subscribe({
      next: () => {
        this.successMessage = 'Payment registered and bill cleared.';
        setTimeout(() => (this.successMessage = ''), 3500);
        this.loadBills();
      },
      error: (err) => (this.error = apiErrorMessage(err))
    });
  }

  // Quick POS Actions
  toggleQuickBill(): void {
    if (this.showQuickBillModal) {
      this.closeQuickBillModal();
    } else {
      this.openQuickBillModal();
    }
  }

  openQuickBillModal(): void {
    this.modalError = '';
    this.modalPromoError = '';
    this.showQuickBillModal = true;
    if (this.products.length > 0 && !this.quickBill.productId) {
      this.quickBill.productId = this.products[0].id;
      this.onProductSelected();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeQuickBillModal(): void {
    this.showQuickBillModal = false;
  }

  onCustomerSelected(): void {
    const cust = this.customers.find((c) => c.id === this.quickBill.customerProfileId);
    if (cust) {
      this.quickBill.phoneNumber = cust.phoneNumber;
      this.quickBill.customerName = cust.fullName;
    }
  }

  onProductSelected(): void {
    const prod = this.products.find((p) => p.id === this.quickBill.productId);
    if (prod) {
      this.quickBill.selectedProductName = prod.name;
      this.quickBill.unitPrice = prod.price;
      if (!this.quickBill.imeiNumber && (prod.name.toLowerCase().includes('galaxy') || prod.name.toLowerCase().includes('phone'))) {
        this.quickBill.imeiNumber = 'IMEI: 359' + Math.floor(100000000000 + Math.random() * 900000000000);
      }
    }
  }

  recalcModalTotal(): void {
    if (this.quickBill.quantity < 1) this.quickBill.quantity = 1;
  }

  setModalPromo(code: string): void {
    this.quickBill.promoCode = code;
    this.applyModalPromo();
  }

  applyModalPromo(): void {
    const code = (this.quickBill.promoCode || '').trim().toUpperCase();
    if (!code) return;

    this.validatingModalPromo = true;
    this.modalPromoError = '';

    this.api.get<PromoCodeDto>(`/api/promocodes/validate/${code}`).subscribe({
      next: (promo) => {
        this.validatingModalPromo = false;
        this.quickBill.appliedPromo = promo;
        this.modalPromoError = '';
      },
      error: (err) => {
        this.validatingModalPromo = false;
        this.modalPromoError = apiErrorMessage(err) || `Promo code '${code}' is invalid or expired.`;
      }
    });
  }

  removeModalPromo(): void {
    this.quickBill.appliedPromo = null;
    this.quickBill.promoCode = '';
    this.modalPromoError = '';
  }

  quickModalSubtotal(): number {
    return (this.quickBill.quantity || 1) * (this.quickBill.unitPrice || 0);
  }

  quickModalDiscount(): number {
    const promo = this.quickBill.appliedPromo;
    if (!promo) return 0;
    const base = this.quickModalSubtotal();
    let disc = promo.discountAmount || 0;
    if (promo.discountPercentage) {
      disc += base * (promo.discountPercentage / 100);
    }
    return Math.min(disc, base);
  }

  quickModalTaxable(): number {
    return Math.max(0, this.quickModalSubtotal() - this.quickModalDiscount());
  }

  quickModalCgst(): number {
    return Math.round(this.quickModalTaxable() * 0.09 * 100) / 100;
  }

  quickModalSgst(): number {
    return Math.round(this.quickModalTaxable() * 0.09 * 100) / 100;
  }

  quickModalTax(): number {
    return this.quickModalCgst() + this.quickModalSgst();
  }

  quickModalTotal(): number {
    return this.quickModalTaxable() + this.quickModalTax();
  }

  submitQuickBill(format: 'a4' | '80mm'): void {
    if (!this.quickBill.productId) {
      this.modalError = 'Please select a product item.';
      return;
    }
    if (!this.quickBill.customerProfileId) {
      this.modalError = 'Please select or choose a customer.';
      return;
    }

    this.submittingQuickBill = true;
    this.modalError = '';

    const promoCodeToSend = this.quickBill.appliedPromo?.code || (this.quickBill.promoCode ? this.quickBill.promoCode.trim().toUpperCase() : null);

    const orderPayload = {
      customerProfileId: this.quickBill.customerProfileId,
      promoCode: promoCodeToSend,
      items: [
        {
          productId: this.quickBill.productId,
          quantity: this.quickBill.quantity
        }
      ]
    };

    // 1. Create order
    this.api.post<OrderDto>('/api/orders', orderPayload).subscribe({
      next: (order) => {
        if (order.billId) {
          this.submittingQuickBill = false;
          this.showQuickBillModal = false;
          this.loadBills();
          this.router.navigate(['/billing', order.billId, 'print'], {
            queryParams: { format }
          });
          return;
        }

        // 2. Ensure bill for order (fallback)
        this.api.post<BillDto>(`/api/billing/orders/${order.id}/ensure`, {}).subscribe({
          next: (bill) => {
            this.submittingQuickBill = false;
            this.showQuickBillModal = false;
            this.loadBills();
            // 3. Immediately launch print view in requested format
            this.router.navigate(['/billing', bill.id, 'print'], {
              queryParams: { format }
            });
          },
          error: (err) => {
            this.submittingQuickBill = false;
            this.modalError = 'Order created, but bill generation failed: ' + apiErrorMessage(err);
          }
        });
      },
      error: (err) => {
        this.submittingQuickBill = false;
        this.modalError = 'Failed to create POS order: ' + apiErrorMessage(err);
      }
    });
  }
}
