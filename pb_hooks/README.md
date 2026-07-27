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
    registration_mail.pb.js
    admins_mail.pb.js
    sk_mail.js
    views/emails/
```

After a test register, logs should show `[sk-mail] registration-received → …`.

## Registration guards

[`registration_guard.pb.js`](./registration_guard.pb.js) runs on public `participants` create:

- Honeypot field `website` (must be empty)
- Cloudflare Turnstile token `turnstile_token` (skipped for admin auth)
- Duplicate **email** and **user_id + server_id** per tournament when status is `pending` / `approved`

Public pre-checks (used by the Vite form):

`GET /sk/registration/email-available?tournament=ID&email=you@example.com` → `{ available: boolean }`

`GET /sk/registration/status?code=123456` → `{ found: false }` or `{ found: true, receipt: { … } }` (no document file fields)

### PocketHost env

Set on the instance (dashboard env / secrets), then **restart**:

| Variable | Purpose |
| --- | --- |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret (**required** — no silent skip) |
| `TURNSTILE_SKIP=1` | Only local escape hatch; otherwise create fails if secret is missing |

Vite app needs matching `VITE_TURNSTILE_SITE_KEY` in `.env` only (public).  
**Do not** put the secret in any `VITE_*` variable — set it only on PocketHost.

Cloudflare always-pass test keys: [Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

## Mail settings

Dashboard → **Settings → Mail**:

- SMTP already configured (e.g. Resend SMTP)
- **Sender address** + **Sender name**
- **Application URL** → public site (Verify links)

## Emails

| Trigger | Template |
| --- | --- |
| `participants` create | `registration-received` |
| `participants` → approved / rejected | `registration-approved` / `registration-rejected` |
| `admins` password reset / verification | `admin-password-reset` / `admin-verification` |

HTML: `views/emails/` (`layout.html` + per-message body).
