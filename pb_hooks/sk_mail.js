/**
 * Shared mail helpers — load with require() inside each hook handler.
 * PocketBase isolates handlers; top-level helpers in *.pb.js are NOT visible inside them.
 */

const SITE_TITLE = "Baranggay 176E MLBB Tournament";

/** Hosts always accepted for verify-link origins (local + this project's deploys). */
const KNOWN_APP_HOSTS = [
  "localhost",
  "127.0.0.1",
  "skmlbb.geraldchavez.xyz",
  "skmlbb-beta.geraldchavez.xyz",
];

function normalizeOrigin(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : "https://" + s;
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return (u.protocol + "//" + u.host).replace(/\/$/, "");
  } catch (err) {
    return "";
  }
}

function metaAppURL() {
  return normalizeOrigin($app.settings().meta.appURL || "");
}

function isAllowedAppOrigin(origin) {
  const n = normalizeOrigin(origin);
  if (!n) return false;
  let host = "";
  try {
    host = new URL(n).hostname.toLowerCase();
  } catch (err) {
    return false;
  }

  if (KNOWN_APP_HOSTS.indexOf(host) !== -1) return true;

  const meta = metaAppURL();
  if (meta && meta === n) return true;

  try {
    const env = String($os.getenv("SK_APP_ORIGINS") || "");
    const parts = env.split(/[,\s]+/);
    for (let i = 0; i < parts.length; i++) {
      const a = normalizeOrigin(parts[i]);
      if (!a) continue;
      if (a === n) return true;
      try {
        if (new URL(a).hostname.toLowerCase() === host) return true;
      } catch (err2) {}
    }
  } catch (err) {}

  return false;
}

/**
 * Prefer the origin from the registration request (`app_origin` query),
 * then fall back to PocketBase Settings → Application URL.
 */
function resolveMailAppURL(requestOrigin) {
  const fromRequest = normalizeOrigin(requestOrigin);
  if (fromRequest && isAllowedAppOrigin(fromRequest)) {
    return fromRequest;
  }
  return metaAppURL();
}

function appURL() {
  return metaAppURL();
}

function verifyURL(statusCode, requestOrigin) {
  const base = resolveMailAppURL(requestOrigin);
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
  const mailAppURL =
    (data && data.appURL) || resolveMailAppURL(data && data.requestOrigin);
  return $template
    .loadFiles(
      `${__hooks}/views/emails/layout.html`,
      `${__hooks}/views/emails/${viewName}.html`,
    )
    .render({
      siteTitle: SITE_TITLE,
      year: new Date().getFullYear(),
      ...data,
      appURL: mailAppURL,
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
  metaAppURL,
  normalizeOrigin,
  isAllowedAppOrigin,
  resolveMailAppURL,
  verifyURL,
  plainTextFromData,
  renderEmail,
  sendHtmlEmail,
  tournamentTitle,
  extractActionURL,
  generateStatusCode,
};
