import { Component, OnInit } from '@angular/core';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { WeatherForecastDto } from '../core/api.models';

@Component({
  selector: 'app-diagnostics',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <h2>Diagnostics</h2>
        <p>Consumes the scaffold WeatherForecast endpoint so every exposed API route is accounted for.</p>
      </div>
      <button class="btn" type="button" (click)="load()">Refresh</button>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    <section class="panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Temp C</th>
              <th>Temp F</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            @for (item of forecasts; track item.date) {
              <tr>
                <td>{{ item.date }}</td>
                <td>{{ item.temperatureC }}</td>
                <td>{{ item.temperatureF }}</td>
                <td>{{ item.summary }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4"><div class="empty-state">No diagnostic rows returned.</div></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class DiagnosticsComponent implements OnInit {
  forecasts: WeatherForecastDto[] = [];
  error = '';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error = '';
    this.api.get<WeatherForecastDto[]>('/WeatherForecast').subscribe({
      next: (items) => this.forecasts = items,
      error: (error) => this.error = apiErrorMessage(error)
    });
  }
}
