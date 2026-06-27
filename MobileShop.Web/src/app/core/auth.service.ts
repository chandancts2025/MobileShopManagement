import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterCustomerRequest, RoleName, roleName, roleValues } from './api.models';

const STORAGE_KEY = 'mobile-shop-session';

export interface AuthSession extends AuthResponse {
  roleName: RoleName;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  private readonly state = signal<AuthSession | null>(readSession());

  readonly session = this.state.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.state()?.accessToken));
  readonly currentRole = computed(() => this.state()?.roleName ?? null);

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthSession> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/api/auth/login`, request)
      .pipe(tap((response) => this.setSession(response)), map(buildSession));
  }

  register(request: RegisterCustomerRequest): Observable<AuthSession> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/api/auth/register`, request)
      .pipe(tap((response) => this.setSession(response)), map(buildSession));
  }

  refreshSession(): Observable<AuthSession | null> {
    const refreshToken = this.state()?.refreshToken;
    if (!refreshToken) {
      return of(null);
    }

    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/api/auth/refresh-token`, { refreshToken })
      .pipe(
        tap((response) => this.setSession(response)),
        map(buildSession),
        catchError(() => {
          this.logout();
          return of(null);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state.set(null);
  }

  hasAnyRole(roles: RoleName[] | readonly RoleName[] | undefined): boolean {
    if (!roles || roles.length === 0) {
      return true;
    }

    const current = this.state()?.roleName;
    return Boolean(current && roles.includes(current));
  }

  hasAtLeastStaffRole(): boolean {
    return this.hasAnyRole(['SuperAdmin', 'Admin', 'Operator']);
  }

  private setSession(response: AuthResponse): void {
    const session = buildSession(response);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.state.set(session);
  }
}

function buildSession(response: AuthResponse): AuthSession {
  const normalizedRole = roleName(response.role);
  return {
    ...response,
    role: roleValues[normalizedRole],
    roleName: normalizedRole
  };
}

function readSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthResponse & Partial<AuthSession>;
    return parsed.roleName ? (parsed as AuthSession) : buildSession(parsed);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
