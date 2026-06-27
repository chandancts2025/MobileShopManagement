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
          <h2>{{ cfg.title }}</h2>
          <p>{{ cfg.description }}</p>
        </div>
        @if (canCreate()) {
          <button class="btn primary" type="button" (click)="startCreate()">New {{ singularTitle(cfg.title) }}</button>
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
            <div class="toolbar-left">
              <input class="input" style="width: min(360px, 100%);" name="search" [(ngModel)]="query.search" (keyup.enter)="load()" placeholder="Search">
              <button class="btn" type="button" (click)="load()">Search</button>
            </div>
            <div class="toolbar-right">
              <button class="btn ghost" type="button" (click)="previousPage()" [disabled]="query.pageNumber <= 1">Previous</button>
              <span class="badge">Page {{ query.pageNumber }}</span>
              <button class="btn ghost" type="button" (click)="nextPage()" [disabled]="items.length < query.pageSize">Next</button>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  @for (column of cfg.columns; track column.key) {
                    <th>{{ column.label }}</th>
                  }
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items; track trackRecord($index, item)) {
                  <tr>
                    @for (column of cfg.columns; track column.key) {
                      <td>{{ cell(item, column.key) }}</td>
                    }
                    <td class="actions">
                      @if (canUpdate()) {
                        <button class="btn ghost" type="button" (click)="startEdit(item)">Edit</button>
                      }
                      @if (canDelete()) {
                        <button class="btn danger" type="button" (click)="deleteItem(item)">Delete</button>
                      }
                      @if (!canUpdate() && !canDelete()) {
                        <span class="muted">View only</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td [attr.colspan]="cfg.columns.length + 1">
                      <div class="empty-state">No records found.</div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <aside class="panel">
          <div class="panel-header">
            <strong>{{ formMode === 'update' ? 'Edit record' : 'Create record' }}</strong>
            @if (formOpen) {
              <button class="btn ghost" type="button" (click)="closeForm()">Close</button>
            }
          </div>
          <div class="panel-body">
            @if (cfg.readOnly) {
              <p class="muted">This endpoint is read-only in the UI.</p>
            } @else if (formOpen) {
              <form class="grid" #formRef="ngForm" (ngSubmit)="save(formRef.valid ?? false)">
                <div class="grid two">
                  @for (field of visibleFields(); track field.key) {
                    <label class="field" [class.check-field]="field.type === 'checkbox'">
                      @if (field.type !== 'checkbox') {
                        <span>{{ field.label }}</span>
                      }

                      @switch (field.type) {
                        @case ('textarea') {
                          <textarea class="textarea" [name]="field.key" [(ngModel)]="form[field.key]" [required]="field.required || false" [placeholder]="field.placeholder || ''"></textarea>
                        }
                        @case ('select') {
                          <select class="select" [name]="field.key" [(ngModel)]="form[field.key]" [required]="field.required || false">
                            <option [ngValue]="null">Select</option>
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

                <button class="btn primary" type="submit" [disabled]="formRef.invalid || saving">
                  {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </form>
            } @else {
              <p class="muted">Select a row to edit, or create a new record when your role allows it.</p>
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
