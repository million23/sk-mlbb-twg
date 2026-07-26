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
    registration_mail.pb.js
    admins_mail.pb.js
    sk_mail.js
    views/emails/
```

After a test register, logs should show `[sk-mail] registration-received → …`.

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
