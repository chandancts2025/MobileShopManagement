import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { apiErrorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <section class="auth-visual">
        <div class="brand">
          <span class="brand-mark">MS</span>
          <span>
            <h1>Mobile Shop</h1>
            <p>Management client</p>
          </span>
        </div>
        <div>
          <h1>Inventory, sales, service, and finance in one counter-ready workspace.</h1>
          <p>Use the seeded staff account or sign in with a customer account created from registration.</p>
        </div>
      </section>

      <section class="auth-panel">
        <form class="auth-card grid" #form="ngForm" (ngSubmit)="submit()">
          <div>
            <h2>Sign in</h2>
            <p class="muted">Access is trimmed by your API role.</p>
          </div>

          @if (error) {
            <div class="message error">{{ error }}</div>
          }

          <label class="field">
            <span>Email</span>
            <input class="input" type="email" name="email" [(ngModel)]="model.email" required email autocomplete="username">
          </label>

          <label class="field">
            <span>Password</span>
            <input class="input" type="password" name="password" [(ngModel)]="model.password" required autocomplete="current-password">
          </label>

          <button class="btn primary" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>

          <div class="toolbar">
            <button class="btn ghost" type="button" (click)="fill('superadmin@mobileshop.local', 'SuperAdmin@123')">Super admin</button>
            <button class="btn ghost" type="button" (click)="fill('admin@mobileshop.local', 'Admin@123')">Admin</button>
          </div>

          <p class="muted">No customer account yet? <a routerLink="/register"><strong>Create one</strong></a>.</p>
          <p><a routerLink="/catalog"><strong>Browse catalog as guest</strong></a></p>
        </form>
      </section>
    </div>
  `
})
export class LoginComponent {
  model = {
    email: 'superadmin@mobileshop.local',
    password: 'SuperAdmin@123'
  };
  loading = false;
  error = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  fill(email: string, password: string): void {
    this.model = { email, password };
  }

  submit(): void {
    this.loading = true;
    this.error = '';
    this.auth.login(this.model).subscribe({
      next: (session) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const fallback = session.roleName === 'Customer' ? '/catalog' : '/dashboard';
        void this.router.navigateByUrl(returnUrl || fallback);
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
}
