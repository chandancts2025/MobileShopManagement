import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="about-page">
      <!-- 1. Header Banner -->
      <section class="about-hero">
        <div class="hero-badge">
          <span>ESTABLISHED IN NEWTOWN, KOLKATA</span>
        </div>
        <h1>About Mobile Shop Management</h1>
        <p class="hero-lead">
          Founded and led by <strong>Chandan Kr Mandal</strong>, our retail and service center was built on a simple foundation:
          unwavering authenticity, transparent pricing, and dependable smartphone care for Newtown and Kolkata residents.
        </p>
      </section>

      <!-- 2. Founder & Proprietor Profile Card -->
      <section class="founder-card">
        <div class="founder-grid">
          <div class="founder-photo-col">
            <div class="founder-avatar-badge">
              <span class="avatar-letters">CKM</span>
            </div>
            <h3 class="founder-title-name">Chandan Kr Mandal</h3>
            <span class="founder-subtitle">Founder & Managing Proprietor</span>
            <div class="founder-tags">
              <span class="tag">📱 Tech Entrepreneur</span>
              <span class="tag">🔧 Master Technician</span>
              <span class="tag">📍 Newtown, Kolkata</span>
            </div>

            <div class="founder-direct-contacts">
              <a class="f-contact-btn tel" href="tel:+919851632391">
                <span>📞</span> +91 9851632391
              </a>
              <a class="f-contact-btn wa" href="https://wa.me/919851632391" target="_blank" rel="noopener">
                <span>💬</span> WhatsApp Direct
              </a>
              <a class="f-contact-btn mail" href="mailto:chandankr.mandal87@gmail.com">
                <span>✉️</span> Email Chandan
              </a>
            </div>
          </div>

          <div class="founder-bio-col">
            <span class="eyebrow">A MESSAGE FROM THE PROPRIETOR</span>
            <h2>“Technology Should Empower, Not Frustrate”</h2>
            <p>
              I established <strong>Mobile Shop Management</strong> in Newtown Kolkata after witnessing countless smartphone users
              struggle with exorbitant service center charges, weeks of turnaround delay, or fraudulent duplicate parts in unregulated repair lanes.
            </p>
            <p>
              Our shop bridges that gap. When you step into our store in Sanhita Township, you are not treated as just a ticket number.
              Whether you need advice on picking the best 5G handset within your budget or require an emergency chip-level diagnosis on a water-damaged motherboard,
              we inspect your device right before your eyes and give you an honest, upfront quote.
            </p>
            <p>
              Every handset we sell is factory sealed with official brand warranty. Every repair is backed by genuine spare parts and a diagnostic job card.
              I invite you to experience our service firsthand.
            </p>

            <div class="founder-signoff">
              <div class="signature-text">Chandan Kr Mandal</div>
              <span class="signature-sub">Proprietor, Mobile Shop Management • Newtown, Kolkata</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Key Milestones & Stats -->
      <section class="stats-strip">
        <div class="stat-box">
          <strong class="stat-number">2018</strong>
          <span class="stat-label">Founded in Newtown</span>
          <p class="stat-desc">Serving Action Area III & Greater Kolkata</p>
        </div>
        <div class="stat-box">
          <strong class="stat-number">12,000+</strong>
          <span class="stat-label">Devices Serviced</span>
          <p class="stat-desc">Screens, batteries & chip repairs</p>
        </div>
        <div class="stat-box">
          <strong class="stat-number">5,000+</strong>
          <span class="stat-label">Handsets Sold</span>
          <p class="stat-desc">100% genuine with GST invoices</p>
        </div>
        <div class="stat-box">
          <strong class="stat-number">4.9 ★</strong>
          <span class="stat-label">Customer Rating</span>
          <p class="stat-desc">Verified Google & local reviews</p>
        </div>
      </section>

      <!-- 4. Our Core Values & Commitments -->
      <section class="values-section">
        <div class="text-center" style="margin-bottom: 24px;">
          <span class="eyebrow">OUR CORE PRINCIPLES</span>
          <h2>The Four Pillars of Our Store</h2>
          <p class="section-sub">Every decision we make is guided by these commitments to our customers.</p>
        </div>

        <div class="grid two values-grid">
          <div class="value-card">
            <div class="v-icon emerald">🛡️</div>
            <div>
              <h3>100% Authenticity Guarantee</h3>
              <p>
                We never compromise on quality. Every handset, charger, battery, and display replacement comes directly from certified brand distribution channels with official warranty backing.
              </p>
            </div>
          </div>

          <div class="value-card">
            <div class="v-icon blue">⚖️</div>
            <div>
              <h3>Transparent Upfront Pricing</h3>
              <p>
                No surprise bills or hidden diagnostic fees. You receive a clear cost estimate before any repair begins, documented with our standard repair ticket system.
              </p>
            </div>
          </div>

          <div class="value-card">
            <div class="v-icon amber">🔒</div>
            <div>
              <h3>Absolute Data Privacy</h3>
              <p>
                Your smartphone contains your personal memories, banking apps, and confidential data. We follow strict data-handling safety standards and never ask for unnecessary passcode access.
              </p>
            </div>
          </div>

          <div class="value-card">
            <div class="v-icon purple">🧾</div>
            <div>
              <h3>Official GST Compliance</h3>
              <p>
                Registered under West Bengal Commercial Taxes with GSTIN <strong>19AABCX1234F1Z8</strong>. All sales and repairs generate valid tax invoices with eligible input tax credit for businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. Advanced In-House Lab & Equipment -->
      <section class="lab-section">
        <div class="lab-card">
          <div class="lab-text">
            <span class="eyebrow">IN-HOUSE SERVICE FACILITY</span>
            <h2>Precision Diagnostic Lab in Newtown</h2>
            <p>
              Unlike conventional mobile counters that outsource their repairs to third parties, our Sanhita Township center houses a modern diagnostic workstation:
            </p>
            <ul class="lab-features">
              <li>
                <strong>Electrostatic Discharge (ESD) Safe Stations:</strong> Protects delicate smartphone logic boards from static damage during micro-soldering.
              </li>
              <li>
                <strong>Automated Vacuum Screen Laminators:</strong> Bubble-free, factory-finish touch glass and OCA screen refurbishing.
              </li>
              <li>
                <strong>Digital Battery Health Analyzers:</strong> Precision current draw testing to accurately distinguish between battery degradation and PMIC motherboard faults.
              </li>
              <li>
                <strong>Dual Print Documentation:</strong> High-speed 80mm thermal receipt tokens for quick counter claim and A4 tax invoices for diagnostic records.
              </li>
            </ul>
          </div>
          <div class="lab-badge-box">
            <div class="badge-icon">🔬</div>
            <h3>Certified Lab Standards</h3>
            <p>Same-day repairs completed right in our Newtown workshop under proprietor supervision.</p>
            <a class="btn primary" routerLink="/repairs">Explore Repair Services</a>
          </div>
        </div>
      </section>

      <!-- 6. Store Details & Visiting Info -->
      <section class="visit-card">
        <div class="visit-grid">
          <div>
            <span class="eyebrow">DROP BY OUR STORE</span>
            <h2>Visit Mobile Shop Management</h2>
            <p>
              Located centrally in Newtown Action Area III, easily reachable from Shapoorji Sukhobrishti, Rajarhat, and Salt Lake Sector V.
            </p>
            <div class="address-details">
              <div class="addr-row">
                <span class="icon">📍</span>
                <div>
                  <strong>Store Address:</strong>
                  <p>3B8-2D, Sanhita Township, Newtown, Kolkata 700135, West Bengal, India</p>
                </div>
              </div>
              <div class="addr-row">
                <span class="icon">👑</span>
                <div>
                  <strong>Proprietor:</strong>
                  <p>Chandan Kr Mandal</p>
                </div>
              </div>
              <div class="addr-row">
                <span class="icon">⏰</span>
                <div>
                  <strong>Operating Hours:</strong>
                  <p>Monday – Saturday: 09:30 AM – 09:30 PM | Sunday: 10:00 AM – 08:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          <div class="visit-actions">
            <a class="btn primary btn-lg" routerLink="/contact">Get Driving Directions & Contact</a>
            <a class="btn ghost btn-lg" routerLink="/catalog">Browse Product Catalog</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .about-page {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* 1. Header */
    .about-hero {
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

    .about-hero h1 {
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

    /* 2. Founder Profile Card */
    .founder-card {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: var(--radius-lg);
      padding: 36px;
      box-shadow: 0 10px 30px rgba(13, 122, 95, 0.08);
      position: relative;
      overflow: hidden;
    }

    .founder-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f59e0b 0%, #0d7a5f 50%, #0284c7 100%);
    }

    .founder-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 36px;
    }

    .founder-photo-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      border-right: 1px solid #e2e8f0;
      padding-right: 28px;
    }

    .founder-avatar-badge {
      width: 104px;
      height: 104px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0d7a5f 0%, #0284c7 100%);
      color: #ffffff;
      display: grid;
      place-items: center;
      box-shadow: 0 10px 24px rgba(13, 122, 95, 0.3);
      border: 4px solid #ffffff;
      margin-bottom: 14px;
    }

    .avatar-letters {
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: -0.02em;
    }

    .founder-title-name {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px;
    }

    .founder-subtitle {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0d7a5f;
      display: block;
      margin-bottom: 12px;
    }

    .founder-tags {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 20px;
      width: 100%;
    }

    .founder-tags .tag {
      font-size: 0.76rem;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .founder-direct-contacts {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .f-contact-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .f-contact-btn.tel {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .f-contact-btn.tel:hover { background: #d1fae5; }

    .f-contact-btn.wa {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .f-contact-btn.wa:hover { background: #dcfce7; }

    .f-contact-btn.mail {
      background: #f0f9ff;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }
    .f-contact-btn.mail:hover { background: #e0f2fe; }

    .founder-bio-col h2 {
      font-size: 1.55rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 16px;
    }

    .founder-bio-col p {
      font-size: 0.95rem;
      line-height: 1.65;
      color: #334155;
      margin: 0 0 14px;
    }

    .founder-signoff {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .signature-text {
      font-family: 'Brush Script MT', cursive, sans-serif;
      font-size: 1.8rem;
      color: #0d7a5f;
    }

    .signature-sub {
      display: block;
      font-size: 0.82rem;
      color: #64748b;
      margin-top: 2px;
    }

    /* 3. Stats Strip */
    .stats-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .stat-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius);
      padding: 22px 18px;
      text-align: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
    }

    .stat-number {
      display: block;
      font-size: 1.9rem;
      font-weight: 900;
      color: #0d7a5f;
      line-height: 1.1;
      margin-bottom: 4px;
    }

    .stat-label {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .stat-desc {
      margin: 0;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* 4. Values */
    .values-grid {
      gap: 20px;
    }

    .value-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius);
      padding: 24px;
      display: flex;
      gap: 18px;
      align-items: flex-start;
    }

    .v-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .v-icon.emerald { background: #e3f5ef; color: #0d7a5f; }
    .v-icon.blue { background: #e0f2fe; color: #0284c7; }
    .v-icon.amber { background: #fef3c7; color: #d97706; }
    .v-icon.purple { background: #f3e8ff; color: #9333ea; }

    .value-card h3 {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
    }

    .value-card p {
      font-size: 0.88rem;
      line-height: 1.5;
      color: #475569;
      margin: 0;
    }

    /* 5. In-House Lab */
    .lab-card {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: var(--radius-lg);
      padding: 36px;
      display: grid;
      grid-template-columns: 1.4fr 0.8fr;
      gap: 32px;
      align-items: center;
    }

    .lab-text h2 {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 12px;
    }

    .lab-text p {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #334155;
      margin: 0 0 16px;
    }

    .lab-features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .lab-features li {
      position: relative;
      padding-left: 20px;
      font-size: 0.88rem;
      line-height: 1.45;
      color: #475569;
    }

    .lab-features li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #0d7a5f;
      font-weight: 800;
    }

    .lab-features strong {
      color: #0f172a;
    }

    .lab-badge-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius);
      padding: 28px;
      text-align: center;
    }

    .badge-icon {
      font-size: 3rem;
      margin-bottom: 8px;
    }

    .lab-badge-box h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
    }

    .lab-badge-box p {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0 0 18px;
    }

    /* 6. Visit Card */
    .visit-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      padding: 32px;
    }

    .visit-grid {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 32px;
      align-items: center;
    }

    .visit-grid h2 {
      font-size: 1.55rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 10px;
    }

    .visit-grid p {
      font-size: 0.92rem;
      color: #475569;
      margin: 0 0 20px;
      line-height: 1.5;
    }

    .address-details {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .addr-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .addr-row .icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .addr-row strong {
      display: block;
      font-size: 0.82rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .addr-row p {
      margin: 2px 0 0;
      font-size: 0.9rem;
      color: #0f172a;
      font-weight: 600;
    }

    .visit-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
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
      .founder-grid,
      .lab-card,
      .visit-grid {
        grid-template-columns: 1fr;
      }
      .founder-photo-col {
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
        padding-right: 0;
        padding-bottom: 24px;
      }
      .stats-strip {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class AboutComponent {}
