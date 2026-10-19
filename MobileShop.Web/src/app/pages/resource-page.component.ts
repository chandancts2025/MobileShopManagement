import { Component, DestroyRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { SelectOption } from '../core/api.models';
import {
  coerceResourcePayload,
  FormMode,
  ResourceConfig,
  ResourceField,
  ResourceRecord,
  resourceConfigs
} from '../core/resource-config';

@Component({
  selector: 'app-resource-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (config; as cfg) {
      <div class="page-header">
        <div>
          <h2>
            {{ cfg.title }}
            <span class="badge" style="margin-left: 8px; font-size: 0.78rem; font-weight: 600;">
              {{ items.length }} records
            </span>
          </h2>
          <p>{{ cfg.description }}</p>
        </div>
        @if (canCreate()) {
          <button class="btn primary" type="button" (click)="startCreate()">
            ✨ + New {{ singularTitle(cfg.title) }}
          </button>
        }
      </div>

      @if (error) {
        <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
      }
      @if (success) {
        <div class="message success" style="margin-bottom: 14px;">{{ success }}</div>
      }

      <div class="split">
        <section class="panel" [class.loading]="loading">
          <div class="panel-header">
            <div class="toolbar-left" style="flex: 1;">
              <input class="input" style="max-width: 360px;" name="search" [(ngModel)]="query.search" (keyup.enter)="load()" [placeholder]="'🔍 Search ' + cfg.title.toLowerCase() + '...'">
              <button class="btn" type="button" (click)="load()">Search</button>
              @if (query.search) {
                <button class="btn ghost" type="button" (click)="query.search = ''; load()">Clear</button>
              }
            </div>
            <div class="toolbar-right">
              <button class="btn ghost" type="button" (click)="previousPage()" [disabled]="query.pageNumber <= 1">← Prev</button>
              <span class="badge">Page {{ query.pageNumber }}</span>
              <button class="btn ghost" type="button" (click)="nextPage()" [disabled]="items.length < query.pageSize">Next →</button>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  @for (column of cfg.columns; track column.key) {
                    <th>{{ column.label }}</th>
                  }
                  <th style="text-align: right; min-width: 130px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items; track trackRecord($index, item)) {
                  <tr [class.active-row]="isRowActive(item)">
                    @for (column of cfg.columns; track column.key) {
                      <td>
                        @if (isSku(column.key)) {
                          <span class="code-pill">{{ cell(item, column.key) }}</span>
                        } @else if (isBrand(column.key)) {
                          <span class="cell-chip brand">{{ cell(item, column.key) }}</span>
                        } @else if (isCategory(column.key)) {
                          <span class="cell-chip category">{{ cell(item, column.key) }}</span>
                        } @else if (isPrice(column.key)) {
                          <span class="cell-price">{{ cell(item, column.key) }}</span>
                        } @else if (isStock(column.key)) {
                          <span class="cell-stock" [class]="stockBadgeClass(item[column.key])">
                            {{ cell(item, column.key) }}
                          </span>
                        } @else {
                          {{ cell(item, column.key) }}
                        }
                      </td>
                    }
                    <td class="actions" style="text-align: right;">
                      @if (canUpdate()) {
                        <button class="btn ghost" type="button" (click)="startEdit(item)" title="Edit this record">
                          ✏️ Edit
                        </button>
                      }
                      @if (canDelete()) {
                        <button class="btn danger" type="button" (click)="deleteItem(item)" title="Delete this record" style="margin-left: 4px;">
                          🗑️
                        </button>
                      }
                      @if (!canUpdate() && !canDelete()) {
                        <span class="muted" style="font-size: 0.8rem;">View only</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td [attr.colspan]="cfg.columns.length + 1">
                      <div class="empty-state">
                        <div style="font-size: 2.2rem; margin-bottom: 8px;">📦</div>
                        <strong>No {{ cfg.title.toLowerCase() }} found</strong>
                        <p>Try refining your search keyword or add a new record to get started.</p>
                        @if (canCreate()) {
                          <button class="btn primary" type="button" style="margin-top: 14px;" (click)="startCreate()">
                            + Add New {{ singularTitle(cfg.title) }}
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <aside class="panel">
          <div class="panel-header">
            <div>
              <strong style="font-size: 1rem; color: #0f172a;">
                {{ formMode === 'update' ? '✏️ Edit ' + singularTitle(cfg.title) : '✨ New ' + singularTitle(cfg.title) }}
              </strong>
              @if (editingId) {
                <div style="font-size: 0.76rem; color: #64748b; font-family: monospace;">ID: #{{ editingId }}</div>
              }
            </div>
            @if (formOpen) {
              <button class="btn ghost" type="button" (click)="closeForm()" style="padding: 4px 10px; font-size: 0.82rem;">✕ Close</button>
            }
          </div>
          <div class="panel-body">
            @if (cfg.readOnly) {
              <p class="muted">This endpoint is read-only in the administrative console.</p>
            } @else if (formOpen) {
              <form class="grid" #formRef="ngForm" (ngSubmit)="save(formRef.valid ?? false)">
                <div class="grid two">
                  @for (field of visibleFields(); track field.key) {
                    <label class="field" [class.check-field]="field.type === 'checkbox'" [style.grid-column]="field.type === 'textarea' ? 'span 2' : 'auto'">
                      @if (field.type !== 'checkbox') {
                        <span>
                          {{ field.label }}
                          @if (field.required) {
                            <span class="required-star">*</span>
                          }
                        </span>
                      }

                      @switch (field.type) {
                        @case ('textarea') {
                          <textarea class="textarea" [name]="field.key" [(ngModel)]="form[field.key]" [required]="field.required || false" [placeholder]="field.placeholder || ''"></textarea>
                        }
                        @case ('select') {
                          <select class="select" [name]="field.key" [(ngModel)]="form[field.key]" [required]="field.required || false">
                            <option [ngValue]="null">-- Select {{ field.label }} --</option>
                            @for (option of fieldOptions(field); track option.label + option.value) {
                              <option [ngValue]="option.value">{{ option.label }}</option>
                            }
                          </select>
                        }
                        @case ('checkbox') {
                          <input type="checkbox" [name]="field.key" [(ngModel)]="form[field.key]">
                          <span>{{ field.label }}</span>
                        }
                        @default {
                          <input class="input"
                            [type]="field.type"
                            [name]="field.key"
                            [(ngModel)]="form[field.key]"
                            [required]="field.required || false"
                            [attr.min]="field.min ?? null"
                            [attr.max]="field.max ?? null"
                            [attr.step]="field.step ?? null"
                            [placeholder]="field.placeholder || ''">
                        }
                      }

                      @if (field.hint) {
                        <small>{{ field.hint }}</small>
                      }
                    </label>
                  }
                </div>

                <div style="display: flex; gap: 10px; margin-top: 10px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
                  <button class="btn primary" type="submit" [disabled]="formRef.invalid || saving" style="flex: 1;">
                    {{ saving ? 'Saving...' : '💾 Save ' + singularTitle(cfg.title) }}
                  </button>
                  <button class="btn ghost" type="button" (click)="closeForm()">Cancel</button>
                </div>
              </form>
            } @else {
              <div style="text-align: center; padding: 24px 10px; color: #64748b;">
                <div style="font-size: 2.2rem; margin-bottom: 8px;">📝</div>
                <strong style="color: #1e293b; display: block; margin-bottom: 4px;">No Record Selected</strong>
                <p style="font-size: 0.88rem; margin: 0 0 16px;">Select an item from the table to inspect/edit its details, or click below to create a brand new entry.</p>
                @if (canCreate()) {
                  <button class="btn primary" type="button" (click)="startCreate()">
                    + Add New {{ singularTitle(cfg.title) }}
                  </button>
                }
              </div>
            }
          </div>
        </aside>
      </div>
    } @else {
      <div class="message error">{{ error || 'Unknown resource.' }}</div>
    }
  `
})
export class ResourcePageComponent implements OnInit {
  config: ResourceConfig | null = null;
  items: ResourceRecord[] = [];
  query = {
    search: '',
    pageNumber: 1,
    pageSize: 10
  };
  form: ResourceRecord = {};
  formMode: FormMode = 'create';
  formOpen = false;
  editingId = '';
  loading = false;
  saving = false;
  error = '';
  success = '';
  lookupOptions: Record<string, SelectOption[]> = {};

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly destroyRef: DestroyRef
  ) {
      this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const key = params.get('resource') ?? '';
      this.setResource(key);
    });
  }

  ngOnInit(): void {
    if (!this.config) {
      this.setResource(this.route.snapshot.paramMap.get('resource') ?? '');
    }
  }

  setResource(key: string): void {
    this.config = resourceConfigs[key] ?? null;
    this.items = [];
    this.formOpen = false;
    this.error = this.config ? '' : `The resource "${key}" is not registered in the UI.`;
    this.success = '';

    if (!this.config) {
      return;
    }

    if (!this.auth.hasAnyRole(this.config.listRoles)) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }

    this.loadLookups();
    this.load();
  }

  canCreate(): boolean {
    return Boolean(this.config && !this.config.readOnly && this.auth.hasAnyRole(this.config.createRoles));
  }

  canUpdate(): boolean {
    return Boolean(this.config && !this.config.readOnly && this.auth.hasAnyRole(this.config.updateRoles));
  }

  canDelete(): boolean {
    return Boolean(this.config && !this.config.readOnly && this.auth.hasAnyRole(this.config.deleteRoles));
  }

  load(): void {
    if (!this.config) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.api.list<ResourceRecord>(this.config.endpoint, this.query).subscribe({
      next: (result) => {
        this.items = result.items;
        this.query.pageNumber = result.pageNumber;
        this.query.pageSize = result.pageSize;
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  previousPage(): void {
    this.query.pageNumber = Math.max(1, this.query.pageNumber - 1);
    this.load();
  }

  nextPage(): void {
    this.query.pageNumber += 1;
    this.load();
  }

  startCreate(): void {
    if (!this.config) {
      return;
    }

    this.formMode = 'create';
    this.editingId = '';
    this.form = { ...(this.config.defaultForm?.() ?? {}) };
    this.formOpen = true;
    this.success = '';
  }

  startEdit(item: ResourceRecord): void {
    if (!this.config || !this.canUpdate()) {
      return;
    }

    this.formMode = 'update';
    this.editingId = String(item['id'] ?? '');
    this.form = {
      ...(this.config.defaultForm?.() ?? {}),
      ...(this.config.toForm ? this.config.toForm(item) : item)
    };
    this.formOpen = true;
    this.success = '';
  }

  closeForm(): void {
    this.formOpen = false;
    this.form = {};
    this.editingId = '';
  }

  visibleFields(): ResourceField[] {
    const cfg = this.config;
    if (!cfg) {
      return [];
    }

    return cfg.fields.filter((field) => this.formMode === 'create' ? !field.updateOnly : !field.createOnly);
  }

  fieldOptions(field: ResourceField): SelectOption[] {
    return (field.options ?? this.lookupOptions[field.key] ?? []) as SelectOption[];
  }

  save(valid: boolean): void {
    if (!valid || !this.config) {
      this.error = 'Please complete the required fields before saving.';
      return;
    }

    const payload = coerceResourcePayload(this.config, this.form, this.formMode);
    const request = this.formMode === 'create'
      ? this.api.post<ResourceRecord>(this.config.endpoint, payload)
      : this.api.put<ResourceRecord>(`${this.config.endpoint}/${this.editingId}`, payload);

    this.saving = true;
    this.error = '';
    request.subscribe({
      next: () => {
        this.success = 'Saved successfully.';
        this.closeForm();
        this.load();
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

  deleteItem(item: ResourceRecord): void {
    if (!this.config || !this.canDelete()) {
      return;
    }

    const id = String(item['id'] ?? '');
    const name = String(item['name'] ?? item['fullName'] ?? item['key'] ?? id);
    if (!id || !confirm(`Delete ${name}?`)) {
      return;
    }

    this.loading = true;
    this.api.delete(`${this.config.endpoint}/${id}`).subscribe({
      next: () => {
        this.success = 'Deleted successfully.';
        this.load();
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  cell(item: ResourceRecord, key: string): string {
    const column = this.config?.columns.find((current) => current.key === key);
    const value = item[key];
    if (column?.format) {
      return column.format(value, item);
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return value === null || value === undefined ? '' : String(value);
  }

  trackRecord(index: number, item: ResourceRecord): string {
    return String(item['id'] ?? item['productId'] ?? index);
  }

  singularTitle(title: string): string {
    return title.endsWith('s') ? title.slice(0, -1) : title;
  }

  isSku(key: string): boolean {
    return key.toLowerCase() === 'sku';
  }

  isPrice(key: string): boolean {
    const k = key.toLowerCase();
    return k.includes('price') || k.includes('amount') || k.includes('cost');
  }

  isStock(key: string): boolean {
    return key === 'quantityOnHand' || key === 'stock';
  }

  isBrand(key: string): boolean {
    return key === 'brandName';
  }

  isCategory(key: string): boolean {
    return key === 'categoryName';
  }

  stockBadgeClass(val: unknown): string {
    const num = Number(val);
    if (isNaN(num) || num <= 0) return 'out';
    if (num <= 5) return 'low';
    return 'good';
  }

  isRowActive(item: ResourceRecord): boolean {
    return Boolean(this.editingId && String(item['id'] ?? '') === this.editingId);
  }

  private loadLookups(): void {
    const cfg = this.config;
    if (!cfg) {
      return;
    }

    const fields = cfg.fields.filter((field) => field.source);
    fields.forEach((field) => {
      const source = field.source;
      if (!source) {
        return;
      }

      this.api.list<ResourceRecord>(source.endpoint, { pageNumber: 1, pageSize: 100 }).subscribe({
        next: (result) => {
          this.lookupOptions[field.key] = result.items.map((item) => ({
            label: String(item[source.labelKey] ?? ''),
            value: String(item[source.valueKey] ?? '')
          }));
        },
        error: (error) => {
          this.error = apiErrorMessage(error);
        }
      });
    });
  }
}
