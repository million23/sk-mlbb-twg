/// <reference path="../pb_data/types.d.ts" />

/**
 * Ops alerts → Discord (DISCORD_WEBHOOK_URL).
 * - Admin password logins (success + failure)
 * - All PocketBase warn/error Dashboard Logs (_logs)
 * - Record create / update / delete on all collections
 *
 * Helpers via require(`${__hooks}/sk_discord.js`) — handler isolation.
 */

/** Admin email/password auth (collection `admins`). */
onRecordAuthWithPasswordRequest((e) => {
  const discord = require(`${__hooks}/sk_discord.js`);
  const identity = String(e.identity || "");
  const meta = discord.requestMeta(e);

  try {
    e.next();
  } catch (err) {
    try {
      discord.notifyLogin({
        ok: false,
        identity,
        ip: meta.ip,
        error: String(err && (err.message || err) || "auth failed"),
      });
    } catch (notifyErr) {
      console.log("[sk-discord] login-fail notify failed", notifyErr);
    }
    throw err;
  }

  try {
    const record = e.record;
    discord.notifyLogin({
      ok: true,
      identity,
      ip: meta.ip,
      name: record ? String(record.get("name") || "") : "",
      role: record ? String(record.get("role") || "") : "",
      email: record
        ? String(
            (typeof record.email === "function"
              ? record.email()
              : record.get("email")) || identity,
          )
        : identity,
    });
  } catch (notifyErr) {
    console.log("[sk-discord] login-ok notify failed", notifyErr);
  }
}, "admins");

/** slog Warn=4, Error=8. Persist the log first so Discord latency does not block writes. */
onModelCreate((e) => {
  const model = e.model;
  const level = Number(model.level);
  const payload = {
    id: String(model.id || ""),
    level: level,
    message: String(model.message || ""),
    data: model.data,
  };
  e.next();

  if (!(level >= 4)) {
    return;
  }
  try {
    const discord = require(`${__hooks}/sk_discord.js`);
    discord.notifyLog(payload);
  } catch (err) {
    console.log("[sk-discord] log notify failed", err);
  }
}, "_logs");

onRecordAfterCreateSuccess((e) => {
  try {
    require(`${__hooks}/sk_discord.js`).notifyRecordChange("create", e);
  } catch (err) {
    console.log("[sk-discord] record-create notify failed", err);
  }
  e.next();
});

onRecordAfterUpdateSuccess((e) => {
  try {
    require(`${__hooks}/sk_discord.js`).notifyRecordChange("update", e);
  } catch (err) {
    console.log("[sk-discord] record-update notify failed", err);
  }
  e.next();
});

onRecordAfterDeleteSuccess((e) => {
  try {
    require(`${__hooks}/sk_discord.js`).notifyRecordChange("delete", e);
  } catch (err) {
    console.log("[sk-discord] record-delete notify failed", err);
  }
  e.next();
});
