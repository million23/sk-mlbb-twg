/// <reference path="../pb_data/types.d.ts" />

/**
 * Ops alerts → Discord (DISCORD_WEBHOOK_URL).
 * - Admin password logins (success + failure)
 * - Record create/update/delete persistence errors on key collections
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

function reportRecordError(where, e) {
  const discord = require(`${__hooks}/sk_discord.js`);
  const meta = discord.requestMeta(e);
  const record = e.record;
  const collection =
    (e.collection && e.collection.name) ||
    (record && record.collectionName && record.collectionName()) ||
    "—";
  const err = e.error;
  discord.notifyError({
    title: "Record " + where + " failed",
    where: where,
    collection: String(collection),
    recordId: record ? String(record.id || "") : "",
    ip: meta.ip,
    method: meta.method,
    path: meta.path,
    error: String(err && (err.message || err) || "unknown error"),
  });
}

onRecordAfterCreateError((e) => {
  try {
    reportRecordError("create", e);
  } catch (err) {
    console.log("[sk-discord] create-error notify failed", err);
  }
  e.next();
}, "participants", "teams", "matches", "match_result", "tournaments", "admins");

onRecordAfterUpdateError((e) => {
  try {
    reportRecordError("update", e);
  } catch (err) {
    console.log("[sk-discord] update-error notify failed", err);
  }
  e.next();
}, "participants", "teams", "matches", "match_result", "tournaments", "admins");

onRecordAfterDeleteError((e) => {
  try {
    reportRecordError("delete", e);
  } catch (err) {
    console.log("[sk-discord] delete-error notify failed", err);
  }
  e.next();
}, "participants", "teams", "matches", "match_result", "tournaments", "admins");
