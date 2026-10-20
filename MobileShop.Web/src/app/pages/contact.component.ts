import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="contact-page">
      <!-- 1. Header Banner -->
      <section class="contact-hero">
        <div class="hero-badge">
          <span>CONNECT DIRECTLY WITH THE PROPRIETOR & STORE TEAM</span>
        </div>
        <h1>Get in Touch with Mobile Shop Management</h1>
        <p class="hero-lead">
          Have a question about a smartphone model, need an urgent screen replacement estimate, or want to visit our Newtown store?
          Proprietor <strong>Chandan Kr Mandal</strong> and our support technicians are always at your service.
        </p>
      </section>

      <!-- 2. Four Direct Contact Channel Cards -->
      <section class="grid four contact-channels-grid">
        <!-- Phone & WhatsApp Card -->
        <div class="channel-card emerald-border">
          <div class="channel-icon emerald">📞</div>
          <span class="channel-tag">DIRECT CALL & WHATSAPP</span>
          <h3>+91 9851632391</h3>
          <p>Talk directly with proprietor Chandan Kr Mandal for immediate assistance and repair diagnostics.</p>
          <div class="channel-actions">
            <a class="btn primary btn-sm" href="tel:+919851632391">Call Store</a>
            <a class="btn ghost btn-sm wa-btn" href="https://wa.me/919851632391" target="_blank" rel="noopener">
              WhatsApp
            </a>
          </div>
        </div>

        <!-- Store Location Card -->
        <div class="channel-card blue-border">
          <div class="channel-icon blue">📍</div>
          <span class="channel-tag">NEWTOWN STORE</span>
          <h3>Sanhita Township</h3>
          <p>
            3B8-2D, Sanhita Township, Newtown, Kolkata 700135, West Bengal, India.<br />
            <small style="color: #64748b;">Near Action Area III & Shapoorji Hub.</small>
          </p>
          <div class="channel-actions">
            <a class="btn ghost btn-sm" href="https://maps.google.com/?q=Newtown+Kolkata" target="_blank" rel="noopener">
              Open in Maps ↗
            </a>
          </div>
        </div>

        <!-- Email Inquiries Card -->
        <div class="channel-card purple-border">
          <div class="channel-icon purple">✉️</div>
          <span class="channel-tag">EMAIL HELPLINE</span>
          <h3 style="font-size: 0.95rem; word-break: break-all;">chandankr.mandal87&#64;gmail.com</h3>
          <p>Send device inquiries, bulk corporate purchase requests, or invoice copy requests anytime.</p>
          <div class="channel-actions">
            <a class="btn ghost btn-sm" href="mailto:chandankr.mandal87@gmail.com">Send Email</a>
          </div>
        </div>

        <!-- Working Hours & GSTIN Card -->
        <div class="channel-card amber-border">
          <div class="channel-icon amber">⏰</div>
          <span class="channel-tag">STORE TIMINGS & GST</span>
          <h3>Mon – Sat: 9:30 AM – 9:30 PM</h3>
          <p>
            Sunday: 10:00 AM – 08:00 PM<br />
            <strong>GSTIN:</strong> 19AABCX1234F1Z8<br />
            <strong>UPI:</strong> chandankr.mandal87&#64;okaxis
          </p>
          <div class="channel-actions">
            <span class="badge good" style="font-size: 0.72rem;">✓ Open 7 Days</span>
          </div>
        </div>
      </section>

      <!-- 3. Two-Column Layout: Interactive Form + Store Directions -->
      <section class="grid two form-map-grid">
        <!-- Interactive Contact Form -->
        <div class="contact-form-panel">
          <div class="form-header">
            <span class="eyebrow">SEND AN INQUIRY</span>
            <h2>Send a Direct Message to Our Store</h2>
            <p>Fill out the form below and we will contact you via phone or WhatsApp within 2 hours.</p>
          </div>

          @if (submitted()) {
            <div class="success-banner">
              <div class="success-icon">✓</div>
              <div>
                <strong>Message Sent Successfully!</strong>
                <p>
                  Thank you, <strong>{{ inquiryForm.fullName }}</strong>. Your inquiry regarding <em>"{{ inquiryForm.subject }}"</em> has been routed directly to Chandan Kr Mandal. We will call you back at <strong>{{ inquiryForm.phoneNumber }}</strong> shortly.
                </p>
                <button class="btn ghost btn-sm" type="button" (click)="resetForm()" style="margin-top: 10px;">
                  Send Another Message
                </button>
              </div>
            </div>
          } @else {
            <form (ngSubmit)="submitInquiry()" #f="ngForm" class="inquiry-form">
              <div class="grid two">
                <label class="field">
                  <span>Your Full Name <span class="required-star">*</span></span>
                  <input
                    class="input"
                    type="text"
                    name="fullName"
                    [(ngModel)]="inquiryForm.fullName"
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </label>

                <label class="field">
                  <span>Phone / WhatsApp Number <span class="required-star">*</span></span>
                  <input
                    class="input"
                    type="tel"
                    name="phoneNumber"
                    [(ngModel)]="inquiryForm.phoneNumber"
                    placeholder="e.g. 9851632391"
                    required
                  />
                </label>
              </div>

              <div class="grid two" style="margin-top: 12px;">
                <label class="field">
                  <span>Email Address</span>
                  <input
                    class="input"
                    type="email"
                    name="email"
                    [(ngModel)]="inquiryForm.email"
                    placeholder="e.g. rahul@example.com"
                  />
                </label>

                <label class="field">
                  <span>Inquiry Subject <span class="required-star">*</span></span>
                  <select class="select" name="subject" [(ngModel)]="inquiryForm.subject" required>
                    <option value="New Smartphone Purchase">📱 New Smartphone Purchase / Price Quote</option>
                    <option value="Screen or Battery Repair">🛠️ Screen, Battery or Motherboard Repair</option>
                    <option value="Device Exchange & Buyback">🔄 Old Smartphone Exchange / Valuation</option>
                    <option value="Original Accessories">🎧 Genuine Chargers & Accessories</option>
                    <option value="Corporate Bulk Purchase">🏢 Corporate / Bulk Handset Order</option>
                    <option value="General Question">💬 General Store Inquiry</option>
                  </select>
                </label>
              </div>

              <label class="field" style="margin-top: 12px;">
                <span>Device Model & Message Details <span class="required-star">*</span></span>
                <textarea
                  class="textarea"
                  rows="4"
                  name="message"
                  [(ngModel)]="inquiryForm.message"
                  placeholder="Tell us what device you're interested in, or describe any hardware/software issue you need repaired..."
                  required
                ></textarea>
              </label>

              <div class="form-footer-action">
                <button
                  class="btn primary btn-lg"
                  type="submit"
                  [disabled]="!inquiryForm.fullName || !inquiryForm.phoneNumber || !inquiryForm.message"
                >
                  ✉️ Send Message to Chandan Kr Mandal
                </button>
              </div>
            </form>
          }
        </div>

        <!-- Store Map & Direction Details -->
        <div class="directions-panel">
          <div class="directions-header">
            <span class="eyebrow">VISIT IN PERSON</span>
            <h2>How to Reach Our Store</h2>
            <p>We are situated in Sanhita Township, Newtown, conveniently located for residents across East Kolkata.</p>
          </div>

          <!-- Stylized Map Card -->
          <div class="styled-map-card">
            <div class="map-visual-header">
              <span class="map-pin">📍</span>
              <div>
                <strong>Mobile Shop Management</strong>
                <p>3B8-2D, Sanhita Township, Newtown, Kolkata 700135</p>
              </div>
            </div>
            <div class="map-art">
              <div class="landmark-node hub">
                <span>🏢</span>
                <label>Sanhita Township</label>
              </div>
              <div class="landmark-node east">
                <span>🏙️</span>
                <label>Shapoorji Hub (1.2 km)</label>
              </div>
              <div class="landmark-node north">
                <span>🛣️</span>
                <label>Major Arterial Road</label>
              </div>
              <div class="landmark-node west">
                <span>🏢</span>
                <label>Sector V (15 mins)</label>
              </div>
            </div>
          </div>

          <!-- Travel Distance Guides -->
          <div class="distance-guide-list">
            <div class="guide-item">
              <span class="mode-icon">🚗</span>
              <div>
                <strong>By Car / Two-Wheeler:</strong>
                <p>Drive along Major Arterial Road toward Newtown Action Area III. Dedicated parking available right in front of the shop.</p>
              </div>
            </div>
            <div class="guide-item">
              <span class="mode-icon">🚌</span>
              <div>
                <strong>By Public Bus:</strong>
                <p>Take any bus heading to Shapoorji Bus Terminus or Sukhobrishti Complex (Bus routes: 215A, KB16, AC12, ST6).</p>
              </div>
            </div>
            <div class="guide-item">
              <span class="mode-icon">🚇</span>
              <div>
                <strong>By Metro / Cab:</strong>
                <p>15-minute cab ride from Sector V Metro Station or 25-minute direct ride from Netaji Subhash Chandra Bose Airport.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. Frequently Asked Questions (FAQ) -->
      <section class="faq-section">
        <div class="text-center" style="margin-bottom: 24px;">
          <span class="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Everything You Need to Know</h2>
          <p class="section-sub">Quick answers to common questions about buying, repairing, and billing.</p>
        </div>

        <div class="grid two faq-grid">
          <div class="faq-card">
            <h4>Can I get my smartphone repaired on the same day?</h4>
            <p>
              Yes! Over 85% of repairs—including screen replacements, battery renewals, speaker repairs, and charging port replacements—are completed within 30 to 60 minutes in our in-house Newtown lab.
            </p>
          </div>

          <div class="faq-card">
            <h4>Are all devices covered by official manufacturer warranty?</h4>
            <p>
              Absolutely. We only stock 100% brand-sealed Indian retail units. You receive a proper GST tax invoice, ensuring full brand warranty claims at any authorized service center across India.
            </p>
          </div>

          <div class="faq-card">
            <h4>How can I track the live status of my repair ticket?</h4>
            <p>
              Whenever you drop off a device, you receive a standard receipt with a unique Ticket ID. Simply visit our <a routerLink="/repair-tracking" style="color: #0d7a5f; font-weight: 700;">Repair Tracking Portal</a> and enter your ticket number to see real-time technician diagnostic updates.
            </p>
          </div>

          <div class="faq-card">
            <h4>What payment methods do you accept at the counter?</h4>
            <p>
              We accept Cash, UPI (GPay, PhonePe, Paytm to <code>chandankr.mandal87&#64;okaxis</code>), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and select No-Cost EMI options on major credit cards.
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .contact-page {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* 1. Header */
    .contact-hero {
      background: linear-gradient(135deg, #074a39 0%, #0d7a5f 50%, #0284c7 100%);
      border-radius: var(--radius-lg);
      padding: 42px 36px;
      color: #ffffff;
      text-align: center;
      box-shadow: 0 16px 40px rgba(7, 74, 57, 0.2);
    }

    .hero-badge {
      display: inline-block;
      font-size: 0.74rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      background: rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(8px);
      padding: 4px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      margin-bottom: 12px;
    }

    .contact-hero h1 {
      font-size: 2.25rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 12px;
    }

    .hero-lead {
      font-size: 1.05rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.92);
      max-width: 680px;
      margin: 0 auto;
    }

    /* 2. Channel Cards */
    .contact-channels-grid {
      gap: 18px;
    }

    .channel-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius);
      padding: 24px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      transition: all 0.2s ease;
    }

    .channel-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.07);
    }

    .channel-card.emerald-border:hover { border-color: #0d7a5f; }
    .channel-card.blue-border:hover { border-color: #0284c7; }
    .channel-card.purple-border:hover { border-color: #9333ea; }
    .channel-card.amber-border:hover { border-color: #f59e0b; }

    .channel-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      font-size: 1.4rem;
      margin-bottom: 12px;
    }

    .channel-icon.emerald { background: #e3f5ef; color: #0d7a5f; }
    .channel-icon.blue { background: #e0f2fe; color: #0284c7; }
    .channel-icon.purple { background: #f3e8ff; color: #9333ea; }
    .channel-icon.amber { background: #fef3c7; color: #d97706; }

    .channel-tag {
      font-size: 0.72rem;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
      display: block;
    }

    .channel-card h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px;
    }

    .channel-card p {
      font-size: 0.86rem;
      line-height: 1.5;
      color: #475569;
      margin: 0 0 16px;
      flex: 1;
    }

    .channel-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: auto;
    }

    .wa-btn {
      background: #ecfdf5 !important;
      border-color: #a7f3d0 !important;
      color: #047857 !important;
    }
    .wa-btn:hover { background: #d1fae5 !important; }

    /* 3. Form + Map Grid */
    .form-map-grid {
      gap: 28px;
    }

    .contact-form-panel {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: var(--radius-lg);
      padding: 32px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
    }

    .form-header h2 {
      font-size: 1.55rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
    }

    .form-header p {
      font-size: 0.92rem;
      color: #64748b;
      margin: 0 0 20px;
    }

    .inquiry-form {
      display: flex;
      flex-direction: column;
    }

    .form-footer-action {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }

    .success-banner {
      background: #ecfdf5;
      border: 1.5px solid #86efac;
      border-radius: var(--radius);
      padding: 24px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .success-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #16a34a;
      color: white;
      font-weight: 900;
      display: grid;
      place-items: center;
      font-size: 1.3rem;
      flex-shrink: 0;
    }

    .success-banner strong {
      font-size: 1.1rem;
      color: #065f46;
      display: block;
      margin-bottom: 4px;
    }

    .success-banner p {
      font-size: 0.9rem;
      line-height: 1.5;
      color: #047857;
      margin: 0;
    }

    /* Directions Panel */
    .directions-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      padding: 32px;
      display: flex;
      flex-direction: column;
    }

    .directions-header h2 {
      font-size: 1.55rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
    }

    .directions-header p {
      font-size: 0.92rem;
      color: #64748b;
      margin: 0 0 20px;
    }

    /* Stylized Map Card */
    .styled-map-card {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: var(--radius);
      padding: 20px;
      margin-bottom: 24px;
    }

    .map-visual-header {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid #e2e8f0;
    }

    .map-pin {
      font-size: 1.8rem;
    }

    .map-visual-header strong {
      font-size: 1.05rem;
      color: #0f172a;
      display: block;
    }

    .map-visual-header p {
      font-size: 0.82rem;
      color: #64748b;
      margin: 2px 0 0;
    }

    .map-art {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .landmark-node {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .landmark-node.hub {
      background: #e3f5ef;
      border-color: #a4dfcb;
    }

    .landmark-node span {
      font-size: 1.3rem;
    }

    .landmark-node label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #0f172a;
    }

    .distance-guide-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .guide-item {
      display: flex;
      gap: 14px;
      align-items: flex-start;
    }

    .mode-icon {
      font-size: 1.3rem;
      flex-shrink: 0;
    }

    .guide-item strong {
      font-size: 0.88rem;
      color: #0f172a;
      display: block;
    }

    .guide-item p {
      font-size: 0.84rem;
      color: #64748b;
      line-height: 1.45;
      margin: 2px 0 0;
    }

    /* 4. FAQ */
    .faq-grid {
      gap: 18px;
    }

    .faq-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius);
      padding: 22px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .faq-card h4 {
      font-size: 1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px;
    }

    .faq-card p {
      font-size: 0.88rem;
      line-height: 1.55;
      color: #475569;
      margin: 0;
    }

    .eyebrow {
      display: inline-block;
      font-size: 0.74rem;
      font-weight: 800;
      color: #0d7a5f;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }

    .section-sub {
      font-size: 0.92rem;
      color: #64748b;
      margin: 0;
    }

    .text-center { text-align: center; }

    @media (max-width: 960px) {
      .form-map-grid {
        grid-template-columns: 1fr;
      }
      .contact-channels-grid {
        grid-template-columns: 1fr;
      }
      .faq-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ContactComponent {
  readonly submitted = signal(false);

  inquiryForm = {
    fullName: '',
    phoneNumber: '',
    email: '',
    subject: 'New Smartphone Purchase',
    message: ''
  };

  submitInquiry(): void {
    if (!this.inquiryForm.fullName || !this.inquiryForm.phoneNumber || !this.inquiryForm.message) {
      return;
    }
    this.submitted.set(true);
  }

  resetForm(): void {
    this.inquiryForm = {
      fullName: '',
      phoneNumber: '',
      email: '',
      subject: 'New Smartphone Purchase',
      message: ''
    };
    this.submitted.set(false);
  }
}
