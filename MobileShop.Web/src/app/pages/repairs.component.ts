import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Repairs</h2>
        <p>Service intake, ticket edits, status updates, and delivery tracking.</p>
      </div>
      <button class="btn primary" type="button" (click)="startCreate()">New repair ticket</button>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }
    @if (success) {
      <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
    }

    <div class="split">
      <section class="panel" [class.loading]="loading">
        <div class="panel-header toolbar">
          <div class="toolbar-left">
            <input class="input" style="width: min(340px, 100%);" name="repairSearch" [(ngModel)]="query.search" (keyup.enter)="loadTickets()" placeholder="Search ticket, customer, phone, IMEI">
            <button class="btn" type="button" (click)="loadTickets()">Search</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Expected</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (ticket of tickets; track ticket.id) {
                <tr>
                  <td>{{ ticket.ticketNumber }}</td>
                  <td>{{ ticket.customerName }}<br><span class="muted">{{ ticket.phoneNumber }}</span></td>
                  <td>{{ ticket.deviceBrand }} {{ ticket.deviceModel }}</td>
                  <td>{{ enumLabel(repairStatusOptions, ticket.status) }}</td>
                  <td>{{ money(ticket.finalAmount || ticket.estimatedCost) }}</td>
                  <td>{{ dateTime(ticket.expectedDeliveryUtc) }}</td>
                  <td class="actions">
                    <button class="btn ghost" type="button" (click)="loadTicket(ticket.id)">Edit</button>
                    @if (auth.hasAnyRole(['SuperAdmin', 'Admin'])) {
                      <button class="btn danger" type="button" (click)="deleteTicket(ticket)">Delete</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7"><div class="empty-state">No repair tickets found.</div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <aside class="panel">
        <div class="panel-header">
          <strong>{{ editingId ? 'Edit repair ticket' : 'Create repair ticket' }}</strong>
        </div>
        <div class="panel-body grid">
          <form class="grid" #formRef="ngForm" (ngSubmit)="save(formRef.valid ?? false)">
            <label class="field">
              <span>Customer profile ID</span>
              <input class="input" name="customerProfileId" [(ngModel)]="form.customerProfileId" placeholder="Optional">
            </label>
            <div class="grid two">
              <label class="field">
                <span>Customer name</span>
                <input class="input" name="customerName" [(ngModel)]="form.customerName" required>
              </label>
              <label class="field">
                <span>Phone</span>
                <input class="input" name="phoneNumber" [(ngModel)]="form.phoneNumber" required>
              </label>
            </div>
            <div class="grid two">
              <label class="field">
                <span>Device brand</span>
                <input class="input" name="deviceBrand" [(ngModel)]="form.deviceBrand" required>
              </label>
              <label class="field">
                <span>Device model</span>
                <input class="input" name="deviceModel" [(ngModel)]="form.deviceModel" required>
              </label>
            </div>
            <label class="field">
              <span>IMEI or serial</span>
              <input class="input" name="imeiOrSerialNumber" [(ngModel)]="form.imeiOrSerialNumber">
            </label>
            <label class="field">
              <span>Problem</span>
              <textarea class="textarea" name="problemDescription" [(ngModel)]="form.problemDescription" required></textarea>
            </label>
            <label class="field">
              <span>Technician notes</span>
              <textarea class="textarea" name="technicianNotes" [(ngModel)]="form.technicianNotes"></textarea>
            </label>
            <div class="grid two">
              <label class="field">
                <span>Estimated cost</span>
                <input class="input" type="number" min="0" step="0.01" name="estimatedCost" [(ngModel)]="form.estimatedCost">
              </label>
              <label class="field">
                <span>Advance</span>
                <input class="input" type="number" min="0" step="0.01" name="advanceAmount" [(ngModel)]="form.advanceAmount">
              </label>
              @if (editingId) {
                <label class="field">
                  <span>Final amount</span>
                  <input class="input" type="number" min="0" step="0.01" name="finalAmount" [(ngModel)]="form.finalAmount">
                </label>
              }
              <label class="field">
                <span>Expected delivery</span>
                <input class="input" type="datetime-local" name="expectedDeliveryUtc" [(ngModel)]="form.expectedDeliveryUtc">
              </label>
            </div>
            <button class="btn primary" type="submit" [disabled]="formRef.invalid || saving">{{ saving ? 'Saving...' : 'Save ticket' }}</button>
          </form>

          @if (editingId) {
            <div class="message">
              <label class="field">
                <span>Status</span>
                <select class="select" name="statusDraft" [(ngModel)]="statusModel.status">
                  @for (status of repairStatusOptions; track status.value) {
                    <option [ngValue]="status.value">{{ status.label }}</option>
                  }
                </select>
              </label>
              <label class="field">
                <span>Status notes</span>
                <input class="input" name="statusNotes" [(ngModel)]="statusModel.technicianNotes">
              </label>
              <button class="btn" type="button" (click)="updateStatus()">Update status</button>
            </div>
          }
        </div>
      </aside>
    </div>
  `
})
export class RepairsComponent implements OnInit {
  tickets: RepairTicketDto[] = [];
  query = { search: '', pageNumber: 1, pageSize: 20 };
  form: RepairForm = emptyForm();
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

  startCreate(): void {
    this.editingId = '';
    this.form = emptyForm();
    this.statusModel = { status: 1, technicianNotes: '', finalAmount: null };
  }

  loadTicket(id: string): void {
    this.error = '';
    this.api.get<RepairTicketDto>(`/api/repairs/${id}`).subscribe({
      next: (ticket) => {
        this.editingId = ticket.id;
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
        this.success = `Repair ticket ${ticket.ticketNumber} saved.`;
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
    if (!confirm(`Delete ${ticket.ticketNumber}?`)) {
      return;
    }

    this.api.delete(`/api/repairs/${ticket.id}`).subscribe({
      next: () => {
        this.success = 'Repair ticket deleted.';
        this.loadTickets();
        if (this.editingId === ticket.id) {
          this.startCreate();
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
