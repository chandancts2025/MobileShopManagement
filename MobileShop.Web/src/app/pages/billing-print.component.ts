import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { BillDto } from '../core/api.models';

@Component({
  selector: 'app-billing-print',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="billing-print-page" [class.mode-80mm]="selectedFormat === '80mm'" [class.mode-a4]="selectedFormat === 'a4'">
      <!-- Non-printing Control Toolbar -->
      <header class="no-print screen-toolbar">
        <div class="toolbar-container">
          <div class="toolbar-brand">
            <a [routerLink]="isCustomer ? '/customer-orders' : '/billing'" class="back-link">&larr; Back to {{ isCustomer ? 'My Orders' : 'Billing' }}</a>
            <h3>Receipt & Invoice Generator</h3>
          </div>

          <!-- Format Switcher -->
          <div class="format-toggle">
            <span class="label">Print Format:</span>
            <div class="btn-group">
              <button
                type="button"
                class="btn format-btn"
                [class.active]="selectedFormat === 'a4'"
                (click)="selectedFormat = 'a4'"
              >
                📄 Standard A4 Tax Invoice
              </button>
              <button
                type="button"
                class="btn format-btn"
                [class.active]="selectedFormat === '80mm'"
                (click)="selectedFormat = '80mm'"
              >
                🧾 80mm POS Thermal Slip
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="toolbar-actions">
            @if (customerEmail) {
              <button
                type="button"
                class="btn ghost"
                [disabled]="sendingEmail"
                (click)="sendEmailInvoice()"
                title="Send invoice copy to customer via SMTP"
              >
                {{ sendingEmail ? '✉️ Sending...' : '✉️ Email Invoice' }}
              </button>
            }
            <button type="button" class="btn primary print-trigger-btn" (click)="print()">
              🖨️ Print Receipt (Ctrl+P)
            </button>
          </div>
        </div>

        <!-- Quick Customization Controls -->
        <div class="options-drawer">
          <div class="options-grid">
            <label class="opt-field">
              <span>Payment Mode</span>
              <select [(ngModel)]="paymentMode" class="opt-input">
                <option value="Cash">Cash</option>
                <option value="UPI (GPay / PhonePe / Paytm)">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Credit / Debit Card">Credit / Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Split Payment">Split Payment</option>
              </select>
            </label>

            <label class="opt-field">
              <span>Customer Mobile</span>
              <input type="text" [(ngModel)]="customerPhone" placeholder="Mobile number" class="opt-input" />
            </label>

            <label class="opt-field">
              <span>Customer GSTIN (Optional)</span>
              <input type="text" [(ngModel)]="customerGstin" placeholder="e.g. 19AAAAA0000A1Z5" class="opt-input" />
            </label>

            <label class="opt-field">
              <span>IMEI / Serial Details</span>
              <input type="text" [(ngModel)]="globalImei" placeholder="e.g. IMEI: 356789123456789" class="opt-input" />
            </label>

            <label class="opt-field wide">
              <span>Warranty / Remarks</span>
              <input type="text" [(ngModel)]="warrantyNote" class="opt-input" />
            </label>
          </div>

          @if (emailSentMessage) {
            <div class="notification success-toast">✓ {{ emailSentMessage }}</div>
          }
          @if (emailErrorMessage) {
            <div class="notification error-toast">⚠️ {{ emailErrorMessage }}</div>
          }
        </div>
      </header>

      @if (error) {
        <div class="message error no-print" style="max-width: 800px; margin: 20px auto;">{{ error }}</div>
      }

      @if (loading) {
        <div class="empty-state no-print" style="margin: 40px auto; text-align: center;">
          <div class="spinner"></div>
          <p>Loading bill details...</p>
        </div>
      } @else if (bill) {

        <!-- =========================================================================
             A4 STANDARD TAX INVOICE FORMAT
             ========================================================================= -->
        @if (selectedFormat === 'a4') {
          <div class="invoice-container invoice-a4">
            <!-- Invoice Header Bar -->
            <div class="a4-header-top">
              <div class="invoice-badge">TAX INVOICE / RETAIL CASH MEMO</div>
              <div class="copy-badge">ORIGINAL FOR RECIPIENT</div>
            </div>

            <!-- Shop Info & Invoice Metadata -->
            <div class="a4-grid-header">
              <div class="shop-col">
                <div class="shop-brand">
                  <span class="shop-logo">📱</span>
                  <div>
                    <h1 class="shop-title">MOBILE SHOP MANAGEMENT</h1>
                    <p class="shop-tagline">Smartphones • Tablets • Accessories • Multi-Brand Service</p>
                  </div>
                </div>
                <div class="shop-details">
                  <p><strong>Proprietor:</strong> Chandan Kr Mandal</p>
                  <p><strong>Store Address:</strong> 3B8-2D, Sanhita Township, Newtown, 700135, West Bengal</p>
                  <p><strong>Phone:</strong> +91 9851632391 &nbsp;|&nbsp; <strong>Email:</strong> chandankr.mandal87&#64;gmail.com</p>
                  <p><strong>GSTIN:</strong> 19AABCX1234F1Z8 &nbsp;|&nbsp; <strong>State Code:</strong> 19 (West Bengal)</p>
                </div>
              </div>

              <div class="meta-col">
                <table class="meta-table">
                  <tr>
                    <th>Invoice No:</th>
                    <td><strong>{{ bill.billNumber }}</strong></td>
                  </tr>
                  <tr>
                    <th>Invoice Date:</th>
                    <td>{{ bill.issuedAtUtc | date:'dd-MMM-yyyy, HH:mm' }}</td>
                  </tr>
                  <tr>
                    <th>Order Ref:</th>
                    <td>{{ bill.orderNumber || 'N/A' }}</td>
                  </tr>
                  <tr>
                    <th>Payment Mode:</th>
                    <td><span class="pay-mode-pill">{{ paymentMode }}</span></td>
                  </tr>
                  <tr>
                    <th>Payment Status:</th>
                    <td>
                      <span class="status-pill" [class.paid]="bill.balanceDue === 0" [class.due]="bill.balanceDue > 0">
                        {{ bill.balanceDue === 0 ? 'PAID / CLEARED' : 'BALANCE DUE' }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th>Place of Supply:</th>
                    <td>West Bengal (19)</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Customer / Bill-To & Ship-To Blocks (Amazon / Flipkart Style) -->
            <div class="a4-parties-grid">
              <div class="a4-customer-box">
                <div class="box-header">BILL TO (BUYER DETAILS)</div>
                <div class="box-body">
                  <p class="party-name"><strong>{{ bill.customerName || 'Walk-in Retail Customer' }}</strong></p>
                  <p class="party-address">
                    @if (bill.deliveryAddress) {
                      {{ bill.deliveryAddress.line1 }}, {{ bill.deliveryAddress.city }} - {{ bill.deliveryAddress.postalCode }}
                    } @else {
                      In-Store Counter Purchase, Newtown Main Branch
                    }
                  </p>
                  <p class="party-state"><strong>State / UT:</strong> West Bengal &nbsp;|&nbsp; <strong>State Code:</strong> 19</p>
                  <p class="party-contact"><strong>Phone:</strong> {{ customerPhone || '+91 9851632391' }}</p>
                  <p class="party-gst">
                    <strong>GSTIN / UIN:</strong> {{ customerGstin || 'Unregistered Consumer' }}
                  </p>
                </div>
              </div>

              <div class="a4-customer-box">
                <div class="box-header">SHIP TO (DELIVERY DESTINATION)</div>
                <div class="box-body">
                  <p class="party-name"><strong>{{ bill.customerName || 'Walk-in Retail Customer' }}</strong></p>
                  <p class="party-address">
                    @if (bill.deliveryAddress) {
                      {{ bill.deliveryAddress.line1 }}, {{ bill.deliveryAddress.city }} - {{ bill.deliveryAddress.postalCode }}
                    } @else {
                      In-Store Counter Delivery, 3B8-2D Sanhita Township
                    }
                  </p>
                  <p class="party-state"><strong>Place of Delivery:</strong> West Bengal (19)</p>
                  <p class="party-contact"><strong>Dispatch Mode:</strong> Immediate In-Store Handover</p>
                  <p class="party-gst"><strong>Reverse Charge:</strong> No (Tax payable by supplier)</p>
                </div>
              </div>
            </div>

            <!-- Items View Mode Switcher (Visible on Mobile Screens only) -->
            <div class="table-view-toggle no-print">
              <span class="toggle-label">Items View:</span>
              <div class="btn-group sm">
                <button
                  type="button"
                  class="btn toggle-btn"
                  [class.active]="itemsMobileView === 'cards'"
                  (click)="itemsMobileView = 'cards'"
                >
                  📱 Mobile Cards
                </button>
                <button
                  type="button"
                  class="btn toggle-btn"
                  [class.active]="itemsMobileView === 'table'"
                  (click)="itemsMobileView = 'table'"
                >
                  📊 Full Table
                </button>
              </div>
            </div>

            <!-- Mobile Itemized Cards View (High-density, completely responsive on phones) -->
            <div class="a4-items-mobile-view no-print" [class.force-hide]="itemsMobileView === 'table'">
              <div class="mobile-items-list">
                @for (item of bill.items; track item.id; let idx = $index) {
                  <div class="mobile-item-card">
                    <div class="mic-header">
                      <span class="mic-idx">#{{ idx + 1 }}</span>
                      <div class="mic-title-wrap">
                        <strong class="mic-title">{{ item.description }}</strong>
                        @if (globalImei) {
                          <span class="imei-pill">{{ globalImei }}</span>
                        }
                      </div>
                    </div>
                    <div class="mic-specs">Brand New • Retail Pack • 1-Year Manufacturer Warranty</div>
                    
                    <div class="mic-grid">
                      <div class="mic-cell">
                        <span class="mic-label">HSN / SAC</span>
                        <span class="mic-val font-mono">{{ getItemHsn(item) }}</span>
                      </div>
                      <div class="mic-cell text-center">
                        <span class="mic-label">Quantity</span>
                        <span class="mic-val font-bold">{{ item.quantity }}</span>
                      </div>
                      <div class="mic-cell text-right">
                        <span class="mic-label">Gross Rate</span>
                        <span class="mic-val">₹{{ (item.unitPrice || (item.totalAmount / (item.quantity || 1))) | number:'1.2-2' }}</span>
                      </div>
                    </div>

                    <div class="mic-grid sub-grid">
                      <div class="mic-cell">
                        <span class="mic-label">Taxable Value</span>
                        <span class="mic-val font-bold">₹{{ getItemTaxable(item, bill) | number:'1.2-2' }}</span>
                      </div>
                      <div class="mic-cell text-center">
                        <span class="mic-label">Discount</span>
                        <span class="mic-val disc-val">
                          @if (getItemDiscount(item, bill) > 0) {
                            -₹{{ getItemDiscount(item, bill) | number:'1.2-2' }}
                          } @else {
                            ₹0.00
                          }
                        </span>
                      </div>
                      <div class="mic-cell text-right">
                        <span class="mic-label">GST (9% + 9%)</span>
                        <span class="mic-val">₹{{ (getItemCgst(item, bill) + getItemSgst(item, bill)) | number:'1.2-2' }}</span>
                      </div>
                    </div>

                    <div class="mic-footer">
                      <span class="mic-footer-label">Item Total (Incl. Taxes):</span>
                      <strong class="mic-footer-val">₹{{ getItemTotal(item, bill) | number:'1.2-2' }}</strong>
                    </div>
                  </div>
                }
              </div>

              <!-- Mobile Items Grand Summary Bar -->
              <div class="mobile-items-summary-card">
                <div class="misc-row">
                  <span>Total Items:</span>
                  <strong>{{ bill.items.length }} ({{ getItemsQuantity(bill) }} units)</strong>
                </div>
                <div class="misc-row">
                  <span>Gross Subtotal:</span>
                  <span>₹{{ bill.subtotal | number:'1.2-2' }}</span>
                </div>
                @if (bill.discountAmount > 0) {
                  <div class="misc-row misc-disc">
                    <span>Total Discount:</span>
                    <span>-₹{{ bill.discountAmount | number:'1.2-2' }}</span>
                  </div>
                }
                <div class="misc-row">
                  <span>Total Taxable Amount:</span>
                  <strong>₹{{ getTaxableValue(bill) | number:'1.2-2' }}</strong>
                </div>
                <div class="misc-row">
                  <span>Total GST (CGST + SGST):</span>
                  <span>+₹{{ getTotalTax(bill) | number:'1.2-2' }}</span>
                </div>
                <div class="misc-row misc-total">
                  <span>Items Grand Total:</span>
                  <strong>₹{{ getGrandTotal(bill) | number:'1.2-2' }}</strong>
                </div>
              </div>
            </div>

            <!-- Standard Table Container (Desktop default, and mobile when 'table' view selected, ALWAYS printed in @media print) -->
            <div class="a4-items-table-container" [class.mobile-hidden]="itemsMobileView === 'cards'">
              <div class="mobile-scroll-hint no-print">↔ Swipe horizontally to view full 10-column table</div>
              <div class="table-scroll-wrap">
                <table class="a4-items-table">
                  <thead>
                    <tr>
                      <th style="width: 4%;">#</th>
                      <th style="width: 28%;">Item Description & Specifications</th>
                      <th style="width: 9%;">HSN/SAC</th>
                      <th style="width: 5%; text-align: center;">Qty</th>
                      <th style="width: 11%; text-align: right;">Gross Rate (₹)</th>
                      <th style="width: 8%; text-align: right;">Discount (₹)</th>
                      <th style="width: 11%; text-align: right;">Taxable Value (₹)</th>
                      <th style="width: 8%; text-align: right;">CGST (9%)</th>
                      <th style="width: 8%; text-align: right;">SGST (9%)</th>
                      <th style="width: 8%; text-align: right;">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of bill.items; track item.id; let idx = $index) {
                      <tr>
                        <td class="text-center font-mono">{{ idx + 1 }}</td>
                        <td>
                          <div class="item-name"><strong>{{ item.description }}</strong></div>
                          @if (globalImei) {
                            <div class="imei-subtext"><span class="imei-pill">{{ globalImei }}</span></div>
                          }
                          <div class="specs-subtext">Brand New • Retail Pack • 1-Year Manufacturer Warranty</div>
                        </td>
                        <td class="text-center font-mono hsn-code">{{ getItemHsn(item) }}</td>
                        <td class="text-center font-bold">{{ item.quantity }}</td>
                        <td class="text-right num-col">{{ (item.unitPrice || (item.totalAmount / (item.quantity || 1))) | number:'1.2-2' }}</td>
                        <td class="text-right num-col disc-col">
                          @if (getItemDiscount(item, bill) > 0) {
                            -₹{{ getItemDiscount(item, bill) | number:'1.2-2' }}
                          } @else {
                            ₹0.00
                          }
                        </td>
                        <td class="text-right num-col taxable-col"><strong>₹{{ getItemTaxable(item, bill) | number:'1.2-2' }}</strong></td>
                        <td class="text-right num-col tax-col">₹{{ getItemCgst(item, bill) | number:'1.2-2' }}</td>
                        <td class="text-right num-col tax-col">₹{{ getItemSgst(item, bill) | number:'1.2-2' }}</td>
                        <td class="text-right num-col item-total-col"><strong>₹{{ getItemTotal(item, bill) | number:'1.2-2' }}</strong></td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="items-total-row">
                      <td colspan="3" class="text-right"><strong>Total ({{ bill.items.length }} {{ bill.items.length === 1 ? 'item' : 'items' }})</strong></td>
                      <td class="text-center font-bold">{{ getItemsQuantity(bill) }}</td>
                      <td class="text-right font-bold">₹{{ bill.subtotal | number:'1.2-2' }}</td>
                      <td class="text-right font-bold disc-col">
                        @if (bill.discountAmount > 0) {
                          -₹{{ bill.discountAmount | number:'1.2-2' }}
                        } @else {
                          ₹0.00
                        }
                      </td>
                      <td class="text-right font-bold taxable-col">₹{{ getTaxableValue(bill) | number:'1.2-2' }}</td>
                      <td class="text-right font-bold tax-col">₹{{ getCgst(bill) | number:'1.2-2' }}</td>
                      <td class="text-right font-bold tax-col">₹{{ getSgst(bill) | number:'1.2-2' }}</td>
                      <td class="text-right font-bold grand-col">₹{{ getGrandTotal(bill) | number:'1.2-2' }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Amazon / Flipkart Secondary HSN / Tax Schedule Table -->
            <div class="hsn-summary-card">
              <div class="hsn-card-header">
                <span class="hsn-header-title">GST TAX ANALYSIS SCHEDULE (IN ACCORDANCE WITH SECTION 15 OF THE CGST ACT, 2017)</span>
                <span class="place-badge">Supply: West Bengal (Intra-State: CGST 9% + SGST 9%)</span>
              </div>

              <!-- Mobile HSN Breakdown Cards (Clean & 100% responsive on phones) -->
              <div class="hsn-mobile-cards no-print">
                <div class="hsn-mobile-row">
                  <div class="hmc-item">
                    <span class="hmc-label">HSN / SAC Code</span>
                    <span class="hmc-val font-mono font-bold">8517 13 00</span>
                  </div>
                  <div class="hmc-item text-right">
                    <span class="hmc-label">Taxable Value</span>
                    <strong class="hmc-val">₹{{ getTaxableValue(bill) | number:'1.2-2' }}</strong>
                  </div>
                </div>
                <div class="hsn-mobile-row sub">
                  <div class="hmc-item">
                    <span class="hmc-label">Central Tax (CGST 9%)</span>
                    <span class="hmc-val">₹{{ getCgst(bill) | number:'1.2-2' }}</span>
                  </div>
                  <div class="hmc-item text-right">
                    <span class="hmc-label">State Tax (SGST 9%)</span>
                    <span class="hmc-val">₹{{ getSgst(bill) | number:'1.2-2' }}</span>
                  </div>
                </div>
                <div class="hsn-mobile-total">
                  <span>Total Tax Analysis Amount:</span>
                  <strong>₹{{ getTotalTax(bill) | number:'1.2-2' }}</strong>
                </div>
              </div>

              <!-- Desktop & High-Res Table (Always printed in @media print) -->
              <div class="table-scroll-wrap hsn-table-wrap" style="margin-bottom: 0;">
                <table class="hsn-summary-table">
                  <thead>
                    <tr>
                      <th rowspan="2" style="width: 14%;">HSN / SAC</th>
                      <th rowspan="2" style="width: 24%;">Taxable Amount (₹)</th>
                      <th colspan="2" style="width: 23%;">Central Tax (CGST)</th>
                      <th colspan="2" style="width: 23%;">State Tax (SGST)</th>
                      <th rowspan="2" style="width: 16%;">Total Tax Amount (₹)</th>
                    </tr>
                    <tr>
                      <th style="width: 8%;">Rate</th>
                      <th style="width: 15%;">Amount (₹)</th>
                      <th style="width: 8%;">Rate</th>
                      <th style="width: 15%;">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="text-center font-mono">8517 13 00</td>
                      <td class="text-right">₹{{ getTaxableValue(bill) | number:'1.2-2' }}</td>
                      <td class="text-center">9.00%</td>
                      <td class="text-right">₹{{ getCgst(bill) | number:'1.2-2' }}</td>
                      <td class="text-center">9.00%</td>
                      <td class="text-right">₹{{ getSgst(bill) | number:'1.2-2' }}</td>
                      <td class="text-right font-bold">₹{{ getTotalTax(bill) | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="hsn-total-row">
                      <td class="text-center font-bold">TOTAL TAX</td>
                      <td class="text-right font-bold">₹{{ getTaxableValue(bill) | number:'1.2-2' }}</td>
                      <td></td>
                      <td class="text-right font-bold">₹{{ getCgst(bill) | number:'1.2-2' }}</td>
                      <td></td>
                      <td class="text-right font-bold">₹{{ getSgst(bill) | number:'1.2-2' }}</td>
                      <td class="text-right font-bold">₹{{ getTotalTax(bill) | number:'1.2-2' }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Financial Summary & Tax Breakdown (Words & Fixed Calc Card) -->
            <div class="a4-summary-grid">
              <div class="words-col">
                <div class="amount-in-words">
                  <span class="words-label">Invoice Amount in Words:</span>
                  <div class="words-text">{{ amountInWords(getGrandTotal(bill)) }}</div>
                </div>

                <!-- Legal Declaration -->
                <div class="declaration-box">
                  <div class="dec-title">STATUTORY DECLARATION</div>
                  <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Electronic Tax Invoice issued under Section 31 of CGST Act, 2017.</p>
                  <div class="dec-row">
                    <span>Tax Payable on Reverse Charge: <strong>No</strong></span>
                    <span>State of Jurisdiction: <strong>West Bengal</strong></span>
                  </div>
                </div>

                <!-- UPI / Bank Details Box -->
                <div class="upi-payment-box">
                  <div class="upi-header">⚡ INSTANT DIGITAL PAYMENT & VERIFICATION</div>
                  <div class="upi-content">
                    <div class="upi-details">
                      <p><strong>Merchant VPA:</strong> <span class="upi-vpa">chandankr.mandal87&#64;okaxis</span></p>
                      <p><strong>Payee:</strong> Chandan Kr Mandal (Mobile Shop)</p>
                      <p class="upi-verified">✓ Bank & NPCI Verified Merchant</p>
                      <p class="upi-apps">GPay • PhonePe • Paytm • AmazonPay • Any UPI</p>
                    </div>
                    <div class="qr-placeholder">
                      <div class="qr-box">
                        <span class="qr-icon">📱</span>
                        <span class="qr-text">UPI QR</span>
                        <span class="qr-sub">SCAN TO PAY</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dedicated, Well-Formatted Calc Card -->
              <div class="calc-col">
                <div class="calc-card">
                  <div class="calc-card-header">
                    <span class="calc-header-title">TAX &amp; SETTLEMENT SUMMARY</span>
                    <span class="tax-badge">18% GST INCLUDED</span>
                  </div>
                  <table class="calc-table">
                    <tbody>
                      <tr>
                        <td class="calc-label">Gross Items Subtotal:</td>
                        <td class="calc-val">₹{{ bill.subtotal | number:'1.2-2' }}</td>
                      </tr>
                      @if (bill.discountAmount > 0) {
                        <tr class="discount-row">
                          <td class="calc-label">Less: Trade / Special Discount:</td>
                          <td class="calc-val discount-val">-₹{{ bill.discountAmount | number:'1.2-2' }}</td>
                        </tr>
                      }
                      <tr class="taxable-row">
                        <td class="calc-label"><strong>Net Taxable Value:</strong></td>
                        <td class="calc-val taxable-val"><strong>₹{{ getTaxableValue(bill) | number:'1.2-2' }}</strong></td>
                      </tr>
                      <tr class="tax-row">
                        <td class="calc-label">Central GST (CGST &#64; 9.0%):</td>
                        <td class="calc-val">+₹{{ getCgst(bill) | number:'1.2-2' }}</td>
                      </tr>
                      <tr class="tax-row">
                        <td class="calc-label">State GST (SGST &#64; 9.0%):</td>
                        <td class="calc-val">+₹{{ getSgst(bill) | number:'1.2-2' }}</td>
                      </tr>
                      <tr class="tax-total-row">
                        <td class="calc-label">Total GST Levied (18.0%):</td>
                        <td class="calc-val">₹{{ getTotalTax(bill) | number:'1.2-2' }}</td>
                      </tr>
                      <tr class="grand-total-row">
                        <td class="calc-label grand-title">
                          <span class="grand-main">GRAND TOTAL:</span>
                          <span class="grand-sub">(ROUNDED OFF)</span>
                        </td>
                        <td class="calc-val grand-val">₹{{ getGrandTotal(bill) | number:'1.2-2' }}</td>
                      </tr>
                      <tr class="paid-row">
                        <td class="calc-label">Payment Received ({{ paymentMode }}):</td>
                        <td class="calc-val">₹{{ (bill.totalAmount - bill.balanceDue) | number:'1.2-2' }}</td>
                      </tr>
                      <tr class="balance-row" [class.cleared]="bill.balanceDue === 0">
                        <td class="calc-label">Balance Outstanding:</td>
                        <td class="calc-val balance-val">
                          {{ bill.balanceDue === 0 ? '₹0.00 (PAID IN FULL)' : ('₹' + (bill.balanceDue | number:'1.2-2')) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Warranty & Terms -->
            <div class="a4-terms-box">
              <div class="terms-title">TERMS & CONDITIONS OF SALE & WARRANTY</div>
              <ol class="terms-list">
                <li><strong>Warranty Coverage:</strong> All smartphones, tablets, and electronics carry official brand manufacturer warranty. For repairs or replacement, please present this original tax invoice and retail packaging at any authorized brand service centre.</li>
                <li><strong>Exclusions:</strong> Physical damage, cracked screens/displays, liquid intrusion/logging, unauthorized third-party tampering, broken warranty seals, or voltage surges are strictly excluded from warranty.</li>
                <li><strong>Return / Exchange:</strong> Products once sold and unsealed cannot be returned for cash. Replacement is permitted only within 7 days against certified DOA (Dead On Arrival) certificate from the authorized brand service centre.</li>
                <li><strong>Disputes:</strong> All disputes and claims are subject to the exclusive jurisdiction of competent courts in Newtown, Kolkata only.</li>
                @if (warrantyNote) {
                  <li><strong>Special Note:</strong> {{ warrantyNote }}</li>
                }
              </ol>
            </div>

            <!-- Signatures -->
            <div class="a4-signatures">
              <div class="sign-block">
                <div class="sign-line"></div>
                <p>Customer Acknowledgment Signature</p>
                <small>Goods received in good condition & sealed box</small>
              </div>
              <div class="sign-block right">
                <div class="sign-line"></div>
                <p><strong>For MOBILE SHOP MANAGEMENT</strong></p>
                <small>Authorized Signatory</small>
              </div>
            </div>
          </div>
        }

        <!-- =========================================================================
             80MM THERMAL POS SLIP FORMAT
             ========================================================================= -->
        @if (selectedFormat === '80mm') {
          <div class="invoice-container invoice-80mm">
            <div class="thermal-receipt">
              <div class="th-header">
                <div class="th-brand">*** MOBILE SHOP ***</div>
                <div class="th-sub">SMARTPHONES • ACCESSORIES • SERVICE</div>
                <div class="th-owner">Prop: Chandan Kr Mandal</div>
                <div class="th-address">3B8-2D, Sanhita Township, Newtown, 700135, WB</div>
                <div class="th-contact">Ph: +91 9851632391</div>
                <div class="th-gst">GSTIN: 19AABCX1234F1Z8 (WB 19)</div>
              </div>

              <div class="th-divider">================================</div>

              <div class="th-meta">
                <div class="th-row"><span>BILL NO:</span> <strong>{{ bill.billNumber }}</strong></div>
                <div class="th-row"><span>DATE   :</span> {{ bill.issuedAtUtc | date:'dd/MM/yyyy HH:mm' }}</div>
                <div class="th-row"><span>CASHIER:</span> Counter 1 (Admin)</div>
                <div class="th-row"><span>CUST   :</span> {{ bill.customerName || 'Walk-in Customer' }}</div>
                @if (customerPhone) {
                  <div class="th-row"><span>PHONE  :</span> {{ customerPhone }}</div>
                }
                <div class="th-row"><span>PAYMODE:</span> {{ paymentMode }}</div>
              </div>

              <div class="th-divider">--------------------------------</div>
              <div class="th-table-head">
                <span>ITEM</span>
                <span>QTY</span>
                <span class="text-right">AMT (₹)</span>
              </div>
              <div class="th-divider">--------------------------------</div>

              <div class="th-items">
                @for (item of bill.items; track item.id) {
                  <div class="th-item-row">
                    <div class="th-item-name">{{ item.description }}</div>
                    <div class="th-item-calc">
                      <span>{{ item.quantity }} x ₹{{ (item.unitPrice || (item.totalAmount / (item.quantity || 1))) | number:'1.2-2' }}</span>
                      <strong class="text-right">₹{{ (item.totalAmount || item.unitPrice * item.quantity) | number:'1.2-2' }}</strong>
                    </div>
                    @if (globalImei) {
                      <div class="th-item-imei">{{ globalImei }}</div>
                    }
                  </div>
                }
              </div>

              <div class="th-divider">--------------------------------</div>

              <div class="th-totals">
                <div class="th-row"><span>Gross Subtotal:</span> <span>₹{{ bill.subtotal | number:'1.2-2' }}</span></div>
                @if (bill.discountAmount > 0) {
                  <div class="th-row th-disc"><span>Discount:</span> <span>-₹{{ bill.discountAmount | number:'1.2-2' }}</span></div>
                  <div class="th-row"><span>Taxable Value:</span> <span>₹{{ getTaxableValue(bill) | number:'1.2-2' }}</span></div>
                }
                <div class="th-row"><span>CGST (9%):</span> <span>+₹{{ getCgst(bill) | number:'1.2-2' }}</span></div>
                <div class="th-row"><span>SGST (9%):</span> <span>+₹{{ getSgst(bill) | number:'1.2-2' }}</span></div>
                <div class="th-divider">================================</div>
                <div class="th-row th-grand">
                  <strong>GRAND TOTAL:</strong>
                  <strong>₹{{ getGrandTotal(bill) | number:'1.2-2' }}</strong>
                </div>
                <div class="th-divider">================================</div>
                <div class="th-row"><span>Amount Paid:</span> <span>₹{{ (bill.totalAmount - bill.balanceDue) | number:'1.2-2' }}</span></div>
                <div class="th-row">
                  <span>Balance Due:</span>
                  <span>{{ bill.balanceDue === 0 ? '₹0.00 (PAID)' : ('₹' + (bill.balanceDue | number:'1.2-2')) }}</span>
                </div>
              </div>

              <div class="th-footer">
                <p>* 1-Year Brand Warranty as per terms</p>
                <p>* Bring original invoice & box for service</p>
                <p>* Physical/liquid damage not covered</p>
                @if (warrantyNote) {
                  <p>* {{ warrantyNote }}</p>
                }
                <div class="th-barcode">
                  ||| | ||||| || |||||| |||| | ||
                </div>
                <div class="th-thanks">*** THANK YOU! VISIT AGAIN ***</div>
              </div>
            </div>
          </div>
        }

      } @else {
        <div class="empty-state no-print" style="margin: 40px auto; text-align: center;">
          <p>Bill not found.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    /* -------------------------------------------------------------------------
       Screen UI & Toolbars
       ------------------------------------------------------------------------- */
    .billing-print-page {
      background: #e2e8f0;
      min-height: 100vh;
      padding: 24px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .screen-toolbar {
      max-width: 900px;
      margin: 0 auto 24px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }

    .toolbar-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 16px;
    }

    .toolbar-brand h3 {
      margin: 4px 0 0 0;
      font-size: 1.2rem;
      color: #0f172a;
    }

    .back-link {
      font-size: 0.85rem;
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    .back-link:hover { text-decoration: underline; }

    .format-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .format-toggle .label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }

    .btn-group {
      display: inline-flex;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background: #f1f5f9;
    }

    .format-btn {
      padding: 8px 14px;
      font-size: 0.88rem;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #475569;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .format-btn.active {
      background: #0d7a5f;
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(13, 122, 95, 0.2);
    }

    .toolbar-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .print-trigger-btn {
      background: #0d7a5f;
      color: #fff;
      padding: 9px 18px;
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(13, 122, 95, 0.25);
    }
    .print-trigger-btn:hover { background: #09614b; }

    .options-drawer {
      padding: 14px 20px;
      background: #ffffff;
    }

    .options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
    }

    .opt-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .opt-field.wide {
      grid-column: 1 / -1;
    }

    .opt-field span {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .opt-input {
      padding: 6px 10px;
      font-size: 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
      background: #f8fafc;
      color: #0f172a;
    }
    .opt-input:focus { border-color: #0d7a5f; background: #fff; }

    .notification {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .success-toast { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .error-toast { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

    /* -------------------------------------------------------------------------
       A4 Tax Invoice Layout & Styles
       ------------------------------------------------------------------------- */
    .invoice-a4 {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 4px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
      color: #0f172a;
      box-sizing: border-box;
    }

    .invoice-a4 table {
      min-width: 0 !important;
      border-collapse: collapse !important;
    }

    .a4-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 14px;
    }

    .invoice-badge {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #0f172a;
    }

    .copy-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      border: 1px solid #94a3b8;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }

    .a4-grid-header {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
      margin-bottom: 16px;
    }

    .shop-brand {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 10px;
    }

    .shop-logo { font-size: 2.2rem; }

    .shop-title {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      color: #0f172a;
    }

    .shop-tagline {
      margin: 2px 0 0 0;
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 500;
    }

    .shop-details p {
      margin: 2px 0;
      font-size: 0.8rem;
      color: #334155;
      line-height: 1.4;
    }

    .meta-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }

    .meta-table th {
      text-align: left;
      color: #64748b;
      font-weight: 600;
      padding: 4px 6px;
      width: 45%;
    }

    .meta-table td {
      padding: 4px 6px;
      color: #0f172a;
    }

    .pay-mode-pill {
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.78rem;
    }

    .status-pill {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.75rem;
      letter-spacing: 0.03em;
    }
    .status-pill.paid { background: #dcfce7; color: #166534; }
    .status-pill.due { background: #fee2e2; color: #991b1b; }

    /* Customer / Parties Grid */
    .a4-parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .a4-customer-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
    }

    .box-header {
      background: #f1f5f9;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #334155;
      padding: 5px 12px;
      border-bottom: 1px solid #cbd5e1;
      text-transform: uppercase;
    }

    .box-body {
      padding: 8px 12px;
      font-size: 0.82rem;
      line-height: 1.45;
    }

    .box-body p {
      margin: 2px 0;
    }

    .party-name {
      font-size: 0.9rem;
      color: #0f172a;
    }

    .party-address {
      color: #334155;
    }

    .party-state, .party-contact, .party-gst {
      font-size: 0.78rem;
      color: #475569;
    }

    /* Product Items Table (Flipkart / Amazon Style) */
    .a4-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 0.82rem;
      border: 1px solid #cbd5e1;
      table-layout: fixed;
    }

    .a4-items-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 6px;
      font-weight: 700;
      font-size: 0.74rem;
      letter-spacing: 0.03em;
      border-right: 1px solid #334155;
      vertical-align: middle;
      text-align: left;
    }
    .a4-items-table th:last-child {
      border-right: none;
    }

    .a4-items-table td {
      padding: 8px 6px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: top;
      font-variant-numeric: tabular-nums;
    }
    .a4-items-table td:last-child {
      border-right: none;
    }

    .a4-items-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }

    .a4-items-table tfoot tr {
      background: #f1f5f9;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }

    .a4-items-table tfoot td {
      padding: 8px 6px;
      font-size: 0.82rem;
      color: #0f172a;
      vertical-align: middle;
    }

    .item-name {
      color: #0f172a;
      font-size: 0.84rem;
    }

    .imei-subtext {
      margin-top: 3px;
    }

    .imei-pill {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-family: 'Consolas', monospace;
      font-weight: 600;
      display: inline-block;
    }

    .specs-subtext {
      font-size: 0.68rem;
      color: #64748b;
      margin-top: 2px;
    }

    .hsn-code {
      font-size: 0.76rem;
      color: #475569;
    }

    .num-col {
      white-space: nowrap;
    }

    .disc-col {
      color: #b91c1c;
    }

    .taxable-col {
      color: #0f172a;
    }

    .tax-col {
      color: #334155;
    }

    .item-total-col {
      color: #0f172a;
    }

    .grand-col {
      color: #0d7a5f;
      font-size: 0.88rem;
    }

    /* Amazon/Flipkart Secondary HSN Schedule Table */
    .hsn-summary-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 16px;
      background: #ffffff;
    }

    .hsn-card-header {
      background: #1e293b;
      color: #f8fafc;
      padding: 6px 12px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .place-badge {
      font-size: 0.68rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .hsn-summary-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 0.78rem;
    }

    .hsn-summary-table th {
      background: #f1f5f9;
      color: #334155;
      padding: 5px 8px;
      font-weight: 700;
      border-bottom: 1px solid #cbd5e1;
      border-right: 1px solid #cbd5e1;
      text-align: center;
      font-size: 0.72rem;
    }
    .hsn-summary-table th:last-child {
      border-right: none;
    }

    .hsn-summary-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
      color: #1e293b;
      font-variant-numeric: tabular-nums;
    }
    .hsn-summary-table td:last-child {
      border-right: none;
    }

    .hsn-summary-table tfoot td {
      background: #f8fafc;
      font-weight: 700;
      border-top: 1px solid #cbd5e1;
    }

    /* Financial Summary & Tax Breakdown */
    .a4-summary-grid {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }

    .words-col {
      flex: 1 1 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .amount-in-words {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.82rem;
    }
    .words-label {
      color: #64748b;
      display: block;
      font-size: 0.7rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .words-text {
      color: #0f172a;
      font-weight: 700;
      margin-top: 2px;
      line-height: 1.35;
      font-size: 0.84rem;
    }

    .declaration-box {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 0.72rem;
      color: #475569;
      line-height: 1.4;
    }
    .dec-title {
      font-weight: 700;
      font-size: 0.7rem;
      color: #334155;
      margin-bottom: 3px;
      letter-spacing: 0.04em;
    }
    .dec-row {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-size: 0.72rem;
      color: #334155;
      border-top: 1px solid #f1f5f9;
      padding-top: 3px;
    }

    .upi-payment-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
    }

    .upi-header {
      background: #f1f5f9;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 4px 10px;
      color: #334155;
      letter-spacing: 0.04em;
    }

    .upi-content {
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .upi-details p { margin: 2px 0; font-size: 0.76rem; }
    .upi-vpa { font-family: monospace; font-weight: 700; color: #0d7a5f; }
    .upi-verified { color: #16a34a; font-weight: 600; font-size: 0.72rem; }
    .upi-apps { font-size: 0.68rem; color: #64748b; }

    .qr-box {
      width: 68px;
      height: 68px;
      border: 1.5px solid #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border-radius: 4px;
      padding: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      flex-shrink: 0;
    }
    .qr-icon { font-size: 1.3rem; line-height: 1; }
    .qr-text { font-size: 0.65rem; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .qr-sub { font-size: 0.52rem; color: #64748b; letter-spacing: 0.02em; }

    /* =========================================================================
       CALC-COL & CALC-TABLE (FIXED & WELL-FORMATTED DESIGN)
       ========================================================================= */
    .calc-col {
      width: 370px;
      flex: 0 0 370px;
      max-width: 50%;
      min-width: 340px;
      display: flex;
      flex-direction: column;
      page-break-inside: avoid;
    }

    .calc-card {
      background: #ffffff;
      border: 1.5px solid #0f172a;
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
      width: 100%;
      box-sizing: border-box;
    }

    .calc-card-header {
      background: #0f172a;
      color: #ffffff;
      padding: 7px 12px;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1e293b;
      box-sizing: border-box;
    }

    .calc-card-header .calc-header-title {
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #ffffff;
    }

    .calc-card-header .tax-badge {
      background: #0d7a5f;
      color: #ffffff;
      font-size: 0.65rem;
      padding: 2px 7px;
      border-radius: 3px;
      font-weight: 700;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }

    .calc-table {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      font-size: 0.82rem;
      background: #ffffff;
      margin: 0 !important;
      box-sizing: border-box;
    }

    .calc-table td {
      padding: 5px 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
      font-variant-numeric: tabular-nums;
      box-sizing: border-box;
    }

    .calc-table td.calc-label {
      width: 58%;
      color: #475569;
      font-weight: 500;
      text-align: left;
      font-size: 0.8rem;
      line-height: 1.35;
      word-break: normal;
    }

    .calc-table td.calc-val {
      width: 42%;
      text-align: right;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      font-size: 0.82rem;
      font-feature-settings: 'tnum';
    }

    .calc-table tr.discount-row td {
      background: #fef2f2;
    }
    .calc-table tr.discount-row td.calc-label {
      color: #b91c1c;
      font-weight: 600;
    }
    .calc-table tr.discount-row td.discount-val {
      color: #dc2626;
      font-weight: 700;
    }

    .calc-table tr.taxable-row td {
      background: #f8fafc;
      border-top: 1px dashed #cbd5e1;
      border-bottom: 1px dashed #cbd5e1;
      color: #0f172a;
    }
    .calc-table tr.taxable-row td.calc-label {
      color: #0f172a;
    }
    .calc-table tr.taxable-row td.taxable-val {
      font-weight: 800;
      color: #0f172a;
    }

    .calc-table tr.tax-row td {
      color: #334155;
      font-size: 0.79rem;
    }

    .calc-table tr.tax-total-row td {
      background: #f8fafc;
      font-weight: 600;
      color: #334155;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #cbd5e1;
    }

    .calc-table tr.grand-total-row td {
      background: #0f172a !important;
      color: #ffffff !important;
      padding: 9px 12px;
      border: none;
    }

    .calc-table tr.grand-total-row td.grand-title {
      color: #ffffff;
      vertical-align: middle;
    }
    .calc-table tr.grand-total-row td.grand-title .grand-main {
      display: block;
      font-weight: 900;
      font-size: 0.95rem;
      letter-spacing: 0.05em;
      color: #ffffff;
      line-height: 1.2;
    }
    .calc-table tr.grand-total-row td.grand-title .grand-sub {
      display: block;
      font-size: 0.65rem;
      color: #94a3b8;
      font-weight: 500;
      margin-top: 2px;
      letter-spacing: 0.02em;
    }

    .calc-table tr.grand-total-row td.grand-val {
      color: #34d399 !important;
      font-size: 1.22rem;
      font-weight: 900;
      letter-spacing: -0.01em;
      text-align: right;
      white-space: nowrap;
      vertical-align: middle;
    }

    .calc-table tr.paid-row td {
      background: #ffffff;
      font-size: 0.79rem;
      color: #334155;
    }

    .calc-table tr.balance-row td {
      background: #fff1f2;
      color: #be123c;
      font-weight: 700;
      border-top: 1px solid #fecdd3;
      font-size: 0.8rem;
    }

    .calc-table tr.balance-row.cleared td {
      background: #f0fdf4;
      color: #15803d;
      border-top: 1px solid #bbf7d0;
    }
    .calc-table tr.balance-row.cleared td.balance-val {
      color: #16a34a;
      font-weight: 800;
    }

    .a4-terms-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 24px;
    }

    .terms-title {
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #475569;
      margin-bottom: 4px;
    }

    .terms-list {
      margin: 0;
      padding-left: 16px;
      font-size: 0.72rem;
      color: #64748b;
      line-height: 1.45;
    }

    .a4-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 10px;
    }

    .sign-block {
      text-align: center;
      width: 220px;
    }

    .sign-block.right { text-align: center; }

    .sign-line {
      border-bottom: 1px dashed #94a3b8;
      margin-bottom: 6px;
    }

    .sign-block p { margin: 2px 0; font-size: 0.82rem; }
    .sign-block small { font-size: 0.72rem; color: #64748b; }

    /* -------------------------------------------------------------------------
       80mm Thermal POS Slip Layout & Styles
       ------------------------------------------------------------------------- */
    .invoice-80mm {
      max-width: 320px;
      margin: 0 auto;
      background: #ffffff;
      padding: 16px 12px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 11.5px;
      color: #000000;
      line-height: 1.35;
      box-sizing: border-box;
    }

    .thermal-receipt {
      width: 100%;
    }

    .th-header { text-align: center; margin-bottom: 6px; }
    .th-brand { font-size: 14px; font-weight: 900; letter-spacing: 1px; }
    .th-sub { font-size: 10px; font-weight: 700; margin-top: 2px; }
    .th-owner { font-size: 11px; font-weight: bold; margin-top: 2px; }
    .th-address, .th-contact, .th-gst { font-size: 10px; }

    .th-divider {
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
      margin: 4px 0;
      font-size: 10px;
    }

    .th-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      font-size: 11px;
    }

    .th-table-head {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      font-weight: 700;
      font-size: 11px;
    }

    .th-item-row { margin: 6px 0; }
    .th-item-name { font-weight: 700; font-size: 11.5px; }
    .th-item-calc {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
    }
    .th-item-imei {
      font-size: 10px;
      color: #333333;
      padding-left: 6px;
    }

    .th-totals { margin: 4px 0; }
    .th-grand {
      font-size: 13px;
      font-weight: 900;
      padding: 2px 0;
    }

    .th-footer {
      text-align: center;
      font-size: 9.5px;
      margin-top: 8px;
    }
    .th-footer p { margin: 2px 0; }

    .th-barcode {
      letter-spacing: 4px;
      font-size: 14px;
      margin: 6px 0 2px 0;
    }

    .th-thanks {
      font-weight: bold;
      font-size: 10.5px;
      margin-top: 4px;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }

    .table-scroll-wrap {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin-bottom: 14px;
    }

    .mobile-scroll-hint {
      display: none;
    }

    .table-view-toggle {
      display: none;
    }

    .a4-items-mobile-view {
      display: none;
    }

    .hsn-mobile-cards {
      display: none;
    }

    /* -------------------------------------------------------------------------
       Responsive Mobile Styles (@media screen and (max-width: 768px))
       ------------------------------------------------------------------------- */
    @media screen and (max-width: 768px) {
      .billing-print-page {
        padding: 12px 8px !important;
        overflow-x: hidden !important;
      }

      .screen-toolbar {
        border-radius: 8px !important;
        margin: 0 auto 14px auto !important;
      }

      .toolbar-container {
        padding: 12px 14px !important;
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 12px !important;
      }

      .toolbar-brand {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .format-toggle {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }

      .format-toggle .btn-group {
        width: 100%;
        display: flex;
      }

      .format-toggle .format-btn {
        flex: 1;
        text-align: center;
        padding: 8px 6px;
        font-size: 0.8rem;
      }

      .toolbar-actions {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .print-trigger-btn {
        width: 100%;
        padding: 10px;
        font-size: 0.9rem;
      }

      .options-drawer {
        padding: 12px 14px;
      }

      .options-grid {
        grid-template-columns: 1fr;
      }

      /* A4 Mobile Invoice Overrides */
      .invoice-a4 {
        max-width: 100% !important;
        width: 100% !important;
        padding: 14px 10px !important;
        border-radius: 8px !important;
        box-sizing: border-box !important;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
        overflow-x: hidden !important;
      }

      .a4-header-top {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 6px !important;
      }

      .invoice-badge {
        font-size: 0.96rem !important;
      }

      .copy-badge {
        font-size: 0.68rem !important;
      }

      .a4-grid-header {
        grid-template-columns: 1fr !important;
        gap: 14px !important;
      }

      .shop-brand {
        align-items: flex-start !important;
      }

      .shop-logo {
        font-size: 1.8rem !important;
      }

      .shop-title {
        font-size: 1.15rem !important;
      }

      .meta-col {
        border-top: 1px dashed #cbd5e1;
        padding-top: 10px;
      }

      .meta-table th {
        width: 48% !important;
        padding: 3px 2px !important;
        font-size: 0.76rem !important;
      }

      .meta-table td {
        padding: 3px 2px !important;
        font-size: 0.78rem !important;
      }

      .a4-parties-grid {
        grid-template-columns: 1fr !important;
        gap: 12px !important;
      }

      .box-header {
        font-size: 0.68rem !important;
        padding: 4px 8px !important;
      }

      .box-body {
        padding: 8px 10px !important;
        font-size: 0.78rem !important;
      }

      /* Items View Mode Toggle (Mobile Only) */
      .table-view-toggle {
        display: flex !important;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding: 6px 10px;
        background: #f1f5f9;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .toggle-label {
        font-size: 0.78rem;
        font-weight: 700;
        color: #334155;
      }

      .btn-group.sm .toggle-btn {
        padding: 6px 12px;
        font-size: 0.76rem;
        border: none;
        background: transparent;
        color: #64748b;
        cursor: pointer;
        font-weight: 600;
        border-radius: 6px;
        transition: all 0.15s ease;
      }

      .btn-group.sm .toggle-btn.active {
        background: #0d7a5f;
        color: #ffffff;
        box-shadow: 0 1px 3px rgba(13, 122, 95, 0.25);
      }

      /* Mobile Itemized Cards */
      .a4-items-mobile-view {
        display: block !important;
        margin-bottom: 16px;
      }

      .a4-items-mobile-view.force-hide {
        display: none !important;
      }

      .a4-items-table-container.mobile-hidden {
        display: none !important;
      }

      .mobile-items-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .mobile-item-card {
        background: #ffffff;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
      }

      .mic-header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 4px;
      }

      .mic-idx {
        background: #0f172a;
        color: #ffffff;
        font-size: 0.7rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
      }

      .mic-title-wrap {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .mic-title {
        font-size: 0.9rem;
        color: #0f172a;
        line-height: 1.3;
      }

      .mic-specs {
        font-size: 0.72rem;
        color: #64748b;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px dashed #e2e8f0;
      }

      .mic-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1.2fr;
        gap: 8px;
        margin-bottom: 8px;
      }

      .mic-grid.sub-grid {
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f1f5f9;
      }

      .mic-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .mic-label {
        font-size: 0.68rem;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.02em;
      }

      .mic-val {
        font-size: 0.8rem;
        color: #1e293b;
      }

      .mic-val.disc-val {
        color: #dc2626;
        font-weight: 600;
      }

      .mic-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8fafc;
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }

      .mic-footer-label {
        font-size: 0.76rem;
        font-weight: 700;
        color: #334155;
      }

      .mic-footer-val {
        font-size: 0.96rem;
        font-weight: 800;
        color: #0d7a5f;
      }

      /* Mobile Items Grand Summary Card */
      .mobile-items-summary-card {
        background: #f8fafc;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        padding: 10px 12px;
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .misc-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.78rem;
        color: #334155;
      }

      .misc-row.misc-disc {
        color: #dc2626;
      }

      .misc-row.misc-total {
        margin-top: 4px;
        padding-top: 6px;
        border-top: 1px dashed #cbd5e1;
        font-size: 0.86rem;
        color: #0f172a;
      }

      .misc-row.misc-total strong {
        color: #0d7a5f;
        font-size: 0.95rem;
      }

      /* Horizontal scroll hint & container */
      .mobile-scroll-hint {
        display: flex !important;
        align-items: center;
        justify-content: flex-end;
        font-size: 0.72rem;
        color: #0d7a5f;
        font-weight: 600;
        margin-bottom: 6px;
        gap: 4px;
      }

      .table-scroll-wrap {
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        box-shadow: inset -6px 0 8px -4px rgba(0, 0, 0, 0.08);
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
      }

      .a4-items-table {
        table-layout: auto !important;
        min-width: 920px !important;
        width: 100% !important;
        border: none !important;
        margin-bottom: 0 !important;
      }

      .a4-items-table th {
        white-space: nowrap !important;
        font-size: 0.72rem !important;
        padding: 6px 10px !important;
      }

      .a4-items-table td {
        padding: 6px 10px !important;
        font-size: 0.76rem !important;
      }

      .a4-items-table td.num-col {
        white-space: nowrap !important;
      }

      /* HSN Summary Card Mobile Overrides */
      .hsn-summary-card {
        border: 1.5px solid #cbd5e1 !important;
        border-radius: 8px !important;
        margin-bottom: 16px !important;
        overflow: hidden !important;
      }

      .hsn-card-header {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 4px !important;
        padding: 8px 12px !important;
      }

      .hsn-header-title {
        font-size: 0.72rem !important;
        line-height: 1.3 !important;
      }

      .place-badge {
        font-size: 0.68rem !important;
        color: #cbd5e1 !important;
      }

      /* Mobile HSN Cards */
      .hsn-mobile-cards {
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
        padding: 12px !important;
        background: #ffffff !important;
      }

      .hsn-mobile-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }

      .hsn-mobile-row.sub {
        padding-bottom: 8px;
        border-bottom: 1px dashed #e2e8f0;
      }

      .hmc-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .hmc-label {
        font-size: 0.68rem;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 600;
      }

      .hmc-val {
        font-size: 0.82rem;
        color: #1e293b;
      }

      .hsn-mobile-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.82rem;
        color: #0f172a;
        padding-top: 4px;
      }

      .hsn-mobile-total strong {
        color: #0d7a5f;
        font-size: 0.92rem;
      }

      /* Hide complex HSN table on mobile screens */
      .hsn-table-wrap {
        display: none !important;
      }

      /* Stack Summary & Calc Col */
      .a4-summary-grid {
        flex-direction: column !important;
        gap: 14px !important;
      }

      .words-col {
        width: 100% !important;
      }

      .calc-col {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        flex: 1 1 100% !important;
      }

      .calc-card {
        width: 100% !important;
      }

      .calc-table {
        width: 100% !important;
      }

      .calc-table td.calc-label {
        font-size: 0.76rem !important;
        padding: 6px 8px !important;
      }

      .calc-table td.calc-val {
        font-size: 0.78rem !important;
        padding: 6px 8px !important;
      }

      .a4-signatures {
        flex-direction: column !important;
        gap: 20px !important;
        align-items: center !important;
        margin-top: 24px !important;
      }

      .sign-block {
        width: 100% !important;
        max-width: 260px !important;
      }

      /* 80mm Mobile Mode */
      .mode-80mm {
        padding: 12px 8px !important;
      }

      .invoice-80mm {
        max-width: 100% !important;
        width: 100% !important;
        padding: 14px 10px !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08) !important;
      }
    }

    /* -------------------------------------------------------------------------
       Print Specific Rules (@media print)
       ------------------------------------------------------------------------- */
    @media print {
      body, html, .billing-print-page {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .no-print {
        display: none !important;
      }

      .table-view-toggle,
      .a4-items-mobile-view,
      .hsn-mobile-cards,
      .mobile-scroll-hint {
        display: none !important;
      }

      .a4-items-table-container,
      .a4-items-table-container.mobile-hidden {
        display: block !important;
      }

      .a4-items-table {
        display: table !important;
        width: 100% !important;
        min-width: 0 !important;
        table-layout: fixed !important;
      }

      .hsn-table-wrap {
        display: block !important;
        overflow: visible !important;
        box-shadow: none !important;
        border: none !important;
      }

      .hsn-summary-table {
        display: table !important;
        width: 100% !important;
        min-width: 0 !important;
        table-layout: fixed !important;
      }

      .table-scroll-wrap {
        overflow: visible !important;
        box-shadow: none !important;
        border: none !important;
      }

      /* A4 Page Formatting */
      .mode-a4 {
        width: 100% !important;
      }
      .mode-a4 .invoice-a4 {
        max-width: 100% !important;
        width: 100% !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }

      .mode-a4 .a4-summary-grid {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        align-items: stretch !important;
        page-break-inside: avoid !important;
      }

      .mode-a4 .calc-col {
        width: 370px !important;
        flex: 0 0 370px !important;
        max-width: 50% !important;
        page-break-inside: avoid !important;
      }

      .mode-a4 .calc-card {
        box-shadow: none !important;
        border: 1.5px solid #0f172a !important;
        page-break-inside: avoid !important;
        width: 100% !important;
      }

      .mode-a4 .calc-table {
        min-width: 0 !important;
        width: 100% !important;
        table-layout: fixed !important;
      }

      .mode-a4 .calc-table tr.grand-total-row td {
        background: #0f172a !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .mode-a4 .calc-table tr.grand-total-row td.grand-title .grand-main {
        color: #ffffff !important;
      }

      .mode-a4 .calc-table tr.grand-total-row td.grand-val {
        color: #34d399 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .mode-a4 .a4-items-table th,
      .mode-a4 .calc-card-header,
      .mode-a4 .hsn-card-header,
      .mode-a4 .tax-badge {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* 80mm POS Slip Formatting */
      .mode-80mm {
        width: 76mm !important;
        margin: 0 !important;
      }
      .mode-80mm .invoice-80mm {
        max-width: 76mm !important;
        width: 76mm !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
    }
  `]
})
export class BillingPrintComponent implements OnInit {
  bill: BillDto | null = null;
  loading = false;
  error = '';

  selectedFormat: 'a4' | '80mm' = 'a4';
  itemsMobileView: 'cards' | 'table' = 'cards';
  paymentMode = 'UPI (GPay / PhonePe / Paytm)';
  customerPhone = '';
  customerGstin = '';
  globalImei = '';
  warrantyNote = '1-Year Official Brand Warranty. Original box & invoice required for claims. Physical/liquid damage not covered.';

  customerEmail = '';
  sendingEmail = false;
  emailSentMessage = '';
  emailErrorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  get isCustomer(): boolean {
    return this.auth.currentRole() === 'Customer';
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      const fmt = q.get('format');
      if (fmt === '80mm' || fmt === 'thermal') {
        this.selectedFormat = '80mm';
      } else if (fmt === 'a4') {
        this.selectedFormat = 'a4';
      }
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.error = 'No bill id provided.';
        return;
      }
      this.loadBill(id);
    });
  }

  loadBill(id: string): void {
    this.loading = true;
    this.error = '';
    this.api.get<BillDto>(`/api/billing/${id}`).subscribe({
      next: (b) => {
        this.bill = b;
        this.guessItemImeis(b);
      },
      error: (err) => (this.error = apiErrorMessage(err)),
      complete: () => (this.loading = false)
    });
  }

  private guessItemImeis(b: BillDto): void {
    // If phone/handset is in bill, auto-generate realistic serial placeholder for retail look
    if (b.items && b.items.length > 0) {
      const hasHandset = b.items.some(i => i.description.toLowerCase().includes('galaxy') || i.description.toLowerCase().includes('phone') || i.description.toLowerCase().includes('ipad'));
      if (hasHandset && !this.globalImei) {
        this.globalImei = 'IMEI: 359' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
      }
    }
  }

  print(): void {
    window.print();
  }

  getItemsQuantity(bill: BillDto): number {
    if (!bill || !bill.items) return 0;
    return bill.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  getTaxableValue(bill: BillDto | null): number {
    if (!bill) return 0;
    return Math.max(0, (bill.subtotal || 0) - (bill.discountAmount || 0));
  }

  getCgst(bill: BillDto | null): number {
    if (!bill) return 0;
    if (bill.taxAmount > 0) {
      return Math.round((bill.taxAmount / 2) * 100) / 100;
    }
    return Math.round(this.getTaxableValue(bill) * 0.09 * 100) / 100;
  }

  getSgst(bill: BillDto | null): number {
    return this.getCgst(bill);
  }

  getTotalTax(bill: BillDto | null): number {
    return Math.round((this.getCgst(bill) + this.getSgst(bill)) * 100) / 100;
  }

  getGrandTotal(bill: BillDto | null): number {
    if (!bill) return 0;
    if (bill.totalAmount > 0) return bill.totalAmount;
    return Math.round((this.getTaxableValue(bill) + this.getTotalTax(bill)) * 100) / 100;
  }

  getItemDiscount(item: any, bill: BillDto | null): number {
    if (!bill || !bill.items || bill.items.length === 0) return 0;
    if (bill.items.length === 1) {
      return bill.discountAmount || 0;
    }
    const totalSubtotal = bill.subtotal || 1;
    const gross = item.totalAmount || (item.unitPrice * item.quantity);
    const ratio = gross / totalSubtotal;
    return Math.round((bill.discountAmount || 0) * ratio * 100) / 100;
  }

  getItemTaxable(item: any, bill: BillDto | null): number {
    const gross = item.totalAmount || (item.unitPrice * item.quantity);
    const discount = this.getItemDiscount(item, bill);
    return Math.max(0, Math.round((gross - discount) * 100) / 100);
  }

  getItemCgst(item: any, bill: BillDto | null): number {
    return Math.round(this.getItemTaxable(item, bill) * 0.09 * 100) / 100;
  }

  getItemSgst(item: any, bill: BillDto | null): number {
    return this.getItemCgst(item, bill);
  }

  getItemTotal(item: any, bill: BillDto | null): number {
    const taxable = this.getItemTaxable(item, bill);
    const cgst = this.getItemCgst(item, bill);
    const sgst = this.getItemSgst(item, bill);
    return Math.round((taxable + cgst + sgst) * 100) / 100;
  }

  getItemHsn(item: any): string {
    const desc = (item?.description || '').toLowerCase();
    if (desc.includes('phone') || desc.includes('galaxy') || desc.includes('iphone') || desc.includes('pixel') || desc.includes('redmi') || desc.includes('oneplus') || desc.includes('vivo') || desc.includes('oppo') || desc.includes('realme') || desc.includes('ipad') || desc.includes('tablet')) {
      return '8517 13 00';
    }
    if (desc.includes('headphone') || desc.includes('airpods') || desc.includes('earbuds') || desc.includes('buds')) {
      return '8518 30 00';
    }
    if (desc.includes('charger') || desc.includes('adapter') || desc.includes('cable') || desc.includes('case') || desc.includes('cover')) {
      return '8504 40 90';
    }
    return '8517 79 00';
  }

  sendEmailInvoice(): void {
    if (!this.bill || !this.customerEmail) return;

    this.sendingEmail = true;
    this.emailSentMessage = '';
    this.emailErrorMessage = '';

    const payload = {
      toEmail: this.customerEmail,
      subject: `Invoice #${this.bill.billNumber} from Mobile Shop Management`,
      message: `
        <h3>Dear ${this.bill.customerName || 'Customer'},</h3>
        <p>Thank you for purchasing at <strong>Mobile Shop Management</strong>!</p>
        <p>Please find the summary of your transaction below:</p>
        <ul>
          <li><strong>Invoice Number:</strong> ${this.bill.billNumber}</li>
          <li><strong>Date:</strong> ${new Date(this.bill.issuedAtUtc).toLocaleDateString()}</li>
          <li><strong>Total Amount:</strong> ₹${this.bill.totalAmount.toFixed(2)}</li>
          <li><strong>Payment Mode:</strong> ${this.paymentMode}</li>
          <li><strong>Balance Due:</strong> ₹${this.bill.balanceDue.toFixed(2)}</li>
        </ul>
        <p><em>${this.warrantyNote}</em></p>
        <p>Warm regards,<br><strong>Mobile Shop Management</strong><br>Proprietor: Chandan Kr Mandal<br>Phone: +91 9851632391</p>
      `
    };

    this.api.post('/api/notifications/test-email', payload).subscribe({
      next: () => {
        this.sendingEmail = false;
        this.emailSentMessage = `Invoice copy successfully sent to ${this.customerEmail}`;
      },
      error: (err) => {
        this.sendingEmail = false;
        this.emailErrorMessage = `Failed to send email: ${apiErrorMessage(err)}`;
      }
    });
  }

  amountInWords(amount: number): string {
    if (isNaN(amount) || amount <= 0) return 'INR Zero Only';

    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);

    let res = 'INR ' + this.toWords(rupees);
    if (paise > 0) {
      res += ' and ' + this.toWords(paise) + ' Paise';
    }
    return res.trim() + ' Only';
  }

  private toWords(num: number): string {
    const a = [
      '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
      'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numStr = num.toString();
    if (numStr.length > 9) return 'Overflow';

    const match = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return '';

    let str = '';
    const crore = Number(match[1]);
    const lakh = Number(match[2]);
    const thousand = Number(match[3]);
    const hundred = Number(match[4]);
    const remainder = Number(match[5]);

    str += crore !== 0 ? (a[crore] || b[Number(match[1][0])] + ' ' + a[Number(match[1][1])]) + 'Crore ' : '';
    str += lakh !== 0 ? (a[lakh] || b[Number(match[2][0])] + ' ' + a[Number(match[2][1])]) + 'Lakh ' : '';
    str += thousand !== 0 ? (a[thousand] || b[Number(match[3][0])] + ' ' + a[Number(match[3][1])]) + 'Thousand ' : '';
    str += hundred !== 0 ? a[hundred] + 'Hundred ' : '';
    str += remainder !== 0 ? ((str !== '') ? 'and ' : '') + (a[remainder] || b[Number(match[5][0])] + ' ' + a[Number(match[5][1])]) : '';

    return str.trim();
  }
}
