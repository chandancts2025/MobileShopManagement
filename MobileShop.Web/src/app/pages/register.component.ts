import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { apiErrorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { RegisterCustomerRequest } from '../core/api.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <section class="auth-visual">
        <div class="brand">
          <span class="brand-mark">MS</span>
          <span>
            <h1>Mobile Shop</h1>
            <p>Customer account</p>
          </span>
        </div>
        <div>
          <h1>Create a customer login for catalog checkout and return requests.</h1>
          <p>The API creates a customer profile and issues a JWT customer session after registration.</p>
        </div>
      </section>

      <section class="auth-panel">
        <form class="auth-card grid" #form="ngForm" (ngSubmit)="submit()">
          <div>
            <h2>Create account</h2>
            <p class="muted">Required fields mirror the WebAPI validators.</p>
          </div>

          @if (error) {
            <div class="message error">{{ error }}</div>
          }

          <div class="grid two">
            <label class="field">
              <span>First name</span>
              <input class="input" name="firstName" [(ngModel)]="model.firstName" required maxlength="100">
            </label>
            <label class="field">
              <span>Last name</span>
              <input class="input" name="lastName" [(ngModel)]="model.lastName" required maxlength="100">
            </label>
          </div>

          <label class="field">
            <span>Email</span>
            <input class="input" type="email" name="email" [(ngModel)]="model.email" required email>
          </label>

          <div class="grid two">
            <label class="field">
              <span>Phone</span>
              <input class="input" name="phoneNumber" [(ngModel)]="model.phoneNumber" required maxlength="20">
            </label>
            <label class="field">
              <span>Password</span>
              <input class="input" type="password" name="password" [(ngModel)]="model.password" required minlength="8">
            </label>
          </div>

          <label class="field">
            <span>Billing address</span>
            <input class="input" name="billingAddressLine1" [(ngModel)]="model.billingAddressLine1" required>
          </label>

          <label class="field">
            <span>Shipping address</span>
            <input class="input" name="shippingAddressLine1" [(ngModel)]="model.shippingAddressLine1" required>
          </label>

          <div class="grid two">
            <label class="field">
              <span>City</span>
              <input class="input" name="city" [(ngModel)]="model.city" required>
            </label>
            <label class="field">
              <span>State</span>
              <input class="input" name="state" [(ngModel)]="model.state" required>
            </label>
            <label class="field">
              <span>Country</span>
              <input class="input" name="country" [(ngModel)]="model.country" required>
            </label>
            <label class="field">
              <span>Postal code</span>
              <input class="input" name="postalCode" [(ngModel)]="model.postalCode" required>
            </label>
          </div>

          <button class="btn primary" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating...' : 'Create account' }}
          </button>
          <p class="muted">Already registered? <a routerLink="/login"><strong>Sign in</strong></a>.</p>
        </form>
      </section>
    </div>
  `
})
export class RegisterComponent {
  model: RegisterCustomerRequest = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    billingAddressLine1: '',
    shippingAddressLine1: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: ''
  };
  loading = false;
  error = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    this.loading = true;
    this.error = '';
    this.auth.register(this.model).subscribe({
      next: () => void this.router.navigateByUrl('/catalog'),
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
