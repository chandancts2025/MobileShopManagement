import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { RepairTicketDto, repairStatusOptions } from '../core/api.models';
import { dateTime, enumLabel, fromLocalInputValue, money, toLocalInputValue } from '../core/formatters';

type RepairForm = {
  customerProfileId: string;
  customerName: string;
  phoneNumber: string;
  deviceBrand: string;
  deviceModel: string;
  imeiOrSerialNumber: string;
  problemDescription: string;
  technicianNotes: string;
  estimatedCost: number;
  advanceAmount: number;
  finalAmount: number;
  expectedDeliveryUtc: string;
};

@Component({
  selector: 'app-repairs',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>
          Repair & Service Center
          <span class="badge" style="margin-left: 8px; font-size: 0.78rem;">{{ tickets.length }} tickets</span>
        </h2>
        <p>Service intake, job cards, repair status tracking, and delivery diagnostics.</p>
      </div>
      <button class="btn primary" type="button" (click)="toggleForm()">
        {{ formOpen ? '✕ Close Form' : '✨ + New Repair Ticket' }}
      </button>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <!-- Top Expandable Repair Intake / Edit Form -->
    @if (formOpen) {
      <section class="top-form-card" [class.loading]="saving">
        <div class="top-form-header">
          <div class="top-form-title">
            <span class="badge" [class.good]="!editingId" [class.warn]="!!editingId">
              {{ editingId ? 'EDIT MODE' : 'NEW INTAKE' }}
            </span>
            <h3>
              {{ editingId ? '✏️ Edit Repair Ticket #' + (editingTicketNumber || editingId) : '✨ New Repair Job Card Intake' }}
            </h3>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            @if (editingId) {
              <button class="btn ghost" type="button" (click)="startCreate()" style="padding: 4px 10px; font-size: 0.82rem;">
                + Switch to New Intake
              </button>
            }
            <button class="btn ghost" type="button" (click)="closeForm()" title="Collapse form">
              ✕ Close
            </button>
          </div>
        </div>

        <div class="top-form-body">
          <form #formRef="ngForm" (ngSubmit)="save(formRef.valid ?? false)">
            <div class="grid three">
              <label class="field">
                <span>Customer Name <span class="required-star">*</span></span>
                <input class="input" name="customerName" [(ngModel)]="form.customerName" placeholder="e.g. Ramesh Kumar" required>
              </label>
              <label class="field">
                <span>Mobile Number <span class="required-star">*</span></span>
                <input class="input" name="phoneNumber" [(ngModel)]="form.phoneNumber" placeholder="e.g. 9876543210" required>
              </label>
              <label class="field">
                <span>IMEI / Serial Number</span>
                <input class="input" name="imeiOrSerialNumber" [(ngModel)]="form.imeiOrSerialNumber" placeholder="e.g. 356789012345678 (Optional)">
              </label>
            </div>

            <div class="grid three" style="margin-top: 10px;">
              <label class="field">
                <span>Device Brand <span class="required-star">*</span></span>
                <input class="input" name="deviceBrand" [(ngModel)]="form.deviceBrand" placeholder="e.g. Apple / Samsung / Xiaomi" required>
              </label>
              <label class="field">
                <span>Device Model <span class="required-star">*</span></span>
                <input class="input" name="deviceModel" [(ngModel)]="form.deviceModel" placeholder="e.g. iPhone 15 Pro / Galaxy S24" required>
              </label>
              <label class="field">
                <span>Expected Delivery</span>
                <input class="input" type="datetime-local" name="expectedDeliveryUtc" [(ngModel)]="form.expectedDeliveryUtc">
              </label>
            </div>

            <div class="grid two" style="margin-top: 10px;">
              <label class="field">
                <span>Reported Fault / Problem <span class="required-star">*</span></span>
                <textarea class="textarea" rows="2" name="problemDescription" [(ngModel)]="form.problemDescription" placeholder="e.g. Display cracked, touch unresponsive after drop" required></textarea>
              </label>
              <label class="field">
                <span>Technician / Intake Notes</span>
                <textarea class="textarea" rows="2" name="technicianNotes" [(ngModel)]="form.technicianNotes" placeholder="e.g. Body scratches noted. Estimated parts turnaround 2 days"></textarea>
              </label>
            </div>

            <div class="grid three" style="margin-top: 10px;">
              <label class="field">
                <span>Estimated Cost (₹)</span>
                <input class="input" type="number" min="0" step="0.01" name="estimatedCost" [(ngModel)]="form.estimatedCost" placeholder="0.00">
              </label>
              <label class="field">
                <span>Advance Paid (₹)</span>
                <input class="input" type="number" min="0" step="0.01" name="advanceAmount" [(ngModel)]="form.advanceAmount" placeholder="0.00">
              </label>
              @if (editingId) {
                <label class="field">
                  <span>Final Amount (₹)</span>
                  <input class="input" type="number" min="0" step="0.01" name="finalAmount" [(ngModel)]="form.finalAmount" placeholder="0.00">
                </label>
              }
            </div>

            <div class="top-form-footer">
              <button class="btn ghost" type="button" (click)="closeForm()">Cancel</button>
              <button class="btn primary" type="submit" [disabled]="formRef.invalid || saving">
                {{ saving ? 'Saving...' : (editingId ? '💾 Update Repair Ticket' : '✓ Create Repair Job Card') }}
              </button>
            </div>
          </form>

          @if (editingId) {
            <div style="margin-top: 16px; padding: 14px 18px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                <strong style="font-size: 0.88rem; color: #0f172a;">🔄 Quick Status Update Workflow</strong>
                <span class="badge" [class]="repairStatusClass(statusModel.status)">
                  Current: {{ enumLabel(repairStatusOptions, statusModel.status) }}
                </span>
              </div>
              <div class="grid two">
                <label class="field">
                  <span>Select Next Status</span>
                  <select class="select" name="statusDraft" [(ngModel)]="statusModel.status">
                    @for (status of repairStatusOptions; track status.value) {
                      <option [ngValue]="status.value">{{ status.label }}</option>
                    }
                  </select>
                </label>
                <label class="field">
                  <span>Technician Status Remarks</span>
                  <input class="input" name="statusNotes" [(ngModel)]="statusModel.technicianNotes" placeholder="e.g. Original display replaced & tested OK">
                </label>
              </div>
              <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                <button class="btn primary" type="button" (click)="updateStatus()">Apply Status Change</button>
              </div>
            </div>
          }
        </div>
      </section>
    }

    <!-- Full-Width Repair Tickets List -->
    <section class="panel" [class.loading]="loading">
      <div class="panel-header toolbar">
        <div class="toolbar-left" style="flex: 1;">
          <input class="input" style="max-width: 360px;" name="repairSearch" [(ngModel)]="query.search" (keyup.enter)="loadTickets()" placeholder="🔍 Search ticket #, customer, phone, IMEI...">
          <button class="btn" type="button" (click)="loadTickets()">Search</button>
          @if (query.search) {
            <button class="btn ghost" type="button" (click)="query.search = ''; loadTickets()">Clear</button>
          }
        </div>
        <button class="btn ghost" type="button" (click)="loadTickets()">🔄 Refresh</button>
      </div>
      <div class="table-wrap">
        <table style="width: 100%;">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Customer Details</th>
              <th>Device & Model</th>
              <th>Status</th>
              <th>Est / Final Cost</th>
              <th>Expected Delivery</th>
              <th class="actions">Print & Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (ticket of tickets; track ticket.id) {
              <tr [class.active-row]="editingId === ticket.id">
                <td>
                  <span class="code-pill">#{{ ticket.ticketNumber }}</span>
                </td>
                <td>
                  <strong>{{ ticket.customerName }}</strong>
                  <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">📞 {{ ticket.phoneNumber }}</div>
                </td>
                <td>
                  <span class="cell-chip brand">{{ ticket.deviceBrand }}</span>
                  <strong style="margin-left: 4px;">{{ ticket.deviceModel }}</strong>
                  @if (ticket.imeiOrSerialNumber) {
                    <div style="font-size: 0.74rem; color: #94a3b8; font-family: monospace;">IMEI: {{ ticket.imeiOrSerialNumber }}</div>
                  }
                </td>
                <td>
                  <span class="badge" [class]="repairStatusClass(ticket.status)">
                    {{ enumLabel(repairStatusOptions, ticket.status) }}
                  </span>
                </td>
                <td>
                  <strong class="cell-price">{{ money(ticket.finalAmount || ticket.estimatedCost) }}</strong>
                  @if (ticket.advanceAmount > 0) {
                    <div style="font-size: 0.74rem; color: #16a34a;">Adv: {{ money(ticket.advanceAmount) }}</div>
                  }
                </td>
                <td>
                  <span style="font-size: 0.84rem; color: #475569;">{{ dateTime(ticket.expectedDeliveryUtc) }}</span>
                </td>
                <td class="actions" style="text-align: right;">
                  <div style="display: inline-flex; gap: 4px; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
                    <a class="btn ghost" style="padding: 4px 8px; font-size: 0.78rem; border-color: #bae6fd; background: #f0f9ff; color: #0284c7;" [routerLink]="['/repairs', ticket.id, 'print']" [queryParams]="{ format: '80mm' }" title="Print 80mm POS Claim Token">🧾 80mm</a>
                    <a class="btn ghost" style="padding: 4px 8px; font-size: 0.78rem; border-color: #cbd5e1; background: #f8fafc; color: #334155;" [routerLink]="['/repairs', ticket.id, 'print']" [queryParams]="{ format: 'a4' }" title="Print A4 Diagnostic Job Card">📄 A4</a>
                    <button class="btn ghost" type="button" (click)="loadTicket(ticket.id)" title="Edit ticket">✏️ Edit</button>
                    @if (auth.hasAnyRole(['SuperAdmin', 'Admin'])) {
                      <button class="btn danger" type="button" (click)="deleteTicket(ticket)" title="Delete ticket">🗑️</button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7">
                  <div class="empty-state">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">🔧</div>
                    <strong>No repair tickets found</strong>
                    <p>Book a customer repair intake using the button above.</p>
                    <button class="btn primary" type="button" style="margin-top: 12px;" (click)="startCreate()">
                      + New Repair Ticket
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class RepairsComponent implements OnInit {
  tickets: RepairTicketDto[] = [];
  query = { search: '', pageNumber: 1, pageSize: 20 };
  form: RepairForm = emptyForm();
  formOpen = false;
  editingTicketNumber = '';
  statusModel = {
    status: 1,
    technicianNotes: '',
    finalAmount: null as number | null
  };
  editingId = '';
  loading = false;
  saving = false;
  error = '';
  success = '';
  readonly repairStatusOptions = repairStatusOptions;
  readonly dateTime = dateTime;
  readonly money = money;
  readonly enumLabel = enumLabel;

  repairStatusClass(status: number): string {
    switch (status) {
      case 4: return 'good';
      case 2:
      case 3: return 'warn';
      case 6: return 'bad';
      default: return '';
    }
  }

  constructor(
    private readonly api: ApiService,
    readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.api.list<RepairTicketDto>('/api/repairs', this.query).subscribe({
      next: (result) => this.tickets = result.items,
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  toggleForm(): void {
    if (this.formOpen) {
      this.closeForm();
    } else {
      this.startCreate();
    }
  }

  startCreate(): void {
    this.editingId = '';
    this.editingTicketNumber = '';
    this.form = emptyForm();
    this.statusModel = { status: 1, technicianNotes: '', finalAmount: null };
    this.formOpen = true;
    this.error = '';
    this.success = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm(): void {
    this.formOpen = false;
    this.editingId = '';
    this.editingTicketNumber = '';
  }

  loadTicket(id: string): void {
    this.error = '';
    this.api.get<RepairTicketDto>(`/api/repairs/${id}`).subscribe({
      next: (ticket) => {
        this.editingId = ticket.id;
        this.editingTicketNumber = ticket.ticketNumber;
        this.form = {
          customerProfileId: ticket.customerProfileId ?? '',
          customerName: ticket.customerName,
          phoneNumber: ticket.phoneNumber,
          deviceBrand: ticket.deviceBrand,
          deviceModel: ticket.deviceModel,
          imeiOrSerialNumber: ticket.imeiOrSerialNumber ?? '',
          problemDescription: ticket.problemDescription,
          technicianNotes: ticket.technicianNotes ?? '',
          estimatedCost: ticket.estimatedCost,
          advanceAmount: ticket.advanceAmount,
          finalAmount: ticket.finalAmount,
          expectedDeliveryUtc: toLocalInputValue(ticket.expectedDeliveryUtc)
        };
        this.statusModel = {
          status: ticket.status,
          technicianNotes: ticket.technicianNotes ?? '',
          finalAmount: ticket.finalAmount
        };
        this.formOpen = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  save(valid: boolean): void {
    if (!valid) {
      this.error = 'Please complete required repair fields.';
      return;
    }

    const payload = {
      customerProfileId: this.form.customerProfileId || null,
      customerName: this.form.customerName,
      phoneNumber: this.form.phoneNumber,
      deviceBrand: this.form.deviceBrand,
      deviceModel: this.form.deviceModel,
      imeiOrSerialNumber: this.form.imeiOrSerialNumber || null,
      problemDescription: this.form.problemDescription,
      technicianNotes: this.form.technicianNotes || null,
      estimatedCost: Number(this.form.estimatedCost),
      advanceAmount: Number(this.form.advanceAmount),
      finalAmount: Number(this.form.finalAmount),
      expectedDeliveryUtc: fromLocalInputValue(this.form.expectedDeliveryUtc)
    };

    const request = this.editingId
      ? this.api.put<RepairTicketDto>(`/api/repairs/${this.editingId}`, payload)
      : this.api.post<RepairTicketDto>('/api/repairs', payload);

    this.saving = true;
    this.error = '';
    this.success = '';
    request.subscribe({
      next: (ticket) => {
        this.success = `Repair ticket ${ticket.ticketNumber} saved successfully.`;
        this.loadTickets();
        this.loadTicket(ticket.id);
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.saving = false;
      },
      complete: () => this.saving = false
    });
  }

  updateStatus(): void {
    if (!this.editingId) {
      return;
    }

    this.api.put<RepairTicketDto>(`/api/repairs/${this.editingId}/status`, this.statusModel).subscribe({
      next: (ticket) => {
        this.success = `Status updated to ${enumLabel(repairStatusOptions, ticket.status)}.`;
        this.loadTickets();
        this.loadTicket(ticket.id);
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  deleteTicket(ticket: RepairTicketDto): void {
    if (!confirm(`Delete ticket #${ticket.ticketNumber}?`)) {
      return;
    }

    this.api.delete(`/api/repairs/${ticket.id}`).subscribe({
      next: () => {
        this.success = 'Repair ticket deleted.';
        this.loadTickets();
        if (this.editingId === ticket.id) {
          this.closeForm();
        }
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }
}

function emptyForm(): RepairForm {
  return {
    customerProfileId: '',
    customerName: '',
    phoneNumber: '',
    deviceBrand: '',
    deviceModel: '',
    imeiOrSerialNumber: '',
    problemDescription: '',
    technicianNotes: '',
    estimatedCost: 0,
    advanceAmount: 0,
    finalAmount: 0,
    expectedDeliveryUtc: ''
  };
}
