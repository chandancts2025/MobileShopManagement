import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';

import { AuthService } from './auth.service';
import { RoleName } from './api.models';

export const authGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: urlFromSegments(segments) } });
};

export function roleGuard(roles: RoleName[]): CanMatchFn {
  return (_route, _segments) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasAnyRole(roles)) {
      return true;
    }

    return router.createUrlTree([auth.hasAtLeastStaffRole() ? '/dashboard' : '/catalog']);
  };
}

function urlFromSegments(segments: UrlSegment[]): string {
  const value = `/${segments.map((segment) => segment.path).join('/')}`;
  return value === '/' ? '/dashboard' : value;
}
