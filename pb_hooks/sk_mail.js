/**
 * Shared mail helpers — load with require() inside each hook handler.
 * PocketBase isolates handlers; top-level helpers in *.pb.js are NOT visible inside them.
 */

const SITE_TITLE = "Baranggay 176E MLBB Tournament";

function appURL() {
  return ($app.settings().meta.appURL || "").replace(/\/$/, "");
}

function verifyURL(statusCode) {
  const base = appURL();
  if (!base || !statusCode) return "";
  return `${base}/verify?code=${encodeURIComponent(String(statusCode))}`;
}

function plainTextFromData(subject, data) {
  const lines = [subject, ""];
  if (data.name) lines.push(`Hi ${data.name},`);
  if (data.tournamentTitle) lines.push(`Tournament: ${data.tournamentTitle}`);
  if (data.statusCode) lines.push(`Status code: ${data.statusCode}`);
  if (data.reason) lines.push(`Reason: ${data.reason}`);
  if (data.verifyURL) lines.push(`Verify: ${data.verifyURL}`);
  if (data.actionURL) lines.push(`Open: ${data.actionURL}`);
  lines.push("", SITE_TITLE);
  return lines.join("\n");
}

function renderEmail(viewName, data) {
  return $template
    .loadFiles(
      `${__hooks}/views/emails/layout.html`,
      `${__hooks}/views/emails/${viewName}.html`,
    )
    .render({
      siteTitle: SITE_TITLE,
      year: new Date().getFullYear(),
      appURL: appURL(),
      ...data,
    });
}

function sendHtmlEmail({ to, toName, subject, viewName, data }) {
  if (!to) {
    console.log("[sk-mail] skip send — empty recipient", viewName);
    return;
  }

  const html = renderEmail(viewName, data || {});
  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName || SITE_TITLE,
    },
    to: [{ address: to, name: toName || "" }],
    subject,
    html,
    text: plainTextFromData(subject, data || {}),
  });

  $app.newMailClient().send(message);
  console.log("[sk-mail] sent", viewName, "→", to);
}

function tournamentTitle(tournamentId) {
  if (!tournamentId) return "the tournament";
  try {
    const t = $app.findRecordById("tournaments", tournamentId);
    return String(t.get("title") || "the tournament");
  } catch (err) {
    return "the tournament";
  }
}

function extractActionURL(message) {
  if (!message) return "";
  const meta = message.meta || {};
  if (meta.actionUrl) return String(meta.actionUrl);
  if (meta.actionURL) return String(meta.actionURL);
  if (message.html) {
    const match = String(message.html).match(/href="([^"]+)"/i);
    if (match) return match[1];
  }
  return "";
}

function generateStatusCode() {
  for (let i = 0; i < 24; i++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const existing = $app.findRecordsByFilter(
      "participants",
      "registration_status_code = {:code} && archived = false",
      "",
      1,
      0,
      { code },
    );
    if (!existing || existing.length === 0) return code;
  }
  throw new Error("Could not generate a unique registration status code");
}

module.exports = {
  SITE_TITLE,
  appURL,
  verifyURL,
  plainTextFromData,
  renderEmail,
  sendHtmlEmail,
  tournamentTitle,
  extractActionURL,
  generateStatusCode,
};
