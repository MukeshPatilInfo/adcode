# KLA Admin Console - Client Source Package

This folder is a self-contained, buildable source package for the KLA PDM to ENOVIA Admin Console. It includes application code, mock fixtures, image assets, production environment settings, Docker configuration, and Nginx configuration.

It intentionally excludes `node_modules` and generated `dist` output. Install dependencies and build it on an approved build workstation.

## Contents

| Path | Purpose |
| --- | --- |
| `src\` | React application source code |
| `public\mock\` | Local mock API fixtures for UI testing |
| `LogoImages\` | Login-page image assets |
| `.env.example` | Mock-mode development settings |
| `.env.production` | Production build settings |
| `conf\windows-nginx\pdmadminconsole.conf` | Windows Nginx virtual-host configuration |
| `Dockerfile`, `nginx.conf` | Optional container deployment configuration |

## Build a production package

1. Install Node.js 20 LTS or later on the build workstation.
2. Open PowerShell in this folder and install the locked dependencies:

   ```powershell
   npm ci
   ```

3. Review `.env.production`. For the supplied Windows Nginx configuration, retain:

   ```properties
   VITE_USE_MOCK_API=false
   VITE_API_HOST=/api
   ```

4. Build the static files:

   ```powershell
   npm run build
   ```

5. Deploy the generated `dist\` folder to `C:\nginx\html\pdm-admin-console` on the client server.

## Windows Nginx deployment

1. Copy `conf\windows-nginx\pdmadminconsole.conf` to `C:\nginx\conf\pdmadminconsole.conf`.
2. Update its certificate paths and `proxy_pass` backend address.
3. Add this inside the `http { ... }` block of `C:\nginx\conf\nginx.conf`:

   ```nginx
   include conf/pdmadminconsole.conf;
   ```

4. Validate and start Nginx:

   ```powershell
   C:\nginx\nginx.exe -t
   C:\nginx\nginx.exe
   ```

The configuration serves `https://pdmadminconsoled.kla.com/`, redirects HTTP to HTTPS, and forwards browser `/api/*` requests to the configured backend without requiring browser CORS settings.

## Local mock testing

Copy `.env.example` to `.env`, then run:

```powershell
npm run dev
```

Mock mode accepts any non-empty username and password.
