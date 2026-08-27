# PocketBase email hooks (server-side)

Custom HTML mail is sent **on the PocketBase server** via **Settings → Mail** (SMTP). The Vite app does not send mail.

## Deploy to PocketHost (`sk-mlbb-twg`)

Local `pb_hooks/` does nothing until synced to the instance. Then **restart** the instance in the PocketHost dashboard.

### Option A — SFTP (works without `phio` / Node)

PocketHost SFTP: `ftp.pockethost.io:2222` ([docs](https://pockethost.io/docs/ftp)).

1. PocketHost dashboard → **Account → Keys** → add your SSH public key  
2. From repo root, upload the folder (replace `YOU@email` and key path):

```bash
scp -i ~/.ssh/your_key -P 2222 -r pb_hooks "YOU@email@ftp.pockethost.io:sk-mlbb-twg/"
```

Or use Cyberduck / FileZilla / VS Code SFTP → remote path `sk-mlbb-twg/pb_hooks`.

### Option B — `phio` CLI

[`phio`](https://pockethost.io/docs/phio) ships as a Node 24+ CLI (`tsx` bin). **`bunx phio` fails** on that shim — use the system Node install, not Bun:

```bash
npm install -g phio
phio login
phio link sk-mlbb-twg
phio deploy sk-mlbb-twg
phio logs sk-mlbb-twg
```

Remote layout after deploy:

```
sk-mlbb-twg/
  pb_data/
  pb_hooks/
    registration_guard.pb.js
    registration_guard_lib.js
    turnstile_cache.js
    registration_mail.pb.js
    admins_mail.pb.js
    sk_ops.pb.js
    sk_matches.pb.js
    sk_matches_lib.js
    sk_mail.js
    sk_discord.js
    views/emails/
```

After a test register, logs should show `[sk-mail] registration-received → …`.

## Registration guards

[`registration_guard.pb.js`](./registration_guard.pb.js) runs on public `participants` create:

- Honeypot field `website` (must be empty)
- Cloudflare Turnstile token `turnstile_token` (skipped for admin auth). Create-team reuses one widget token for every teammate; after the first successful siteverify the hook allows that token again for up to 6 uses / 5 minutes (Cloudflare tokens are otherwise single-use and return `timeout-or-duplicate`).
- Duplicate **email** and **user_id + server_id** per tournament when status is `pending` / `approved`
- **Create-team** intent: find-or-create a `forming` row in `teams` for `preferred_team_name`, then set `preferred_team` on the registrant (players stay pending / unassigned until committee approve)

Public pre-checks (used by the Vite form):

`GET /sk/registration/email-available?tournament=ID&email=you@example.com` → `{ available: boolean }`

`GET /sk/registration/status?code=123456` → `{ found: false }` or `{ found: true, receipt: { …, has_purok_endorsement } }` (no document file fields)

`GET /sk/registration/listed-teams?tournament=ID` → `{ items: [{ id, name }, …] }` (joinable teams only; hides create-team forming placeholders until members are assigned)

### PocketHost env

Set on the instance (dashboard env / secrets), then **restart**:

| Variable | Purpose |
| --- | --- |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret (**required** — no silent skip) |
| `TURNSTILE_SKIP=1` | Only local escape hatch; otherwise create fails if secret is missing |
| `SK_APP_ORIGINS` | Optional extra allowlisted site origins for verify-link emails (comma-separated) |
| `DISCORD_WEBHOOK_URL` | Discord webhook for **ops** alerts: admin logins + errors (optional; skipped if unset) |

Vite app needs matching `VITE_TURNSTILE_SITE_KEY` in `.env` only (public).  
**Do not** put secrets in any `VITE_*` variable — set them only on PocketHost.

### Discord ops alerts

[`sk_ops.pb.js`](./sk_ops.pb.js) + [`sk_discord.js`](./sk_discord.js) post embeds for:

- **Admin login** success / failure (`admins` password auth)
- **Record create/update/delete errors** on `participants`, `teams`, `matches`, `match_result`, `tournaments`, `admins`
- **Mail send failures** from registration hooks (so you see SMTP issues without opening PocketBase logs)

Not used for normal registration success (that stays email-only).

Set `DISCORD_WEBHOOK_URL` on the PocketHost instance (Channel → Integrations → Webhooks → Copy URL), redeploy `pb_hooks/`, then **restart**.

### Draft matches

[`sk_matches.pb.js`](./sk_matches.pb.js) + [`sk_matches_lib.js`](./sk_matches_lib.js) strip `status = draft` from guest list/view responses after the query runs. Helpers are `require`d inside handlers because PocketHost isolates top-level functions in `*.pb.js`. Staff auth still sees drafts.

Redeploy **both** files and restart.

Cloudflare always-pass test keys: [Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

## Mail settings

Dashboard → **Settings → Mail**:

- SMTP already configured (e.g. Resend SMTP)
- **Sender address** + **Sender name**
- **Application URL** → production public site (used for approve/reject mail, and as fallback)

Registration-received verify links prefer `app_origin` from the submitting browser (`window.location.origin`), allowlisted in `sk_mail.js` (localhost, beta/main hosts, `SK_APP_ORIGINS`, Application URL). Redeploy `pb_hooks/` after changing that logic.

## Emails

| Trigger | Template |
| --- | --- |
| `participants` after create success | `registration-received` |
| `participants` → approved / rejected (after update success) | `registration-approved` / `registration-rejected` |
| `admins` password reset / verification | `admin-password-reset` / `admin-verification` |

If approve/reject mail works but registration-received does not, redeploy `pb_hooks/` and **restart** the PocketHost instance — received mail must use `onRecordAfterCreateSuccess` (not mail-after-`e.next()` in create request).

HTML: `views/emails/` (`layout.html` + per-message body).
