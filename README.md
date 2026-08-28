# SK MLBB Tournament Tracker

Web app for the **Sangguniang Kabataan, Barangay 176-E** Mobile Legends tournament.

The **public site** covers landing, eligibility, registration, status lookup, tournaments, and the organizers page. The **committee app** (`/app`) is for staff and superadmins: approve registrants, form teams, generate four elimination brackets under one tournament, score matches, and advance winners.

For how to run an event (players and committee), see **[MANUAL.md](./MANUAL.md)**.

## Stack

- [Bun](https://bun.sh/) — runtime and package manager
- [Vite](https://vite.dev/) + [React 19](https://react.dev/)
- [TanStack Router](https://tanstack.com/router) — file-based routes under `src/routes`
- [TanStack Query](https://tanstack.com/query) — client data layer
- [Supabase](https://supabase.com/) — Postgres, Auth, RLS (URL + publishable key via env)
- [PocketBase](https://pocketbase.io/) — previous backend; still referenced by legacy routes
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- UI: shadcn-style components ([Base UI](https://base-ui.com/), Lucide)

## Prerequisites

- [Bun](https://bun.sh/docs/installation) installed

## Setup

1. Clone the repo and install dependencies:

   ```bash
   bun install
   ```

2. Environment variables — copy the example file and fill in values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Purpose |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Supabase project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
   | `VITE_POCKETHOST_URL` | Legacy PocketBase instance |
   | `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile on public registration (optional) |
   | `VITE_RESEND_API_KEY` / `VITE_RESEND_FROM` | Registration status-code email |
   | `VITE_WEBSITE_URL_BETA` / `VITE_WEBSITE_URL_MAIN` | Public site hosts (allowlist awareness) |

   Turnstile **secret**, Resend server keys used by hooks, and Discord webhooks belong on the **PocketHost server env**, not in `VITE_*`. See `.env.example` and [pb_hooks/README.md](./pb_hooks/README.md).

## Scripts

| Command | Description |
|--------|-------------|
| `bun run dev` | Start the Vite dev server (default port **1023**) |
| `bun run build` | Production build |
| `bun run preview` | Preview the production build locally |
| `bun run test` | Run [Vitest](https://vitest.dev/) tests |
| `bun run test:watch` | Vitest in watch mode |
| `bun run api:generate` | Refresh OpenAPI types (Orval) |
| `bun run smoke:create-team` | Smoke-test create-team registration |

## Routes

Public:

- `/` — landing
- `/register` — registration wizard
- `/verify` — 6-digit status code lookup
- `/tournaments` — public events and match view (`/tournaments/$id`)
- `/about` — organizers

Committee (auth required after login):

- `/app/auth/login` — staff / superadmin sign-in
- `/app` — dashboard
- `/app/tournaments` — tournament list
- `/app/tournaments/$tournamentId` — overview, participants, teams, matches, team standing
- `/app/admins` — committee accounts
- `/app/audit-logs` — audit log (placeholder)

Routing is file-based under `src/routes`. New files are picked up by the TanStack Router Vite plugin. See the [TanStack Router docs](https://tanstack.com/router/latest/docs/framework/react/overview).

## Project layout

- `src/routes/` — public and `/app` routes
- `src/components/` — landing, registration, admin, and shared UI
- `src/lib/` — PocketBase client, registration flow, bracket / auto-match helpers
- `pb_hooks/` — PocketBase hooks (registration guard, mail, Discord)
- `MANUAL.md` — player and committee operations manual

`src/routes/legacy/` is the abandoned UI. Do not extend it for new work.

## Docs

| File | What it is |
| --- | --- |
| [MANUAL.md](./MANUAL.md) | How to register, verify, and run the tournament |
| [CONTEXT.md](./CONTEXT.md) | Domain language (registrant vs participant, team intent, …) |
| [PROPOSAL.md](./PROPOSAL.md) | Original product proposal and scope |
| [pb_hooks/README.md](./pb_hooks/README.md) | Backend hooks and mail |
