/// <reference path="../pb_data/types.d.ts" />

/**
 * Server-side registration mail via PocketBase Settings → Mail.
 * https://pocketbase.io/docs/js-sending-emails/
 *
 * Deploy this whole pb_hooks/ folder onto the PocketHost instance, then restart.
 */

onRecordCreateRequest((e) => {
  // Ensure a status code exists before the record is saved.
  if (!e.record.get("registration_status_code")) {
    e.record.set(
      "registration_status_code",
      String(Math.floor(100000 + Math.random() * 900000)),
    );
  }

  e.next();

  const code = String(e.record.get("registration_status_code") || "");
  const name = String(e.record.get("name") || "registrant");
  const ign = String(e.record.get("ign") || "");
  const to = String(e.record.get("email") || "");
  if (!to) return;

  const siteTitle = "Baranggay 176E MLBB Tournament";
  const appURL = String(e.app.settings().meta.appURL || "").replace(/\/$/, "");
  const verifyURL =
    appURL && code ? `${appURL}/verify?code=${encodeURIComponent(code)}` : "";

  let tournamentTitle = "the tournament";
  try {
    const t = e.app.findRecordById(
      "tournaments",
      String(e.record.get("tournament") || ""),
    );
    tournamentTitle = String(t.get("title") || tournamentTitle);
  } catch (err) {}

  const html = $template
    .loadFiles(
      `${__hooks}/views/emails/layout.html`,
      `${__hooks}/views/emails/registration-received.html`,
    )
    .render({
      siteTitle,
      year: new Date().getFullYear(),
      appURL,
      name,
      ign,
      tournamentTitle,
      statusCode: code,
      verifyURL,
    });

  try {
    e.app.newMailClient().send(
      new MailerMessage({
        from: {
          address: e.app.settings().meta.senderAddress,
          name: e.app.settings().meta.senderName,
        },
        to: [{ address: to, name }],
        subject: `${siteTitle}: registration received (${code})`,
        html,
        text: `Hi ${name},\n\nYour registration status code: ${code}\n`,
      }),
    );
    console.log("[sk-mail] registration-received →", to);
  } catch (err) {
    console.log("[sk-mail] registration-received failed", err);
  }
}, "participants");

onRecordAfterUpdateSuccess((e) => {
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
  const siteTitle = "Baranggay 176E MLBB Tournament";
  const appURL = String(e.app.settings().meta.appURL || "").replace(/\/$/, "");
  const verifyURL =
    appURL && code ? `${appURL}/verify?code=${encodeURIComponent(code)}` : "";

  let tournamentTitle = "the tournament";
  try {
    const t = e.app.findRecordById(
      "tournaments",
      String(record.get("tournament") || ""),
    );
    tournamentTitle = String(t.get("title") || tournamentTitle);
  } catch (err) {}

  const viewName =
    nextStatus === "approved"
      ? "registration-approved"
      : "registration-rejected";

  const html = $template
    .loadFiles(
      `${__hooks}/views/emails/layout.html`,
      `${__hooks}/views/emails/${viewName}.html`,
    )
    .render({
      siteTitle,
      year: new Date().getFullYear(),
      appURL,
      name,
      tournamentTitle,
      statusCode: code,
      verifyURL,
      reason: String(record.get("registration_reject_reason") || ""),
    });

  try {
    e.app.newMailClient().send(
      new MailerMessage({
        from: {
          address: e.app.settings().meta.senderAddress,
          name: e.app.settings().meta.senderName,
        },
        to: [{ address: to, name }],
        subject:
          nextStatus === "approved"
            ? `${siteTitle}: registration approved`
            : `${siteTitle}: registration not approved`,
        html,
        text: `Hi ${name},\n\nStatus: ${nextStatus}\nCode: ${code}\n`,
      }),
    );
    console.log("[sk-mail]", viewName, "→", to);
  } catch (err) {
    console.log("[sk-mail] status mail failed", err);
  }

  e.next();
}, "participants");
