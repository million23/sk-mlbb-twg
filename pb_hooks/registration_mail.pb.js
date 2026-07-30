/// <reference path="../pb_data/types.d.ts" />

/**
 * Server-side registration mail via PocketBase Settings → Mail.
 * https://pocketbase.io/docs/js-sending-emails/
 *
 * Deploy this whole pb_hooks/ folder onto the PocketHost instance, then restart.
 *
 * registration-received uses AfterCreateSuccess (same reliability as approve/reject).
 * Status code is still assigned in CreateRequest before save.
 */

function requestAppOrigin(e) {
  try {
    const info = e.requestInfo();
    const query = (info && info.query) || {};
    const headers = (info && info.headers) || {};
    const fromQuery = query.app_origin;
    if (fromQuery != null && String(fromQuery).trim()) {
      return String(Array.isArray(fromQuery) ? fromQuery[0] : fromQuery).trim();
    }
    const fromHeader = headers.origin || headers.Origin || "";
    return String(fromHeader).trim();
  } catch (err) {
    return "";
  }
}

/** Ensure status code exists before the participant row is saved. */
onRecordCreateRequest((e) => {
  const mail = require(`${__hooks}/sk_mail.js`);
  if (!e.record.get("registration_status_code")) {
    e.record.set("registration_status_code", mail.generateStatusCode());
  }
  e.next();
}, "participants");

/** Send receipt after a successful create (mirrors approve/reject after-success). */
onRecordAfterCreateSuccess((e) => {
  const mail = require(`${__hooks}/sk_mail.js`);
  const record = e.record;

  const code = String(record.get("registration_status_code") || "");
  const name = String(record.get("name") || "registrant");
  const ign = String(record.get("ign") || "");
  const to = String(record.get("email") || "");
  if (!to) {
    console.log("[sk-mail] registration-received skip — empty email");
    e.next();
    return;
  }

  const requestOrigin = requestAppOrigin(e);
  const appURL = mail.resolveMailAppURL(requestOrigin) || mail.metaAppURL();
  const verifyURL = mail.verifyURL(code, requestOrigin || appURL);
  const tournamentTitle = mail.tournamentTitle(
    String(record.get("tournament") || ""),
  );

  try {
    mail.sendHtmlEmail({
      to,
      toName: name,
      subject: `${mail.SITE_TITLE}: registration received (${code})`,
      viewName: "registration-received",
      data: {
        name,
        ign,
        tournamentTitle,
        statusCode: code,
        appURL,
        verifyURL,
        requestOrigin,
      },
    });
  } catch (err) {
    console.log("[sk-mail] registration-received failed", err);
  }

  e.next();
}, "participants");

onRecordAfterUpdateSuccess((e) => {
  const mail = require(`${__hooks}/sk_mail.js`);
  const record = e.record;
  const prev = record.original();
  const nextStatus = String(record.get("registration_status") || "");
  const prevStatus = prev ? String(prev.get("registration_status") || "") : "";

  if (
    !nextStatus ||
    nextStatus === prevStatus ||
    (nextStatus !== "approved" && nextStatus !== "rejected")
  ) {
    e.next();
    return;
  }

  const to = String(record.get("email") || "");
  const name = String(record.get("name") || "registrant");
  const code = String(record.get("registration_status_code") || "");
  // Approve/reject are admin actions — use PocketBase Application URL.
  const appURL = mail.metaAppURL();
  const verifyURL = mail.verifyURL(code, appURL);
  const tournamentTitle = mail.tournamentTitle(
    String(record.get("tournament") || ""),
  );

  const viewName =
    nextStatus === "approved"
      ? "registration-approved"
      : "registration-rejected";

  try {
    mail.sendHtmlEmail({
      to,
      toName: name,
      subject:
        nextStatus === "approved"
          ? `${mail.SITE_TITLE}: registration approved`
          : `${mail.SITE_TITLE}: registration not approved`,
      viewName,
      data: {
        name,
        tournamentTitle,
        statusCode: code,
        appURL,
        verifyURL,
        reason: String(record.get("registration_reject_reason") || ""),
      },
    });
  } catch (err) {
    console.log("[sk-mail] status mail failed", err);
  }

  e.next();
}, "participants");
