# Repository Guidelines

## Project Overview

This is a CodeIgniter 4 frontend for browsing Alfresco documents. CI4 serves the web pages only; browser JavaScript calls `UserAlfresco-api` directly.

Current public pages:

- `GET /login`
- `GET /documents`

Keep the current direct-browser API flow unless the user explicitly asks to move back to a CI4 proxy flow.

## Key Files

- `app/Config/Routes.php` defines the page routes.
- `app/Controllers/AuthController.php` renders the login page and injects the API base URL/version.
- `app/Controllers/DocumentController.php` renders the document browser and injects the API base URL/root path/version.
- `app/Views/auth/login.php` contains the login shell and inline `window.AlfrescoDirect` config.
- `app/Views/documents/index.php` contains the document browser shell and inline `window.AlfrescoDirect` config.
- `public/assets/js/direct-auth.js` posts credentials to `/auth/login` and stores the returned token in browser storage.
- `public/assets/js/direct-documents.js` loads folders/documents and opens file content via the direct API.
- `public/assets/css/app.css` contains the app styling.

## Local Setup

Run the app with:

```bash
php spark serve --port 8086
```

Then open:

```text
http://localhost:8086/login
```

The API base URL is configured in `.env` with `userAlfrescoApi.baseUrl`.

## Validation Commands

Use focused syntax checks after PHP edits:

```bash
php -l app/Config/App.php
php -l app/Config/Filters.php
php -l app/Config/ContentSecurityPolicy.php
php -l app/Controllers/AuthController.php
php -l app/Controllers/DocumentController.php
php -l app/Views/auth/login.php
php -l app/Views/documents/index.php
```

Run the test suite when behavior changes beyond a small view/config edit:

```bash
composer test
```

## Security Notes

- Access tokens are currently stored in `localStorage` by design for the direct API flow. Treat this as a known risk and do not claim the app is production-secure because of it.
- Keep API response values escaped before inserting them into HTML. `direct-documents.js` currently uses `escapeHtml()` before template insertion.
- CSP is enabled in `app/Config/App.php`; inline scripts in views should include `{csp-script-nonce}`.
- `secureheaders` is enabled in `app/Config/Filters.php`; avoid disabling it casually.
- If adding external assets or API endpoints, update `app/Config/ContentSecurityPolicy.php` with the narrowest allowed source.
- In production, Apache should point the document root at `public/`, not the repository root.
- Do not expose `.env`, `writable/`, `vendor/`, or other project internals through the web server.

## Coding Conventions

- Follow the existing lightweight CI4 structure. This app is intentionally page-serving frontend code, not a full backend.
- Prefer small, scoped edits. Avoid unrelated refactors.
- Use `esc()` in PHP views for server-rendered values.
- Use `json_encode()` for PHP values injected into JavaScript config.
- Use `textContent` or explicit escaping for browser-rendered user/API data.
- Keep user-facing Thai copy consistent with the current UI.

## Git And Workspace

- The working tree may already contain user changes. Do not revert changes you did not make.
- Do not commit unless the user explicitly asks.
- Before summarizing work, check:

```bash
git status --short
git diff -- <changed-files>
```

