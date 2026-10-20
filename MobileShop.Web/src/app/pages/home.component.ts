import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ApiService } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { AuthService } from '../core/auth.service';
import { ProductDto } from '../core/api.models';
import { money } from '../core/formatters';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-page">
      <!-- 1. Hero Showcase Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            <span>NEWTOWN KOLKATA • PREMIER SMARTPHONE & SERVICE HUB</span>
          </div>
          <h1 class="hero-title">
            Everything Mobile. <br />
            <span class="gradient-text">Genuine Handsets, Express Repairs</span> & Certified Spares.
          </h1>
          <p class="hero-description">
            Welcome to Kolkata's trusted destination for Apple, Samsung, OnePlus, Google, Xiaomi & Vivo devices.
            Experience 100% genuine brand-sealed stock with GST invoices, zero-cost EMI, and expert same-day repairs.
          </p>

          <div class="hero-actions">
            <a class="btn primary btn-lg" routerLink="/catalog">
              <span>📱</span> Browse Smartphone Catalog
            </a>
            <a class="btn ghost btn-lg hero-ghost" routerLink="/repair-tracking">
              <span>🔧</span> Track / Book Repair
            </a>
            <a class="btn ghost btn-lg hero-ghost" routerLink="/contact">
              <span>📞</span> Contact Store & Owner
            </a>
          </div>

          <!-- Quick Trust Badges -->
          <div class="hero-perks">
            <div class="perk-item">
              <span class="perk-icon">✓</span>
              <span>100% Brand-Sealed Devices</span>
            </div>
            <div class="perk-item">
              <span class="perk-icon">✓</span>
              <span>Official GST Invoices & EMI</span>
            </div>
            <div class="perk-item">
              <span class="perk-icon">✓</span>
              <span>30-Min Express Repair Service</span>
            </div>
            <div class="perk-item">
              <span class="perk-icon">✓</span>
              <span>4.9★ Newtown Customer Trust</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="device-card-floating">
            <div class="device-glow"></div>
            <div class="floating-header">
              <span class="badge good">IN STOCK TODAY</span>
              <span class="floating-rate">⭐ 4.9 (480+ Reviews)</span>
            </div>
            <div class="device-showcase-icon">📱</div>
            <h3 class="floating-device-title">iPhone 15 & Galaxy S24 Series</h3>
            <p class="floating-sub">Special festive pricing with instant bank discounts & exchange bonuses.</p>
            <div class="floating-footer">
              <div>
                <span class="floating-price-label">Starting From</span>
                <div class="floating-price">₹49,999.00</div>
              </div>
              <a class="btn primary btn-sm" routerLink="/catalog">Explore All</a>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Prominent Store Owner & Proprietor Trust Card -->
      <section class="owner-spotlight-card">
        <div class="owner-badge-tag">
          <span>👑 PROPRIETOR & FOUNDER SPOTLIGHT</span>
        </div>
        <div class="owner-grid">
          <div class="owner-avatar-col">
            <div class="owner-avatar">
              <span>CKM</span>
            </div>
            <div class="owner-meta">
              <strong class="owner-name">Chandan Kr Mandal</strong>
              <span class="owner-role">Founder & Managing Proprietor</span>
              <span class="owner-location">📍 Newtown, Kolkata, WB</span>
            </div>
          </div>

          <div class="owner-quote-col">
            <div class="quote-symbol">“</div>
            <p class="owner-message">
              At <strong>Mobile Shop Management</strong>, we treat every customer's smartphone with the utmost care.
              Whether you are purchasing your dream smartphone or entrusting us with an urgent motherboard diagnosis,
              you get 100% transparent pricing, genuine replacement components, official GST invoices, and honest advice.
              My team and I are personally available for your every technology need.
            </p>
            <div class="owner-actions-row">
              <a class="owner-contact-pill" href="tel:+919851632391" title="Call Proprietor Directly">
                <span>📞</span>
                <strong>+91 9851632391</strong>
              </a>
              <a class="owner-contact-pill whatsapp" href="https://wa.me/919851632391" target="_blank" rel="noopener" title="Chat on WhatsApp">
                <span>💬</span>
                <strong>WhatsApp Chat</strong>
              </a>
              <a class="owner-contact-pill mail" href="mailto:chandankr.mandal87@gmail.com" title="Send Email">
                <span>✉️</span>
                <strong>chandankr.mandal87&#64;gmail.com</strong>
              </a>
              <div class="owner-contact-pill gstin">
                <span>🛡️</span>
                <span>GSTIN: <strong>19AABCX1234F1Z8</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Core Storefront Services Pillars -->
      <section class="section">
        <div class="section-header text-center">
          <span class="section-eyebrow">OUR SPECIALIZED SERVICES</span>
          <h2 class="section-title">Comprehensive Mobile Solutions Under One Roof</h2>
          <p class="section-subtitle">
            From new smartphone purchases to complex motherboard chip-level repair, we offer end-to-end device solutions.
          </p>
        </div>

        <div class="grid four service-grid">
          <div class="service-card">
            <div class="service-icon-wrap emerald">📱</div>
            <h3>Brand-New Handsets</h3>
            <p>
              Factory-sealed smartphones from Apple, Samsung, OnePlus, Xiaomi, Realme & Google Pixel.
              Comes with valid 1-year brand warranty and GST input benefit.
            </p>
            <a class="service-link" routerLink="/catalog">View Handsets →</a>
          </div>

          <div class="service-card">
            <div class="service-icon-wrap blue">🛠️</div>
            <h3>Certified Repair Center</h3>
            <p>
              Original OEM screen replacement, fast battery swap, charging port repair, speaker overhaul, and
              microsoldering motherboard diagnosis with thermal receipt tokens.
            </p>
            <a class="service-link" routerLink="/repairs">Repair Services →</a>
          </div>

          <div class="service-card">
            <div class="service-icon-wrap amber">⚡</div>
            <h3>Genuine Accessories</h3>
            <p>
              High-speed 65W/100W GaN chargers, Kevlar braided cables, MagSafe power banks, tempered glass screen
              shields, and rugged shockproof protection cases.
            </p>
            <a class="service-link" routerLink="/catalog">Browse Accessories →</a>
          </div>

          <div class="service-card">
            <div class="service-icon-wrap purple">🔄</div>
            <h3>Device Exchange & Buyback</h3>
            <p>
              Trade in your existing smartphone for instant valuation and immediate store credit against any new
              handset or repair service. Zero hassle inspection.
            </p>
            <a class="service-link" routerLink="/contact">Get Valuation →</a>
          </div>
        </div>
      </section>

      <!-- 4. Featured Product Showcase Preview -->
      @if (featuredProducts().length > 0) {
        <section class="section">
          <div class="section-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 14px;">
            <div>
              <span class="section-eyebrow">TOP PICKS</span>
              <h2 class="section-title">Featured Handsets & Accessories</h2>
              <p class="section-subtitle">Available for immediate store pickup or express delivery in Newtown Kolkata.</p>
            </div>
            <a class="btn ghost" routerLink="/catalog" style="font-weight: 700;">
              View Full Catalog ({{ totalProducts() }}) →
            </a>
          </div>

          <div class="grid four featured-grid">
            @for (prod of featuredProducts(); track prod.id) {
              <div class="product-card">
                <div class="product-top">
                  <span class="badge brand-chip">{{ prod.brandName || 'Brand' }}</span>
                  <span class="stock-status" [class.in]="prod.quantityOnHand > 0" [class.out]="prod.quantityOnHand <= 0">
                    {{ prod.quantityOnHand > 0 ? 'In Stock (' + prod.quantityOnHand + ')' : 'Sold Out' }}
                  </span>
                </div>
                <div class="product-icon-wrap">
                  <span>📱</span>
                </div>
                <h4 class="product-name">{{ prod.name }}</h4>
                <p class="product-sku">SKU: {{ prod.sku }}</p>
                <div class="product-pricing">
                  <div class="price-val">{{ money(prod.price) }}</div>
                  @if (prod.discountAmount > 0) {
                    <span class="discount-pill">-{{ money(prod.discountAmount) }} OFF</span>
                  }
                </div>
                <div class="product-actions">
                  <a class="btn primary btn-sm w-100" routerLink="/catalog">View in Catalog</a>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- 5. Why Customers Trust Us vs Others -->
      <section class="section why-us-section">
        <div class="section-header text-center">
          <span class="section-eyebrow">THE MOBILESHOP ADVANTAGE</span>
          <h2 class="section-title">Why Kolkata Chooses Chandan Kr Mandal & Team</h2>
          <p class="section-subtitle">Comparing our transparent, customer-first service with traditional alternatives</p>
        </div>

        <div class="grid two comparison-grid">
          <div class="comp-card highlight-card">
            <div class="comp-badge good">✓ With Mobile Shop Management</div>
            <ul class="comp-list">
              <li>
                <span class="check-icon">✓</span>
                <div>
                  <strong>Direct Owner Accountability:</strong>
                  <p>Proprietor Chandan Kr Mandal oversees every single critical repair and customer query personally.</p>
                </div>
              </li>
              <li>
                <span class="check-icon">✓</span>
                <div>
                  <strong>Official GST Tax Invoices:</strong>
                  <p>Every purchase comes with valid 18% GST invoices eligible for business input credits and brand warranty claims.</p>
                </div>
              </li>
              <li>
                <span class="check-icon">✓</span>
                <div>
                  <strong>30-Minute Diagnostic & Screen Replacement:</strong>
                  <p>In-house precision lab with ESD protection and modern diagnostic tools ensures rapid turnaround.</p>
                </div>
              </li>
              <li>
                <span class="check-icon">✓</span>
                <div>
                  <strong>Thermal POS Slips & Live Online Tracking:</strong>
                  <p>Track your repair progress in real time with your ticket ID and receive automated updates.</p>
                </div>
              </li>
            </ul>
          </div>

          <div class="comp-card standard-card">
            <div class="comp-badge bad">✕ Traditional / Grey Market Vendors</div>
            <ul class="comp-list">
              <li>
                <span class="cross-icon">✕</span>
                <div>
                  <strong>Unverified Origin & Fake Spares:</strong>
                  <p>Duplicate copy screens and substandard batteries that degrade fast and void warranty.</p>
                </div>
              </li>
              <li>
                <span class="cross-icon">✕</span>
                <div>
                  <strong>Hidden Charges & Vague Estimates:</strong>
                  <p>Final prices doubled upon pick-up without prior communication or authorization.</p>
                </div>
              </li>
              <li>
                <span class="cross-icon">✕</span>
                <div>
                  <strong>Weeks of Waiting:</strong>
                  <p>Devices shipped to remote repair centers with zero status visibility or data security guarantee.</p>
                </div>
              </li>
              <li>
                <span class="cross-icon">✕</span>
                <div>
                  <strong>No Official GST Receipts:</strong>
                  <p>Handwritten informal slips with no legal standing or warranty backing.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 6. Store Location & Visiting Hours Strip -->
      <section class="store-info-section">
        <div class="store-info-grid">
          <div class="info-box">
            <span class="info-icon">📍</span>
            <h4>Store Location</h4>
            <p>
              3B8-2D, Sanhita Township, Newtown, Kolkata 700135, West Bengal, India.<br />
              <small style="color: #64748b;">Near Newtown Action Area III & Shapoorji Sukhobrishti Complex.</small>
            </p>
          </div>

          <div class="info-box">
            <span class="info-icon">⏰</span>
            <h4>Operating Hours</h4>
            <p>
              <strong>Monday – Saturday:</strong> 09:30 AM – 09:30 PM<br />
              <strong>Sunday:</strong> 10:00 AM – 08:00 PM<br />
              <small style="color: #16a34a; font-weight: 600;">✓ Open All 7 Days for Urgent Repairs</small>
            </p>
          </div>

          <div class="info-box">
            <span class="info-icon">📞</span>
            <h4>Direct Helplines</h4>
            <p>
              <strong>Owner:</strong> +91 9851632391<br />
              <strong>Email:</strong> chandankr.mandal87&#64;gmail.com<br />
              <strong>UPI ID:</strong> chandankr.mandal87&#64;okaxis
            </p>
          </div>
        </div>
      </section>

      <!-- 7. Call To Action Footer Banner -->
      <section class="cta-banner">
        <div class="cta-content">
          <h2>Ready to Upgrade or Fix Your Smartphone?</h2>
          <p>
            Visit our Newtown store today or browse our online catalog for genuine handsets, accessories, and same-day repair service.
          </p>
          <div class="cta-actions">
            <a class="btn primary btn-lg" routerLink="/catalog">Shop Now</a>
            <a class="btn ghost btn-lg" routerLink="/contact" style="background: rgba(255,255,255,0.15); color: white; border-color: rgba(255,255,255,0.4);">
              Visit / Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-page {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    /* 1. Hero Section */
    .hero-section {
      background: linear-gradient(135deg, #074a39 0%, #0d7a5f 40%, #0369a1 100%);
      border-radius: var(--radius-lg);
      padding: 48px 40px;
      color: #ffffff;
      display: grid;
      grid-template-columns: 1.25fr 0.85fr;
      gap: 36px;
      align-items: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 16px 40px rgba(7, 74, 57, 0.22);
    }

    .hero-section::before {
      content: '';
      position: absolute;
      top: -120px;
      right: -80px;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, rgba(20, 184, 166, 0.25) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-content {
      position: relative;
      z-index: 2;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      border: 1px solid rgba(255, 255, 255, 0.25);
      margin-bottom: 16px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.35);
    }

    .hero-title {
      font-size: 2.35rem;
      font-weight: 800;
      line-height: 1.2;
      color: #ffffff;
      margin: 0 0 16px;
    }

    .gradient-text {
      background: linear-gradient(90deg, #a7f3d0 0%, #7dd3fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-description {
      font-size: 1.05rem;
      line-height: 1.55;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 24px;
      max-width: 620px;
    }

    .hero-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 28px;
    }

    .btn-lg {
      padding: 12px 22px;
      font-size: 0.95rem;
      font-weight: 700;
      border-radius: 10px;
    }

    .hero-ghost {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
    }

    .hero-ghost:hover {
      background: rgba(255, 255, 255, 0.22);
      border-color: #ffffff;
      color: #ffffff;
    }

    .hero-perks {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.18);
      padding-top: 18px;
    }

    .perk-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.92);
    }

    .perk-icon {
      color: #6ee7b7;
      font-weight: 800;
    }

    /* Floating Hero Card */
    .hero-visual {
      display: flex;
      justify-content: center;
      position: relative;
      z-index: 2;
    }

    .device-card-floating {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(14px);
      color: #0f172a;
      border-radius: 18px;
      padding: 24px;
      width: 100%;
      max-width: 360px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.28);
      border: 1px solid rgba(255, 255, 255, 0.5);
      position: relative;
    }

    .floating-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .floating-rate {
      font-size: 0.8rem;
      font-weight: 700;
      color: #d97706;
    }

    .device-showcase-icon {
      font-size: 3.5rem;
      text-align: center;
      margin: 10px 0;
    }

    .floating-device-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0 0 6px;
      color: #0f172a;
    }

    .floating-sub {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0 0 18px;
      line-height: 1.4;
    }

    .floating-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
    }

    .floating-price-label {
      display: block;
      font-size: 0.72rem;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
    }

    .floating-price {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0d7a5f;
    }

    /* 2. Owner Spotlight Card */
    .owner-spotlight-card {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: var(--radius-lg);
      padding: 28px 32px;
      box-shadow: 0 10px 30px rgba(13, 122, 95, 0.08);
      position: relative;
      overflow: hidden;
    }

    .owner-spotlight-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f59e0b 0%, #0d7a5f 50%, #0284c7 100%);
    }

    .owner-badge-tag {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 800;
      color: #b45309;
      background: #fef3c7;
      padding: 3px 10px;
      border-radius: 999px;
      border: 1px solid #fde68a;
      margin-bottom: 16px;
      letter-spacing: 0.04em;
    }

    .owner-grid {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 32px;
      align-items: center;
    }

    .owner-avatar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      border-right: 1px solid #e2e8f0;
      padding-right: 24px;
    }

    .owner-avatar {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0d7a5f 0%, #0284c7 100%);
      color: #ffffff;
      display: grid;
      place-items: center;
      font-size: 1.8rem;
      font-weight: 900;
      box-shadow: 0 8px 20px rgba(13, 122, 95, 0.28);
      margin-bottom: 12px;
      border: 3px solid #ffffff;
    }

    .owner-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      display: block;
    }

    .owner-role {
      font-size: 0.82rem;
      color: #0d7a5f;
      font-weight: 700;
      display: block;
      margin: 2px 0;
    }

    .owner-location {
      font-size: 0.76rem;
      color: #64748b;
      display: block;
    }

    .owner-quote-col {
      position: relative;
    }

    .quote-symbol {
      font-size: 3rem;
      line-height: 1;
      color: #cbd5e1;
      font-family: Georgia, serif;
      margin-bottom: -10px;
    }

    .owner-message {
      font-size: 0.98rem;
      line-height: 1.6;
      color: #334155;
      margin: 0 0 18px;
    }

    .owner-actions-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .owner-contact-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.84rem;
      color: #1e293b;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .owner-contact-pill:hover {
      background: #f1f5f9;
      border-color: #0d7a5f;
      color: #0d7a5f;
    }

    .owner-contact-pill.whatsapp {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #047857;
    }

    .owner-contact-pill.whatsapp:hover {
      background: #d1fae5;
    }

    .owner-contact-pill.mail {
      background: #f0f9ff;
      border-color: #bae6fd;
      color: #0369a1;
    }

    .owner-contact-pill.gstin {
      background: #fdf4ff;
      border-color: #f0abfc;
      color: #86198f;
    }

    /* Section Typography */
    .section {
      margin-top: 10px;
    }

    .section-header {
      margin-bottom: 24px;
    }

    .text-center {
      text-align: center;
    }

    .section-eyebrow {
      display: inline-block;
      font-size: 0.74rem;
      font-weight: 800;
      color: #0d7a5f;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }

    .section-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px;
    }

    .section-subtitle {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0;
      max-width: 640px;
      margin-inline: auto;
      line-height: 1.5;
    }

    /* 3. Service Cards */
    .service-grid {
      gap: 20px;
    }

    .service-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius);
      padding: 24px;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
    }

    .service-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
      border-color: #cbd5e1;
    }

    .service-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-size: 1.5rem;
      margin-bottom: 16px;
    }

    .service-icon-wrap.emerald { background: #e3f5ef; color: #0d7a5f; }
    .service-icon-wrap.blue { background: #e0f2fe; color: #0284c7; }
    .service-icon-wrap.amber { background: #fef3c7; color: #d97706; }
    .service-icon-wrap.purple { background: #f3e8ff; color: #9333ea; }

    .service-card h3 {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px;
    }

    .service-card p {
      font-size: 0.88rem;
      color: #64748b;
      line-height: 1.5;
      margin: 0 0 18px;
      flex: 1;
    }

    .service-link {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0d7a5f;
      text-decoration: none;
    }

    .service-link:hover {
      text-decoration: underline;
    }

    /* 4. Featured Product Cards */
    .featured-grid {
      gap: 18px;
    }

    .product-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius);
      padding: 18px;
      display: flex;
      flex-direction: column;
      transition: all 0.18s ease;
    }

    .product-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      border-color: #cbd5e1;
    }

    .product-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .stock-status {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
    }

    .stock-status.in {
      background: #ecfdf5;
      color: #047857;
    }

    .stock-status.out {
      background: #fee2e2;
      color: #b91c1c;
    }

    .product-icon-wrap {
      font-size: 2.8rem;
      text-align: center;
      margin: 8px 0 14px;
    }

    .product-name {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px;
      line-height: 1.35;
      min-height: 38px;
    }

    .product-sku {
      font-size: 0.75rem;
      font-family: monospace;
      color: #94a3b8;
      margin: 0 0 12px;
    }

    .product-pricing {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 14px;
      margin-top: auto;
    }

    .price-val {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0d7a5f;
    }

    .discount-pill {
      font-size: 0.7rem;
      font-weight: 700;
      background: #fee2e2;
      color: #dc2626;
      padding: 1px 6px;
      border-radius: 4px;
    }

    /* 5. Comparison Section */
    .comparison-grid {
      gap: 22px;
    }

    .comp-card {
      border-radius: var(--radius-lg);
      padding: 28px;
    }

    .comp-card.highlight-card {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
    }

    .comp-card.standard-card {
      background: #fef2f2;
      border: 1.5px solid #fca5a5;
    }

    .comp-badge {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 20px;
    }

    .comp-badge.good {
      background: #22c55e;
      color: white;
    }

    .comp-badge.bad {
      background: #ef4444;
      color: white;
    }

    .comp-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comp-list li {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .check-icon {
      color: #16a34a;
      font-weight: 900;
      font-size: 1.1rem;
    }

    .cross-icon {
      color: #dc2626;
      font-weight: 900;
      font-size: 1.1rem;
    }

    .comp-list strong {
      display: block;
      color: #0f172a;
      font-size: 0.95rem;
      margin-bottom: 2px;
    }

    .comp-list p {
      margin: 0;
      font-size: 0.86rem;
      color: #475569;
      line-height: 1.45;
    }

    /* 6. Store Info Grid */
    .store-info-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      padding: 28px 32px;
    }

    .store-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .info-box {
      border-right: 1px solid #f1f5f9;
      padding-right: 18px;
    }

    .info-box:last-child {
      border-right: none;
      padding-right: 0;
    }

    .info-icon {
      font-size: 1.8rem;
      display: inline-block;
      margin-bottom: 8px;
    }

    .info-box h4 {
      margin: 0 0 6px;
      font-size: 1.05rem;
      color: #0f172a;
    }

    .info-box p {
      margin: 0;
      font-size: 0.88rem;
      color: #475569;
      line-height: 1.5;
    }

    /* 7. CTA Banner */
    .cta-banner {
      background: linear-gradient(135deg, #0d7a5f 0%, #0369a1 100%);
      border-radius: var(--radius-lg);
      padding: 38px 32px;
      color: #ffffff;
      text-align: center;
      box-shadow: 0 12px 30px rgba(13, 122, 95, 0.2);
    }

    .cta-content {
      max-width: 640px;
      margin: 0 auto;
    }

    .cta-content h2 {
      color: #ffffff;
      font-size: 1.85rem;
      margin: 0 0 10px;
    }

    .cta-content p {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 22px;
      line-height: 1.5;
    }

    .cta-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    @media (max-width: 960px) {
      .hero-section {
        grid-template-columns: 1fr;
        padding: 32px 24px;
      }
      .owner-grid {
        grid-template-columns: 1fr;
      }
      .owner-avatar-col {
        border-right: none;
        border-bottom: 1px solid #e2e8f0;
        padding-right: 0;
        padding-bottom: 20px;
      }
      .store-info-grid {
        grid-template-columns: 1fr;
      }
      .info-box {
        border-right: none;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 16px;
      }
      .info-box:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  readonly featuredProducts = signal<ProductDto[]>([]);
  readonly totalProducts = signal<number>(0);
  readonly money = money;

  constructor(
    private readonly api: ApiService,
    readonly cart: CartService,
    readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  loadFeaturedProducts(): void {
    this.api.list<ProductDto>('/api/products', { pageNumber: 1, pageSize: 4 }).subscribe({
      next: (res) => {
        this.featuredProducts.set(res.items || []);
        this.totalProducts.set(res.totalCount || 0);
      },
      error: () => {}
    });
  }
}
