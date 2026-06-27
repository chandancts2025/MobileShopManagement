# Mobile Shop Web

Angular 20 UI for the MobileShop WebAPI.

## Run

1. Start the API from `MobileShop.Api` on `http://localhost:5266`.
2. From `MobileShop.Web`, run:

```powershell
npm install
npm start
```

3. Open `http://127.0.0.1:4200/`.

Seeded staff logins from the API seeder:

- `superadmin@mobileshop.local` / `SuperAdmin@123`
- `admin@mobileshop.local` / `Admin@123`

## Integration Notes

- API base URL is configured in `src/environments/environment.ts`.
- JWT bearer tokens are attached by `src/app/core/auth.interceptor.ts`.
- Route and navigation access is enforced by `src/app/core/guards.ts` and role-aware sidebar filtering.
- Endpoint ownership is declared in `src/app/core/endpoint-registry.ts` and rendered in the UI at `/endpoint-map`.
- The controller code is treated as the source of truth. The older catalog mentions auth forgot/reset endpoints, but those actions are not present in `AuthController`, so they are not wired into the UI.

## Verification

```powershell
npm run build
```

