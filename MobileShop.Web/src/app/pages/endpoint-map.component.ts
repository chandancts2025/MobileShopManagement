import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EndpointMapping, endpointMappings } from '../core/endpoint-registry';

@Component({
  selector: 'app-endpoint-map',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Endpoint map</h2>
        <p>Source-of-truth UI ownership for the WebAPI surface implemented in this Angular client.</p>
      </div>
      <span class="badge">{{ filtered().length }} endpoints</span>
    </div>

    <section class="panel">
      <div class="panel-header toolbar">
        <input class="input" style="width: min(420px, 100%);" name="filter" [(ngModel)]="filter" placeholder="Filter by path, component, role, or feature">
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Roles</th>
              <th>Route</th>
              <th>Component</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            @for (item of filtered(); track item.method + item.path) {
              <tr>
                <td><span class="badge">{{ item.method }}</span></td>
                <td>{{ item.path }}</td>
                <td>{{ item.roles.join(', ') }}</td>
                <td>{{ item.route }}</td>
                <td>{{ item.component }}</td>
                <td>{{ item.notes }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class EndpointMapComponent {
  readonly mappings = endpointMappings;
  filter = '';

  filtered(): EndpointMapping[] {
    const value = this.filter.trim().toLowerCase();
    if (!value) {
      return this.mappings;
    }

    return this.mappings.filter((item) =>
      item.method.toLowerCase().includes(value) ||
      item.path.toLowerCase().includes(value) ||
      item.roles.join(' ').toLowerCase().includes(value) ||
      item.route.toLowerCase().includes(value) ||
      item.component.toLowerCase().includes(value) ||
      item.feature.toLowerCase().includes(value) ||
      item.notes.toLowerCase().includes(value)
    );
  }
}
