# Maestro E2E Tests

[Maestro](https://maestro.dev/) is used for automated end-to-end testing of the web app. Web support is in beta and uses a managed Chromium browser.

## Prerequisites

- **Java 17+** - `java -version` to verify
- **Maestro Studio** - [Download](https://maestro.dev/#maestro-studio)

## Running Tests (Maestro Studio)

1. Start the dev server: `bun run dev`
2. Open Maestro Studio
3. Open this repo's `maestro/` folder
4. Run any flow from Studio (for example `home.yaml`, `login-page.yaml`, or `login-flow.yaml`)

## Flows

| Flow | Description |
|------|-------------|
| `home.yaml` | Home page smoke test – title, subtitle, Admin login button |
| `login-page.yaml` | Login page smoke test – form elements visible |
| `login-flow.yaml` | Full login flow – requires `MAESTRO_LOGIN_EMAIL` and `MAESTRO_LOGIN_PASSWORD` env vars |

## Base URL

Flows use `http://localhost:1023` (Vite dev server). For preview/production, edit the `url` in each flow or use Maestro env overrides.

## Tips

- **Maestro Studio** - Use the visual IDE to record flows and inspect elements
- **CI/CLI (optional)** - If later needed, run `maestro test maestro/` after starting the app (e.g. `vite preview` or a deployed URL)
- **Web beta** - Report issues to the [Maestro Slack](https://slack.maestro.dev/)
