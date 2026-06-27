import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  const isApiRequest = request.url.startsWith(apiBaseUrl);
  const isAuthRequest = request.url.includes('/api/auth/login') ||
    request.url.includes('/api/auth/register') ||
    request.url.includes('/api/auth/refresh-token');
  const token = auth.session()?.accessToken;
  const authorizedRequest = isApiRequest && token && !isAuthRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      const status = typeof error === 'object' && error && 'status' in error ? (error as { status?: number }).status : undefined;
      if (status === 401 && isApiRequest && token && !isAuthRequest) {
        return auth.refreshSession().pipe(
          switchMap((session) => {
            if (!session) {
              return throwError(() => error);
            }

            return next(request.clone({ setHeaders: { Authorization: `Bearer ${session.accessToken}` } }));
          })
        );
      }

      return throwError(() => error);
    })
  );
};
