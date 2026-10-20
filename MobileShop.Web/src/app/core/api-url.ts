import { environment } from '../../environments/environment';

/**
 * Resolves the active backend API base URL with automatic sanitization for stale production URLs.
 */
export function getApiBaseUrl(): string {
  let url = environment.apiBaseUrl;

  // Allow browser runtime override (via localStorage for testing/staging)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const override = window.localStorage.getItem('apiBaseUrl');
      if (override && override.trim()) {
        url = override.trim();
      }
    } catch {
      // Ignore localStorage access restrictions
    }
  }

  // Automatically correct any legacy or placeholder URL missing the -rf07 subsegment
  if (url.includes('mobileshop-api.onrender.com') && !url.includes('mobileshop-api-rf07.onrender.com')) {
    url = url.replace('mobileshop-api.onrender.com', 'mobileshop-api-rf07.onrender.com');
  }

  return url.replace(/\/$/, '');
}
