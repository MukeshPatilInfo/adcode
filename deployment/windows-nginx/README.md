# KLA Admin Console - Windows Nginx deployment

This package contains the production React static files in `html/` and the Nginx virtual-host configuration in `conf/pdmadminconsole.conf`.

## Server prerequisites

1. Windows Server 2019 or newer with DNS for `pdmadminconsoled.kla.com` resolving to the server.
2. Nginx for Windows installed in `C:\nginx` (the configuration uses this location).
3. A TLS certificate and private key for `pdmadminconsoled.kla.com`, accessible to the Nginx service account.
4. The Admin Console backend running and reachable from Nginx. The supplied configuration assumes `http://127.0.0.1:8080`.
5. Firewall access to TCP 443. TCP 80 is used only to redirect to HTTPS.
6. NSSM, or the organization's approved service wrapper, if Nginx must start automatically as a Windows service. Node.js is **not** required on the server.

## Installation

1. Stop Nginx:

   ```powershell
   C:\nginx\nginx.exe -s stop
   ```

2. Copy this package's `html` directory to `C:\nginx\html\pdm-admin-console`.
3. Copy `conf\pdmadminconsole.conf` to `C:\nginx\conf\pdmadminconsole.conf`.
4. Place the TLS certificate and private key at the paths referenced in the configuration, or update `ssl_certificate` and `ssl_certificate_key`.
5. Update the `proxy_pass` address if the backend is not on `127.0.0.1:8080`.
6. In `C:\nginx\conf\nginx.conf`, add the following inside its `http { ... }` block:

   ```nginx
   include conf/pdmadminconsole.conf;
   ```

7. Validate and start Nginx:

   ```powershell
   C:\nginx\nginx.exe -t
   C:\nginx\nginx.exe
   ```

8. Browse to `https://pdmadminconsoled.kla.com/`.

## Real API and SSO settings

The package was built with:

```properties
VITE_USE_MOCK_API=false
VITE_API_HOST=/api
VITE_SSO_ENABLED=false
```

`/api` is intentionally proxied by Nginx to the backend, so browser requests remain same-origin and avoid CORS configuration. To enable SSO, set `VITE_SSO_ENABLED=true` and the appropriate `VITE_SSO_LOGIN_URL` in the source `.env.production`, rebuild the package, and configure the SAML identity-provider callback on the backend. The exact SAML values must come from the SSO team.

## Operations

Use `C:\nginx\logs\error.log` for Nginx errors and `C:\nginx\logs\access.log` for request tracing. Backend request failures appear as HTTP 502 or 504 responses from `/api/*`.
