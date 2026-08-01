# KLA PDM to ENOVIA Admin Console

React single-page administration console implementing the supplied User Story 5 workflows:

- Configurable non-SSO/SSO-ready login, JWT propagation, inactivity logout, and logout.
- Create Part, Dashroll, Upload to Enovia, Backflow, Search, and all Master Data audit views.
- Server-side date/status/PDM-vault filters, browser filtering, PST/PDT timestamps, JSON dialogs, transaction drill-down tables, and full-screen table expansion.
- Part Type hierarchy and bulk CAD/Non-CAD updates, EDOC Project CSV import, and User create/update/delete.

## Local development

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

The default `.env` configuration (`VITE_USE_MOCK_API=true`) serves the supplied JSON fixtures from `public/mock`; no backend is required. Mock sign-in accepts any non-empty username and password.

To use the backend, set:

```properties
VITE_USE_MOCK_API=false
VITE_API_HOST=https://your-admin-console-host
VITE_SSO_ENABLED=true
VITE_SSO_LOGIN_URL=https://your-identity-provider
```

`VITE_CAD_PRIMARY_VALUES`, `VITE_DEFAULT_LOAD_DAYS`, and `VITE_SESSION_TIMEOUT_MINUTES` are also environment-configurable. Build-time `VITE_*` values must be supplied before creating the production image.

## Production deployment with Nginx

```powershell
npm run build
docker build -t kla-admin-console .
docker run --rm -p 8080:80 kla-admin-console
```

The included `nginx.conf` provides SPA route fallback and an `/api/` reverse-proxy location. Set the Nginx `backend` upstream to the production API service if that proxy path is used.
