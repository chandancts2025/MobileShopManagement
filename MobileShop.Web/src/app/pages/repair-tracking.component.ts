import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { RepairTicketDto, RepairTicketStatus, repairStatusOptions, optionLabel } from '../core/api.models';
import { dateTime, money } from '../core/formatters';

@Component({
  selector: 'app-repair-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>🔧 Repair Service Tracker</h2>
        <p>Live status tracker for mobile screen replacements, battery repairs, and diagnostics</p>
      </div>
      <div class="toolbar-right">
        <a class="btn primary" routerLink="/catalog">Browse Handsets</a>
      </div>
    </div>

    <!-- Search Box -->
    <div class="panel" style="margin-bottom: 20px;">
      <div class="panel-body" style="padding: 24px;">
        <h3 style="margin: 0 0 8px;">Track Your Device Repair</h3>
        <p class="muted" style="margin: 0 0 16px;">
          Enter your repair ticket number (e.g. <code>REP-2026...</code>) or registered phone number.
        </p>

        <form (ngSubmit)="searchTicket()" style="display: flex; gap: 10px; max-width: 600px; flex-wrap: wrap;">
          <input
            type="text"
            class="input"
            style="flex: 1; min-width: 240px; font-size: 1rem; padding: 10px 14px;"
            placeholder="Ticket # or Phone number"
            [(ngModel)]="searchQuery"
            name="searchQuery"
            required
          />
          <button type="submit" class="btn primary" [disabled]="loading || !searchQuery.trim()" style="padding: 10px 20px; font-size: 1rem;">
            {{ loading ? 'Searching...' : 'Track Device →' }}
          </button>
        </form>

        @if (error) {
          <div class="message error" style="margin-top: 14px;">{{ error }}</div>
        }
      </div>
    </div>

    <!-- Search Results / Ticket Card -->
    @if (ticket) {
      <div class="panel" style="margin-bottom: 20px; border-top: 4px solid var(--primary);">
        <div class="panel-header" style="flex-wrap: wrap; gap: 10px;">
          <div>
            <span class="badge primary" style="font-size: 0.85rem; margin-bottom: 4px; display: inline-block;">
              {{ ticket.ticketNumber }}
            </span>
            <h3 style="margin: 2px 0 0;">{{ ticket.deviceBrand }} {{ ticket.deviceModel }}</h3>
          </div>
          <span [class]="'badge ' + getStatusBadgeClass(ticket.status)" style="font-size: 0.95rem; padding: 6px 12px;">
            {{ getStatusLabel(ticket.status) }}
          </span>
        </div>

        <div class="panel-body">
          <!-- Milestone Progress Stepper -->
          <div class="stepper-wrap" style="margin: 24px 0 32px;">
            <div class="stepper">
              <div class="step" [class.completed]="getStepIndex(ticket.status) >= 1" [class.active]="getStepIndex(ticket.status) === 1">
                <div class="step-circle">1</div>
                <div class="step-label">Received</div>
              </div>
              <div class="step-line" [class.filled]="getStepIndex(ticket.status) >= 2"></div>
              
              <div class="step" [class.completed]="getStepIndex(ticket.status) >= 2" [class.active]="getStepIndex(ticket.status) === 2">
                <div class="step-circle">2</div>
                <div class="step-label">Diagnosing</div>
              </div>
              <div class="step-line" [class.filled]="getStepIndex(ticket.status) >= 3"></div>

              <div class="step" [class.completed]="getStepIndex(ticket.status) >= 3" [class.active]="getStepIndex(ticket.status) === 3">
                <div class="step-circle">3</div>
                <div class="step-label">In Repair</div>
              </div>
              <div class="step-line" [class.filled]="getStepIndex(ticket.status) >= 4"></div>

              <div class="step" [class.completed]="getStepIndex(ticket.status) >= 4" [class.active]="getStepIndex(ticket.status) === 4">
                <div class="step-circle">4</div>
                <div class="step-label">Ready</div>
              </div>
              <div class="step-line" [class.filled]="getStepIndex(ticket.status) >= 5"></div>

              <div class="step" [class.completed]="getStepIndex(ticket.status) >= 5" [class.active]="getStepIndex(ticket.status) === 5">
                <div class="step-circle">5</div>
                <div class="step-label">Delivered</div>
              </div>
            </div>
          </div>

          <!-- Ticket Information Grid -->
          <div class="grid three" style="gap: 16px;">
            <div class="info-block">
              <p class="muted">Customer Name</p>
              <strong>{{ ticket.customerName }}</strong>
              <p class="muted" style="margin-top: 4px; font-size: 0.85rem;">📞 {{ ticket.phoneNumber }}</p>
            </div>
            <div class="info-block">
              <p class="muted">IMEI / Serial Number</p>
              <strong>{{ ticket.imeiOrSerialNumber || 'N/A' }}</strong>
            </div>
            <div class="info-block">
              <p class="muted">Intake Date</p>
              <strong>{{ dateTime(ticket.createdAtUtc) }}</strong>
            </div>

            <div class="info-block" style="grid-column: span 2;">
              <p class="muted">Problem Reported</p>
              <div style="background: var(--surface-2); padding: 10px 14px; border-radius: 6px; margin-top: 4px;">
                {{ ticket.problemDescription }}
              </div>
            </div>
            <div class="info-block">
              <p class="muted">Expected Ready Date</p>
              <strong>{{ ticket.expectedDeliveryUtc ? dateTime(ticket.expectedDeliveryUtc) : 'To be confirmed' }}</strong>
            </div>

            @if (ticket.technicianNotes) {
              <div class="info-block" style="grid-column: span 3;">
                <p class="muted">Technician Notes</p>
                <div style="background: var(--info-soft); padding: 10px 14px; border-radius: 6px; margin-top: 4px; color: #1e3a8a;">
                  👨‍🔧 {{ ticket.technicianNotes }}
                </div>
              </div>
            }
          </div>

          <!-- Financial Breakdown -->
          <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
            <div style="display: flex; gap: 24px; flex-wrap: wrap;">
              <div>
                <span class="muted" style="font-size: 0.85rem;">Estimated Cost:</span>
                <strong style="margin-left: 6px;">{{ money(ticket.estimatedCost) }}</strong>
              </div>
              <div>
                <span class="muted" style="font-size: 0.85rem;">Advance Paid:</span>
                <strong style="margin-left: 6px; color: var(--primary);">{{ money(ticket.advanceAmount) }}</strong>
              </div>
              <div>
                <span class="muted" style="font-size: 0.85rem;">Balance Due:</span>
                <strong style="margin-left: 6px; color: var(--danger);">{{ money(getBalanceDue(ticket)) }}</strong>
              </div>
            </div>
            <button class="btn ghost" (click)="searchTicket()">↻ Refresh Status</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 700px;
      margin: 0 auto;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--surface-2);
      border: 2px solid var(--line-strong);
      color: var(--muted);
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }
    .step.completed .step-circle {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }
    .step.active .step-circle {
      border-color: var(--primary);
      color: var(--primary);
      box-shadow: 0 0 0 4px var(--primary-soft);
    }
    .step-label {
      margin-top: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--muted);
      text-align: center;
    }
    .step.completed .step-label,
    .step.active .step-label {
      color: var(--text);
    }
    .step-line {
      flex: 1;
      height: 3px;
      background: var(--line-strong);
      margin: 0 8px -18px;
    }
    .step-line.filled {
      background: var(--primary);
    }
    .info-block p {
      margin: 0 0 4px;
      font-size: 0.82rem;
    }
    @media (max-width: 600px) {
      .step-label {
        font-size: 0.68rem;
      }
      .step-circle {
        width: 28px;
        height: 28px;
        font-size: 0.8rem;
      }
    }
  `]
})
export class RepairTrackingComponent implements OnInit {
  searchQuery = '';
  ticket: RepairTicketDto | null = null;
  loading = false;
  error = '';
  readonly dateTime = dateTime;
  readonly money = money;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    // If ticket in history or demo
    const lastTicket = localStorage.getItem('last-tracked-repair');
    if (lastTicket) {
      this.searchQuery = lastTicket;
      this.searchTicket();
    }
  }

  searchTicket(): void {
    if (!this.searchQuery.trim()) return;

    this.loading = true;
    this.error = '';
    const query = this.searchQuery.trim();

    this.api.get<RepairTicketDto>(`/api/repairs/track/${encodeURIComponent(query)}`).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.loading = false;
        localStorage.setItem('last-tracked-repair', query);
      },
      error: (err) => {
        this.ticket = null;
        this.error = apiErrorMessage(err) || 'Repair ticket not found. Please verify the ticket or phone number.';
        this.loading = false;
      }
    });
  }

  getStepIndex(status: RepairTicketStatus): number {
    switch (status) {
      case RepairTicketStatus.Received: return 1;
      case RepairTicketStatus.Diagnosing: return 2;
      case RepairTicketStatus.WaitingForParts:
      case RepairTicketStatus.InRepair: return 3;
      case RepairTicketStatus.ReadyForPickup: return 4;
      case RepairTicketStatus.Delivered: return 5;
      default: return 1;
    }
  }

  getStatusLabel(status: RepairTicketStatus): string {
    return optionLabel(repairStatusOptions, status);
  }

  getStatusBadgeClass(status: RepairTicketStatus): string {
    switch (status) {
      case RepairTicketStatus.Received: return 'warn';
      case RepairTicketStatus.Diagnosing:
      case RepairTicketStatus.InRepair: return 'primary';
      case RepairTicketStatus.ReadyForPickup:
      case RepairTicketStatus.Delivered: return 'good';
      case RepairTicketStatus.Cancelled: return 'bad';
      default: return '';
    }
  }

  getBalanceDue(ticket: RepairTicketDto): number {
    const total = ticket.finalAmount > 0 ? ticket.finalAmount : ticket.estimatedCost;
    return Math.max(0, total - ticket.advanceAmount);
  }
}
