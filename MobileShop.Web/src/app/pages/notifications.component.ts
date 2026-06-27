import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { NotificationDto, NotificationSummaryDto } from '../core/api.models';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Notifications</h2>
        <p>Stay updated with your orders and account activity</p>
      </div>
      <div class="toolbar-right">
        <span class="badge">{{ summary?.totalUnread ?? 0 }} Unread</span>
        @if (hasUnread()) {
          <button class="btn ghost" (click)="markAllAsRead()">Mark all as read</button>
        }
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    <div class="panel" [class.loading]="loading">
      <div class="panel-body">
        @if (notifications.length === 0) {
          <div class="empty-state">No notifications yet. We'll notify you about orders and important updates.</div>
        } @else {
          <div style="max-height: 600px; overflow-y: auto;">
            @for (notification of notifications; track notification.id) {
              <div [class]="'notification-item ' + (notification.isRead ? 'read' : 'unread')"
                [style.padding]="'12px'"
                [style.border-bottom]="'1px solid var(--line)'"
                [style.cursor]="'pointer'">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <strong>{{ notification.title }}</strong>
                    <p style="margin: 4px 0; color: var(--muted); font-size: 0.9rem;">
                      {{ notification.message }}
                    </p>
                    <small style="color: var(--muted);">{{ formatDate(notification.createdAtUtc) }}</small>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    @if (!notification.isRead) {
                      <button class="btn ghost" (click)="markAsRead(notification.id)" style="padding: 4px 8px;">
                        Mark read
                      </button>
                    }
                    <button class="btn danger" (click)="delete(notification.id)" style="padding: 4px 8px;">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .notification-item.unread {
      background-color: var(--info-soft);
    }
    .notification-item.read {
      background-color: transparent;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationDto[] = [];
  summary: NotificationSummaryDto | null = null;
  loading = false;
  error = '';

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = '';

    this.api.get<NotificationDto[]>('/api/notifications').subscribe({
      next: (notifications) => this.notifications = notifications,
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });

    this.api.get<NotificationSummaryDto>('/api/notifications/summary').subscribe({
      next: (summary) => this.summary = summary,
      error: () => {}
    });
  }

  markAsRead(id: string): void {
    this.api.post(`/api/notifications/${id}/mark-read`, {}).subscribe({
      next: () => this.loadNotifications(),
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  markAllAsRead(): void {
    this.api.post('/api/notifications/mark-all-read', {}).subscribe({
      next: () => this.loadNotifications(),
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  delete(id: string): void {
    this.api.delete(`/api/notifications/${id}`).subscribe({
      next: () => this.loadNotifications(),
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  hasUnread(): boolean {
    return this.notifications.some((notification) => !notification.isRead);
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
