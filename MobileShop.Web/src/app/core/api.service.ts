import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { PagedResult, QueryParameters } from './api.models';

type ParamValue = string | number | boolean | Date | null | undefined;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, params?: Record<string, ParamValue>): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.params(params) });
  }

  list<T>(path: string, query: QueryParameters = {}): Observable<PagedResult<T>> {
    const defaults: QueryParameters = { pageNumber: 1, pageSize: 10 };
    return this.get<unknown>(path, { ...defaults, ...query }).pipe(map((payload) => normalizePaged<T>(payload)));
  }

  post<T>(path: string, body: unknown, params?: Record<string, ParamValue>): Observable<T> {
    return this.http.post<T>(this.url(path), body, { params: this.params(params) });
  }

  put<T>(path: string, body: unknown, params?: Record<string, ParamValue>): Observable<T> {
    return this.http.put<T>(this.url(path), body, { params: this.params(params) });
  }

  delete(path: string): Observable<void> {
    return this.http.delete<void>(this.url(path));
  }

  private url(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private params(values?: Record<string, ParamValue>): HttpParams {
    let params = new HttpParams();
    Object.entries(values ?? {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      const formatted = value instanceof Date ? value.toISOString() : String(value);
      params = params.set(key, formatted);
    });
    return params;
  }
}

export function normalizePaged<T>(payload: unknown): PagedResult<T> {
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    const result = payload as PagedResult<T>;
    return {
      items: result.items,
      totalCount: Number(result.totalCount ?? result.items.length),
      pageNumber: Number(result.pageNumber ?? 1),
      pageSize: Number(result.pageSize ?? result.items.length)
    };
  }

  if (Array.isArray(payload)) {
    return {
      items: payload as T[],
      totalCount: payload.length,
      pageNumber: 1,
      pageSize: payload.length
    };
  }

  throw new Error('The API response did not match the expected paged result shape.');
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const problem = error.error as { detail?: string; title?: string; errors?: Record<string, string[]> } | string | null;

    if (typeof problem === 'string' && problem.trim()) {
      return problem;
    }

    if (problem && typeof problem === 'object') {
      if (problem.errors) {
        const validationMessages = Object.values(problem.errors).flat();
        if (validationMessages.length > 0) {
          return validationMessages.join(' ');
        }
      }

      if (problem.detail) {
        return problem.detail;
      }

      if (problem.title) {
        return problem.title;
      }
    }

    return `Request failed with status ${error.status}.`;
  }

  return error instanceof Error ? error.message : 'Something went wrong.';
}
