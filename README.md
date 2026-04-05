# SK MLBB Tournament Tracker

Web app for managing **Mobile Legends** tournaments for **Sangguniang Kabataan, Barangay 176-E**. Admins sign in to manage participants, teams, tournaments, matches, and related data. The public home page links to the admin login.

## Stack

- [Bun](https://bun.sh/) — runtime and package manager
- [Vite](https://vite.dev/) + [React 19](https://react.dev/)
- [TanStack Router](https://tanstack.com/router) — file-based routes under `src/routes`
- [TanStack Query](https://tanstack.com/query) & [TanStack DB](https://tanstack.com/db) — client data layer
- [PocketBase](https://pocketbase.io/) — backend (hosted URL via env)
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- UI: shadcn-style components (e.g. [Base UI](https://base-ui.com/), Lucide)

## Prerequisites

- [Bun](https://bun.sh/docs/installation) installed

## Setup

1. Clone the repo and install dependencies:

   ```bash
   bun install
   ```

2. Environment variables — copy the example file and set your PocketBase / PocketHost URL:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `VITE_POCKETHOST_URL` to your PocketBase instance (see `.env.example`).

## Scripts

| Command | Description |
|--------|-------------|
| `bun run dev` | Start the Vite dev server (default port **1023**) |
| `bun run build` | Production build |
| `bun run preview` | Preview the production build locally |
| `bun run test` | Run [Vitest](https://vitest.dev/) tests |

## Project layout

- `src/routes/` — routes (e.g. `/`, `/app/auth/login`, `/app/$id/…` for tournament-scoped admin pages)
- `src/components/` — shared UI and feature components
- `src/lib/` — utilities, PocketBase client, etc.

Routing is file-based: new files under `src/routes` are picked up by the TanStack Router Vite plugin. See the [TanStack Router docs](https://tanstack.com/router/latest/docs/framework/react/overview) for loaders, `Link`, and layouts (`src/routes/__root.tsx`).

## E2E tests (Maestro)

End-to-end flows live in `maestro/`. See [maestro/README.md](./maestro/README.md) for prerequisites, base URL (`http://localhost:1023`), and how to run flows.

## More context

High-level product and scope notes are in [PROPOSAL.md](./PROPOSAL.md).
