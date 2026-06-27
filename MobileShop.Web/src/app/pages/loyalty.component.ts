import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService, apiErrorMessage } from '../core/api.service';
import { LoyaltyAccountDto, LoyaltyTierProgressDto } from '../core/api.models';
import { money } from '../core/formatters';

@Component({
  selector: 'app-loyalty',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Loyalty Rewards</h2>
        <p>Earn and redeem points with every purchase</p>
      </div>
    </div>

    @if (error) {
      <div class="message error" style="margin-bottom: 14px;">{{ error }}</div>
    }

    @if (account && progress) {
      <div class="grid two" style="margin-bottom: 16px;">
        <!-- Tier Display -->
        <div class="panel">
          <div class="panel-header">
            <strong>Your Tier</strong>
          </div>
          <div class="panel-body">
            <div style="text-align: center; padding: 20px 0;">
              <div style="font-size: 2rem; font-weight: bold; color: var(--primary);">
                {{ account.tier }}
              </div>
              <p class="muted" style="margin-top: 8px;">
                Multiplier: {{ account.tierMultiplier }}x
              </p>
            </div>
          </div>
        </div>

        <!-- Points Display -->
        <div class="panel">
          <div class="panel-header">
            <strong>Your Points</strong>
          </div>
          <div class="panel-body">
            <div style="text-align: center; padding: 20px 0;">
              <div style="font-size: 2.5rem; font-weight: bold; color: var(--accent);">
                {{ account.currentPoints | number: '1.0-0' }}
              </div>
              <p class="muted" style="margin-top: 8px;">
                Earned: {{ account.totalPointsEarned | number: '1.0-0' }} | Redeemed: {{ account.totalPointsRedeemed | number: '1.0-0' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tier Progress -->
      @if (progress.nextTier) {
        <div class="panel" style="margin-bottom: 16px;">
          <div class="panel-header">
            <strong>Progress to Next Tier</strong>
          </div>
          <div class="panel-body">
            <p style="margin: 0 0 12px; font-weight: bold;">
              {{ progress.currentPoints | number: '1.0-0' }} / {{ progress.pointsForNextTier | number: '1.0-0' }} points
            </p>
            <div style="height: 24px; background: var(--line); border-radius: var(--radius); overflow: hidden;">
              <div style="height: 100%; background: var(--primary); width: {{ progress.pointsProgressPercentage }}%; transition: width 0.3s;">
              </div>
            </div>
            <p style="margin: 8px 0 0; font-size: 0.9rem; color: var(--muted);">
              {{ progress.pointsProgressPercentage | number: '1.0-0' }}% complete
            </p>
          </div>
        </div>
      }
    }

    <div class="grid" style="margin-bottom: 16px;">
      <div class="panel">
        <div class="panel-header">
          <strong>Redeem Points</strong>
        </div>
        <div class="panel-body">
          <div class="field">
            <label>Points to Redeem</label>
            <input type="number" [(ngModel)]="redeemAmount" class="input" placeholder="Enter amount" />
          </div>
          <button class="btn primary" (click)="redeemPoints()" style="width: 100%; margin-top: 12px;">
            Redeem for {{ money((redeemAmount || 0) * 0.01) }} Discount
          </button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <strong>Tier Benefits</strong>
        </div>
        <div class="panel-body">
          <p class="muted" style="font-size: 0.9rem;">
            • 1.25x-2x point multiplier based on tier<br>
            • 5%-15% discount on purchases<br>
            • Early access to promotions<br>
            • Exclusive member rewards
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoyaltyComponent implements OnInit {
  account: LoyaltyAccountDto | null = null;
  progress: LoyaltyTierProgressDto | null = null;
  redeemAmount: number | null = null;
  loading = false;
  error = '';
  readonly money = money;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.api.get<LoyaltyAccountDto>('/api/loyalty/account').subscribe({
      next: (account) => this.account = account,
      error: (error) => {
        this.error = apiErrorMessage(error);
        this.loading = false;
      },
      complete: () => this.loading = false
    });

    this.api.get<LoyaltyTierProgressDto>('/api/loyalty/tier-progress').subscribe({
      next: (progress) => this.progress = progress,
      error: () => {}
    });
  }

  redeemPoints(): void {
    if (!this.redeemAmount || this.redeemAmount <= 0) {
      this.error = 'Enter a valid amount';
      return;
    }

    this.api.post('/api/loyalty/redeem-points', { pointsToRedeem: this.redeemAmount }).subscribe({
      next: () => {
        this.redeemAmount = null;
        this.loadData();
      },
      error: (error) => this.error = apiErrorMessage(error)
    });
  }
}
