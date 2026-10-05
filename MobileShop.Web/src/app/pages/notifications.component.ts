import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { NotificationDto, NotificationSummaryDto } from '../core/api.models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>🔔 Notifications</h2>
        <p>Live updates on your orders, price alerts, repair status, and promotions</p>
      </div>
      <div class="toolbar-right">
        <span class="badge" [class.warn]="(summary?.totalUnread ?? 0) > 0">
          {{ summary?.totalUnread ?? 0 }} Unread
        </span>
        @if (hasUnread()) {
          <button class="btn primary" (click)="markAllAsRead()">Mark all as read</button>
        }
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    <!-- Filter chips -->
    <div class="panel" style="margin-bottom: 16px;">
      <div class="panel-body toolbar" style="padding: 10px 16px;">
        <span class="muted" style="font-size: 0.85rem; font-weight: 600;">Filter:</span>
        <button class="btn ghost" [class.active-pill]="activeFilter === 'all'" (click)="setFilter('all')">
          All ({{ notifications.length }})
        </button>
        <button class="btn ghost" [class.active-pill]="activeFilter === 'unread'" (click)="setFilter('unread')">
          Unread ({{ (summary?.totalUnread ?? 0) }})
        </button>
      </div>
    </div>

    <div class="panel" [class.loading]="loading">
      <div class="panel-body" style="padding: 0;">
        @if (filteredNotifications.length === 0) {
          <div class="empty-state" style="padding: 48px 20px;">
            <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">🔕</span>
            <h3>No notifications to display</h3>
            <p class="muted">You're all caught up! Order status updates and price drop alerts will appear here.</p>
          </div>
        } @else {
          <div>
            @for (notification of filteredNotifications; track notification.id) {
              <div class="notification-row" [class.unread]="!notification.isRead">
                <div class="notif-icon">
                  {{ getNotificationIcon(notification.title) }}
                </div>
                <div class="notif-content">
                  <div class="notif-head">
                    <strong>{{ notification.title }}</strong>
                    <span class="notif-time">{{ formatDate(notification.createdAtUtc) }}</span>
                  </div>
                  <p class="notif-body">{{ notification.message }}</p>
                  @if (notification.actionUrl) {
                    <a [routerLink]="notification.actionUrl" class="btn ghost" style="padding: 3px 8px; font-size: 0.8rem; margin-top: 6px; display: inline-flex;">
                      View Details →
                    </a>
                  }
                </div>
                <div class="notif-actions">
                  @if (!notification.isRead) {
                    <button class="btn ghost" (click)="markAsRead(notification.id)" title="Mark as read" style="padding: 4px 8px; font-size: 0.8rem;">
                      ✓ Read
                    </button>
                  }
                  <button class="btn danger ghost" (click)="delete(notification.id)" title="Delete notification" style="padding: 4px 8px; font-size: 0.8rem;">
                    ✕
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .active-pill {
      background: var(--primary-soft) !important;
      color: var(--primary-strong) !important;
      font-weight: 700;
    }
    .notification-row {
      display: flex;
      gap: 14px;
      padding: 14px 18px;
      border-bottom: 1px solid var(--line);
      align-items: flex-start;
      transition: background 0.15s ease;
    }
    .notification-row:last-child {
      border-bottom: none;
    }
    .notification-row.unread {
      background: rgba(22, 163, 74, 0.05);
      border-left: 3px solid var(--primary);
    }
    .notif-icon {
      font-size: 1.4rem;
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: var(--surface-2);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .notif-content {
      flex: 1;
      min-width: 0;
    }
    .notif-head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: baseline;
    }
    .notif-time {
      font-size: 0.78rem;
      color: var(--muted);
      white-space: nowrap;
    }
    .notif-body {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 0.88rem;
      line-height: 1.4;
    }
    .notif-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationDto[] = [];
  summary: NotificationSummaryDto | null = null;
  loading = false;
  error = '';
  activeFilter: 'all' | 'unread' = 'all';

  get filteredNotifications(): NotificationDto[] {
    if (this.activeFilter === 'unread') {
      return this.notifications.filter((n) => !n.isRead);
    }
    return this.notifications;
  }

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = '';

    this.api.list<NotificationDto>('/api/notifications', { pageNumber: 1, pageSize: 50 }).subscribe({
      next: (result) => {
        this.notifications = result.items;
        this.loading = false;
      },
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      }
    });

    this.api.get<NotificationSummaryDto>('/api/notifications/summary').subscribe({
      next: (summary) => this.summary = summary,
      error: () => {}
    });
  }

  setFilter(filter: 'all' | 'unread'): void {
    this.activeFilter = filter;
  }

  markAsRead(id: string): void {
    this.api.post(`/api/notifications/${id}/mark-read`, {}).subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n);
        if (this.summary && this.summary.totalUnread > 0) {
          this.summary.totalUnread--;
        }
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  markAllAsRead(): void {
    this.api.post('/api/notifications/mark-all-read', {}).subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
        if (this.summary) {
          this.summary.totalUnread = 0;
        }
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  delete(id: string): void {
    this.api.delete(`/api/notifications/${id}`).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((n) => n.id !== id);
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }

  hasUnread(): boolean {
    return this.notifications.some((notification) => !notification.isRead);
  }

  getNotificationIcon(title: string): string {
    const t = (title || '').toLowerCase();
    if (t.includes('order')) return '📦';
    if (t.includes('price') || t.includes('discount')) return '🏷️';
    if (t.includes('repair')) return '🔧';
    if (t.includes('stock')) return '📊';
    if (t.includes('loyalty') || t.includes('point')) return '⭐';
    return '🔔';
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
