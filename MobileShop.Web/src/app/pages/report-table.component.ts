import { Component, Input } from '@angular/core';

import { SalesReportItemDto } from '../core/api.models';
import { money } from '../core/formatters';

@Component({
  selector: 'report-table',
  standalone: true,
  template: `
    <div class="panel">
      <div class="panel-header">
        <strong>{{ title }}</strong>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Orders</th>
              <th>{{ valueLabel }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows; track row.label) {
              <tr>
                <td>{{ row.label }}</td>
                <td>{{ row.ordersCount }}</td>
                <td>{{ money(row.salesAmount) }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3"><div class="empty-state">No report rows.</div></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ReportTableComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) rows: SalesReportItemDto[] = [];
  @Input() valueLabel = 'Value';
  readonly money = money;
}
