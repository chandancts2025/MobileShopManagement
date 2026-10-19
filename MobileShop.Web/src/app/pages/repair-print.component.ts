import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { RepairTicketDto, repairStatusOptions, optionLabel } from '../core/api.models';
import { money, dateTime } from '../core/formatters';

@Component({
  selector: 'app-repair-print',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="repair-print-page" [class.mode-80mm]="selectedFormat === '80mm'" [class.mode-a4]="selectedFormat === 'a4'">
      <!-- Non-printing Control Toolbar -->
      <header class="no-print screen-toolbar">
        <div class="toolbar-container">
          <div class="toolbar-brand">
            <a routerLink="/repairs" class="back-link">&larr; Back to Repairs</a>
            <h3>Repair Intake & Claim Slip Generator</h3>
          </div>

          <!-- Format Switcher -->
          <div class="format-toggle">
            <span class="label">Print Format:</span>
            <div class="btn-group">
              <button
                type="button"
                class="btn format-btn"
                [class.active]="selectedFormat === '80mm'"
                (click)="selectedFormat = '80mm'"
              >
                🧾 80mm Customer Token
              </button>
              <button
                type="button"
                class="btn format-btn"
                [class.active]="selectedFormat === 'a4'"
                (click)="selectedFormat = 'a4'"
              >
                📄 A4 Workshop Job Card
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
                (click)="sendEmailClaimSlip()"
                title="Send claim slip to customer via SMTP"
              >
                {{ sendingEmail ? '✉️ Sending...' : '✉️ Email Token' }}
              </button>
            }
            <button type="button" class="btn primary print-trigger-btn" (click)="print()">
              🖨️ Print Slip (Ctrl+P)
            </button>
          </div>
        </div>

        <!-- Quick Intake Adjustments -->
        <div class="options-drawer">
          <div class="options-grid">
            <label class="opt-field">
              <span>Customer Email (for e-Receipt)</span>
              <input type="email" [(ngModel)]="customerEmail" placeholder="customer@example.com" class="opt-input" />
            </label>

            <label class="opt-field">
              <span>Physical Condition / Scratches</span>
              <input type="text" [(ngModel)]="physicalCondition" placeholder="e.g. Scratches on screen, minor corner dent" class="opt-input" />
            </label>

            <label class="opt-field">
              <span>SIM / Memory / Case Included</span>
              <input type="text" [(ngModel)]="accessoriesIncluded" placeholder="e.g. No SIM, back cover attached" class="opt-input" />
            </label>

            <label class="opt-field">
              <span>Service Warranty</span>
              <input type="text" [(ngModel)]="serviceWarranty" placeholder="e.g. 90-Day Screen Warranty" class="opt-input" />
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
          <p>Loading repair ticket...</p>
        </div>
      } @else if (ticket) {

        <!-- =========================================================================
             80MM THERMAL CUSTOMER CLAIM TOKEN FORMAT
             ========================================================================= -->
        @if (selectedFormat === '80mm') {
          <div class="slip-container slip-80mm">
            <div class="thermal-receipt">
              <div class="th-header">
                <div class="th-brand">*** MOBILE SHOP ***</div>
                <div class="th-sub">CARE & REPAIR CENTER</div>
                <div class="th-owner">Prop: Chandan Kr Mandal</div>
                <div class="th-address">3B8-2D, Sanhita Township, Newtown, 700135, WB</div>
                <div class="th-contact">Ph: +91 9851632391</div>
                <div class="th-gst">GSTIN: 19AABCX1234F1Z8</div>
              </div>

              <div class="th-divider">================================</div>
              <div class="th-title-banner">** SERVICE CLAIM TOKEN **</div>
              <div class="th-divider">================================</div>

              <div class="th-meta">
                <div class="th-row"><span>TOKEN #:</span> <strong>{{ ticket.ticketNumber }}</strong></div>
                <div class="th-row"><span>INTAKE :</span> {{ ticket.createdAtUtc | date:'dd/MM/yyyy HH:mm' }}</div>
                <div class="th-row"><span>STATUS :</span> <strong>{{ getStatusLabel(ticket.status) }}</strong></div>
                <div class="th-row"><span>CUST   :</span> {{ ticket.customerName }}</div>
                <div class="th-row"><span>PHONE  :</span> <strong>{{ ticket.phoneNumber }}</strong></div>
              </div>

              <div class="th-divider">--------------------------------</div>
              <div class="th-section-title">[ DEVICE DETAILS ]</div>
              <div class="th-meta">
                <div class="th-row"><span>MODEL  :</span> <strong>{{ ticket.deviceBrand }} {{ ticket.deviceModel }}</strong></div>
                @if (ticket.imeiOrSerialNumber) {
                  <div class="th-row"><span>IMEI/SN:</span> <code>{{ ticket.imeiOrSerialNumber }}</code></div>
                }
                <div class="th-row"><span>COND   :</span> <span>{{ physicalCondition }}</span></div>
                <div class="th-row"><span>ITEMS  :</span> <span>{{ accessoriesIncluded }}</span></div>
              </div>

              <div class="th-divider">--------------------------------</div>
              <div class="th-section-title">[ REPORTED FAULT ]</div>
              <div class="th-fault-box">
                {{ ticket.problemDescription || 'General diagnosis & hardware repair' }}
              </div>

              <div class="th-divider">--------------------------------</div>
              <div class="th-section-title">[ ESTIMATED CHARGES ]</div>
              <div class="th-totals">
                <div class="th-row"><span>Estimated Cost:</span> <span>₹{{ (ticket.estimatedCost || 0) | number:'1.2-2' }}</span></div>
                <div class="th-row"><span>Advance Paid:</span> <strong>₹{{ (ticket.advanceAmount || 0) | number:'1.2-2' }}</strong></div>
                <div class="th-divider">--------------------------------</div>
                <div class="th-row th-grand">
                  <span>BAL TO PAY:</span>
                  <strong>₹{{ ((ticket.estimatedCost || 0) - (ticket.advanceAmount || 0)) | number:'1.2-2' }}</strong>
                </div>
                <div class="th-row"><span>Target Delivery:</span> <span>{{ ticket.expectedDeliveryUtc | date:'dd/MM/yyyy' }}</span></div>
              </div>

              <div class="th-divider">================================</div>
              <div class="th-footer">
                <div class="th-terms">
                  <p>1. Present this original token slip to claim phone.</p>
                  <p>2. Please backup data. Shop not liable for data loss.</p>
                  <p>3. Claim within 30 days of repair readiness.</p>
                  <p>4. {{ serviceWarranty }}</p>
                </div>
                <div class="th-barcode">
                  ||| | ||||| || |||||| |||| | ||
                </div>
                <div class="th-sign">Cust. Sign: _____________________</div>
                <div class="th-thanks">*** THANK YOU FOR TRUSTING US ***</div>
              </div>
            </div>
          </div>
        }

        <!-- =========================================================================
             A4 WORKSHOP DIAGNOSTIC JOB SHEET FORMAT
             ========================================================================= -->
        @if (selectedFormat === 'a4') {
          <div class="slip-container slip-a4">
            <!-- Header -->
            <div class="a4-header-top">
              <div class="invoice-badge">WORKSHOP REPAIR JOB CARD & DIAGNOSTIC REPORT</div>
              <div class="copy-badge">INTERNAL TECHNICIAN SHEET</div>
            </div>

            <!-- Shop Info & Ticket Meta -->
            <div class="a4-grid-header">
              <div class="shop-col">
                <div class="shop-brand">
                  <span class="shop-logo">📱</span>
                  <div>
                    <h1 class="shop-title">MOBILE SHOP MANAGEMENT</h1>
                    <p class="shop-tagline">Multi-Brand Chip Level Service • Screen, Battery & IC Replacement</p>
                  </div>
                </div>
                <div class="shop-details">
                  <p><strong>Proprietor:</strong> Chandan Kr Mandal &nbsp;|&nbsp; <strong>Helpline:</strong> +91 9851632391</p>
                  <p><strong>Service Center:</strong> 3B8-2D, Sanhita Township, Newtown, Kolkata 700135, West Bengal</p>
                  <p><strong>Email:</strong> chandankr.mandal87&#64;gmail.com &nbsp;|&nbsp; <strong>GSTIN:</strong> 19AABCX1234F1Z8</p>
                </div>
              </div>

              <div class="meta-col">
                <table class="meta-table">
                  <tr>
                    <th>Job Ticket No:</th>
                    <td><strong>{{ ticket.ticketNumber }}</strong></td>
                  </tr>
                  <tr>
                    <th>Intake Date:</th>
                    <td>{{ ticket.createdAtUtc | date:'dd-MMM-yyyy, HH:mm' }}</td>
                  </tr>
                  <tr>
                    <th>Expected Delivery:</th>
                    <td><strong>{{ ticket.expectedDeliveryUtc | date:'dd-MMM-yyyy' }}</strong></td>
                  </tr>
                  <tr>
                    <th>Current Status:</th>
                    <td>
                      <span class="status-pill active-status">
                        {{ getStatusLabel(ticket.status) }}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Customer & Device Grid -->
            <div class="a4-two-box-grid">
              <div class="a4-box">
                <div class="box-header">CUSTOMER INFORMATION</div>
                <div class="box-body">
                  <p><strong>Customer Name:</strong> {{ ticket.customerName }}</p>
                  <p><strong>Contact Number:</strong> {{ ticket.phoneNumber }}</p>
                  <p><strong>Email:</strong> {{ customerEmail || 'Counter Deposit' }}</p>
                </div>
              </div>

              <div class="a4-box">
                <div class="box-header">HANDSET & HARDWARE DETAILS</div>
                <div class="box-body">
                  <p><strong>Device:</strong> {{ ticket.deviceBrand }} {{ ticket.deviceModel }}</p>
                  <p><strong>IMEI / Serial No:</strong> <code>{{ ticket.imeiOrSerialNumber || 'Not logged' }}</code></p>
                  <p><strong>Condition:</strong> {{ physicalCondition }}</p>
                  <p><strong>Accessories Left:</strong> {{ accessoriesIncluded }}</p>
                </div>
              </div>
            </div>

            <!-- Problem Description & Diagnostic Inspection Matrix -->
            <div class="a4-box" style="margin-top: 14px;">
              <div class="box-header">REPORTED FAULT & CUSTOMER REMARKS</div>
              <div class="box-body">
                <div class="fault-text-box">
                  {{ ticket.problemDescription || 'Hardware diagnosis and repair.' }}
                </div>
              </div>
            </div>

            <!-- Pre-Repair & Post-Repair 10-Point Hardware Inspection Checklist -->
            <div class="a4-box" style="margin-top: 14px;">
              <div class="box-header">10-POINT HARDWARE DIAGNOSTIC CHECKLIST</div>
              <div class="box-body table-pad">
                <table class="diag-table">
                  <thead>
                    <tr>
                      <th>Hardware Component</th>
                      <th>Intake Check</th>
                      <th>Post-Repair Test</th>
                      <th>Technician Findings / Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>OLED / Display & Touch</strong></td>
                      <td>[ ] OK &nbsp; [✓] Damaged / Lines</td>
                      <td>[ ] Passed &nbsp; [ ] Fail</td>
                      <td>Touch digitizer & color rendering check</td>
                    </tr>
                    <tr>
                      <td><strong>Front & Rear Cameras</strong></td>
                      <td>[✓] OK &nbsp; [ ] Not Working</td>
                      <td>[ ] Passed &nbsp; [ ] Fail</td>
                      <td>Focus, flash & portrait sensor alignment</td>
                    </tr>
                    <tr>
                      <td><strong>Charging Port & Battery</strong></td>
                      <td>[✓] Charging &nbsp; [ ] Loose</td>
                      <td>[ ] Passed &nbsp; [ ] Fail</td>
                      <td>Fast charging amp current verification</td>
                    </tr>
                    <tr>
                      <td><strong>Biometrics (FaceID / Fingerprint)</strong></td>
                      <td>[✓] Active &nbsp; [ ] Faulty</td>
                      <td>[ ] Passed &nbsp; [ ] Fail</td>
                      <td>Security sensor registration test</td>
                    </tr>
                    <tr>
                      <td><strong>Earpiece, Mic & Loudspeaker</strong></td>
                      <td>[✓] OK &nbsp; [ ] Distorted</td>
                      <td>[ ] Passed &nbsp; [ ] Fail</td>
                      <td>Two-way GSM voice call clarity test</td>
                    </tr>
                    <tr>
                      <td><strong>WiFi, Bluetooth & Cellular Signal</strong></td>
                      <td>[✓] Connected &nbsp; [ ] Weak</td>
                      <td>[ ] Passed &nbsp; [ ] Fail</td>
                      <td>RF network antenna verification</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Financials & Technician Sign-off -->
            <div class="a4-grid-header" style="margin-top: 16px;">
              <div class="shop-col">
                <div class="a4-box">
                  <div class="box-header">SERVICE COST BREAKDOWN</div>
                  <div class="box-body">
                    <table class="meta-table">
                      <tr>
                        <th>Estimated Cost:</th>
                        <td><strong>₹{{ (ticket.estimatedCost || 0) | number:'1.2-2' }}</strong></td>
                      </tr>
                      <tr>
                        <th>Advance Received:</th>
                        <td><span style="color: #16a34a; font-weight: 700;">₹{{ (ticket.advanceAmount || 0) | number:'1.2-2' }}</span></td>
                      </tr>
                      <tr>
                        <th>Balance to Collect:</th>
                        <td><strong style="color: #dc2626;">₹{{ ((ticket.estimatedCost || 0) - (ticket.advanceAmount || 0)) | number:'1.2-2' }}</strong></td>
                      </tr>
                      <tr>
                        <th>Final Settled Amount:</th>
                        <td>₹{{ (ticket.finalAmount || ticket.estimatedCost || 0) | number:'1.2-2' }}</td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>

              <div class="meta-col">
                <div class="a4-box">
                  <div class="box-header">TECHNICIAN REMARKS</div>
                  <div class="box-body">
                    <p style="margin: 0 0 4px; font-size: 0.8rem; color: #475569;">
                      {{ ticket.technicianNotes || 'Parts inspected. Under diagnosis in lab workbench.' }}
                    </p>
                    <p style="margin: 4px 0 0; font-size: 0.75rem; color: #64748b;">
                      <strong>Warranty:</strong> {{ serviceWarranty }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Signatures -->
            <div class="a4-signatures">
              <div class="sign-block">
                <div class="sign-line"></div>
                <p>Customer Handover Signature</p>
              </div>
              <div class="sign-block right">
                <div class="sign-line"></div>
                <p><strong>Chief Technician / Shop Incharge</strong></p>
                <small>For Mobile Shop Management</small>
              </div>
            </div>
          </div>
        }

      } @else {
        <div class="empty-state no-print" style="margin: 40px auto; text-align: center;">
          <p>Repair ticket not found.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .repair-print-page {
      background: #e2e8f0;
      min-height: 100vh;
      padding: 24px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .screen-toolbar {
      max-width: 860px;
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .opt-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
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

    /* 80mm Slip Layout */
    .slip-80mm {
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

    .thermal-receipt { width: 100%; }
    .th-header { text-align: center; margin-bottom: 6px; }
    .th-brand { font-size: 14px; font-weight: 900; letter-spacing: 1px; }
    .th-sub { font-size: 10px; font-weight: 700; margin-top: 2px; }
    .th-owner { font-size: 11px; font-weight: bold; margin-top: 2px; }
    .th-address, .th-contact, .th-gst { font-size: 10px; }

    .th-title-banner {
      text-align: center;
      font-weight: 900;
      font-size: 12px;
      padding: 2px 0;
    }

    .th-divider {
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
      margin: 4px 0;
      font-size: 10px;
    }

    .th-section-title {
      font-weight: 800;
      font-size: 11px;
      margin: 4px 0 2px 0;
    }

    .th-row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      font-size: 11px;
    }

    .th-fault-box {
      background: #f1f5f9;
      padding: 6px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-style: italic;
      margin: 4px 0;
    }

    .th-grand {
      font-size: 13px;
      font-weight: 900;
      padding: 2px 0;
    }

    .th-footer {
      text-align: center;
      margin-top: 8px;
    }

    .th-terms {
      text-align: left;
      font-size: 9.5px;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    .th-terms p { margin: 2px 0; }

    .th-barcode {
      font-family: 'Libre Barcode 39', 'Courier New', monospace;
      font-size: 20px;
      letter-spacing: 2px;
      margin: 6px 0;
    }

    .th-sign {
      margin: 10px 0 6px 0;
      font-size: 10px;
      text-align: left;
    }

    .th-thanks {
      font-size: 10px;
      font-weight: bold;
    }

    /* A4 Workshop Sheet Layout */
    .slip-a4 {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 4px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
      color: #0f172a;
      box-sizing: border-box;
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
      letter-spacing: 0.04em;
      color: #0f172a;
    }

    .copy-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      border: 1px solid #94a3b8;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .a4-grid-header {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
      margin-bottom: 14px;
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
      color: #0f172a;
    }

    .shop-tagline {
      margin: 2px 0 0 0;
      font-size: 0.78rem;
      color: #64748b;
    }

    .shop-details p {
      margin: 2px 0;
      font-size: 0.8rem;
      color: #334155;
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

    .status-pill {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.75rem;
    }
    .status-pill.active-status {
      background: #e0f2fe;
      color: #0369a1;
    }

    .a4-two-box-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .a4-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    .box-header {
      background: #f1f5f9;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #475569;
      padding: 5px 10px;
      border-bottom: 1px solid #cbd5e1;
    }

    .box-body {
      padding: 8px 12px;
      font-size: 0.85rem;
    }
    .box-body p { margin: 3px 0; }
    .box-body.table-pad { padding: 0; }

    .fault-text-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 8px 12px;
      font-size: 0.85rem;
      color: #92400e;
      border-radius: 4px;
    }

    .diag-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }

    .diag-table th {
      background: #f8fafc;
      padding: 6px 10px;
      font-size: 0.75rem;
      color: #475569;
      text-align: left;
      border-bottom: 1px solid #cbd5e1;
    }

    .diag-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
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
    .sign-line {
      border-bottom: 1px dashed #94a3b8;
      margin-bottom: 6px;
    }
    .sign-block p { margin: 2px 0; font-size: 0.82rem; }
    .sign-block small { font-size: 0.72rem; color: #64748b; }

    /* =========================================================================
       PRINT MEDIA QUERIES (TRUE TO SIZE)
       ========================================================================= */
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .no-print {
        display: none !important;
      }

      .repair-print-page {
        background: transparent !important;
        padding: 0 !important;
        min-height: auto !important;
      }

      /* 80mm Print Rules */
      .repair-print-page.mode-80mm {
        width: 76mm !important;
        max-width: 76mm !important;
        margin: 0 !important;
      }

      .repair-print-page.mode-80mm .slip-80mm {
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 76mm !important;
        width: 76mm !important;
      }

      @page {
        margin: 5mm;
      }

      /* 80mm Print Rules */
      .repair-print-page.mode-80mm {
        width: 76mm !important;
        max-width: 76mm !important;
        margin: 0 !important;
      }

      .repair-print-page.mode-80mm .slip-80mm {
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 76mm !important;
        width: 76mm !important;
      }

      /* A4 Print Rules */
      .repair-print-page.mode-a4 {
        width: 100% !important;
      }

      .repair-print-page.mode-a4 .slip-a4 {
        box-shadow: none !important;
        max-width: 100% !important;
        width: 100% !important;
        padding: 0 !important;
      }
    }
  `]
})
export class RepairPrintComponent implements OnInit {
  ticket: RepairTicketDto | null = null;
  loading = false;
  error = '';
  selectedFormat: '80mm' | 'a4' = '80mm';

  customerEmail = '';
  physicalCondition = 'Minor body wear, screen intact prior to service';
  accessoriesIncluded = 'Handset only (SIM/Memory removed)';
  serviceWarranty = '90-Day Service Warranty on replaced parts';

  sendingEmail = false;
  emailSentMessage = '';
  emailErrorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No repair ticket id provided.';
      return;
    }

    const fmt = this.route.snapshot.queryParamMap.get('format');
    if (fmt === 'a4') {
      this.selectedFormat = 'a4';
    } else {
      this.selectedFormat = '80mm';
    }

    this.loadTicket(id);
  }

  loadTicket(id: string): void {
    this.loading = true;
    this.error = '';
    this.api.get<RepairTicketDto>(`/api/repairs/${id}`).subscribe({
      next: (t) => {
        this.ticket = t;
      },
      error: (err) => (this.error = apiErrorMessage(err)),
      complete: () => (this.loading = false)
    });
  }

  getStatusLabel(status: number): string {
    return optionLabel(repairStatusOptions, status);
  }

  print(): void {
    window.print();
  }

  sendEmailClaimSlip(): void {
    if (!this.ticket || !this.customerEmail) return;

    this.sendingEmail = true;
    this.emailSentMessage = '';
    this.emailErrorMessage = '';

    const payload = {
      toEmail: this.customerEmail,
      subject: `Repair Token #${this.ticket.ticketNumber} - Mobile Shop Management`,
      message: `
        <h3>Dear ${this.ticket.customerName},</h3>
        <p>Your device repair intake has been registered at <strong>Mobile Shop Management & Care</strong>.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
          <tr><td><strong>Token Number:</strong></td><td>${this.ticket.ticketNumber}</td></tr>
          <tr><td><strong>Device:</strong></td><td>${this.ticket.deviceBrand} ${this.ticket.deviceModel}</td></tr>
          <tr><td><strong>Reported Fault:</strong></td><td>${this.ticket.problemDescription || 'Hardware Repair'}</td></tr>
          <tr><td><strong>Estimated Cost:</strong></td><td>₹${(this.ticket.estimatedCost || 0).toFixed(2)}</td></tr>
          <tr><td><strong>Advance Received:</strong></td><td>₹${(this.ticket.advanceAmount || 0).toFixed(2)}</td></tr>
          <tr><td><strong>Balance on Delivery:</strong></td><td>₹${((this.ticket.estimatedCost || 0) - (this.ticket.advanceAmount || 0)).toFixed(2)}</td></tr>
          <tr><td><strong>Target Delivery Date:</strong></td><td>${this.ticket.expectedDeliveryUtc ? new Date(this.ticket.expectedDeliveryUtc).toLocaleDateString() : 'To be confirmed'}</td></tr>
        </table>
        <p><strong>Note:</strong> Please present this token number when picking up your phone. ${this.serviceWarranty}.</p>
        <p>Warm regards,<br><strong>Mobile Shop Management</strong><br>Proprietor: Chandan Kr Mandal<br>Helpline: +91 9851632391</p>
      `
    };

    this.api.post('/api/notifications/test-email', payload).subscribe({
      next: () => {
        this.sendingEmail = false;
        this.emailSentMessage = `Claim token emailed to ${this.customerEmail}`;
      },
      error: (err) => {
        this.sendingEmail = false;
        this.emailErrorMessage = `Failed to send email: ${apiErrorMessage(err)}`;
      }
    });
  }
}
