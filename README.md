# Prodapt UI

React SPA admin console for the Prodapt subscription billing platform,
replacing the legacy KAUI (Ruby on Rails) admin tool.

This repository currently contains the **foundation**: routing shell,
layout, branding, auth/tenant contexts, the generic API client, and shared
"locked feature" components. Business pages (accounts, invoices,
subscriptions, payments, admin sub-sections) are built on top of this in a
follow-up task.

## Stack

- Vite + React + TypeScript
- React Router v7
- Plain CSS with a small design-token layer (`src/styles/tokens.css`)

## Getting started

```bash
npm install
npm run dev      # start dev server (defaults to http://localhost:5173)
npm run build    # type-check + production build
npm run lint      # oxlint
```

Configure the backend base URL via `VITE_API_BASE_URL` (defaults to
`http://127.0.0.1:7070`, the local Spring Boot dev backend).

## Structure

```
src/
  api/         Generic authenticated HTTP client (client.ts) + auth calls (auth.ts).
               Business endpoints (accounts, invoices, ...) belong in new files here,
               built on top of apiGet/apiPost/apiPut/apiDelete.
  components/  Shared UI: Layout (navbar + sidebar), RequireAuth (route guard),
               Locked (LockedBadge / LockedNavItem for not-yet-available features).
  context/     AuthContext (login/logout/currentUser) and TenantContext
               (current tenant api key/secret pair, persisted to localStorage).
  pages/       Login (functional) + placeholder "coming soon" pages for the
               sections built in the next task.
  styles/      tokens.css — Prodapt brand color tokens and layout constants.
  assets/      prodapt-logo.svg — official brand mark.
```

## Auth

- `POST /1.0/kb/security/login` with `{ username, password }` →
  `{ token, expiresAt }` on success, `401` on failure.
- Token persisted in `localStorage` under `prodapt_auth_token`.
- Current tenant (api key/secret pair) persisted under
  `prodapt_current_tenant`. A single hardcoded default tenant
  (`bob` / `lazar`) is wired up for now; the tenant-switcher UI is a later
  task.

## Locked features

Use `LockedBadge` / `LockedNavItem` from `src/components/Locked.tsx` for
any feature that isn't available yet in Prodapt UI, instead of a dead link
or broken page.
