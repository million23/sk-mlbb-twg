/**
 * Discord webhook helpers — load with require() inside each hook handler.
 * PocketBase isolates handlers; top-level helpers in *.pb.js are NOT visible.
 *
 * Env (PocketHost only): DISCORD_WEBHOOK_URL
 * If unset, notifications are skipped (no error).
 *
 * Used for ops alerts: admin logins + hook/API errors (not registration spam).
 */

function discordWebhookUrl() {
  try {
    return String($os.getenv("DISCORD_WEBHOOK_URL") || "").trim();
  } catch (err) {
    return "";
  }
}

function truncate(value, max) {
  const s = String(value == null ? "" : value);
  if (!s) return "—";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function field(name, value, inline) {
  return {
    name: String(name),
    value: truncate(value, 1024),
    inline: Boolean(inline),
  };
}

/**
 * POST a Discord webhook payload. Never throws to callers — logs and returns.
 * @param {{ content?: string, embeds?: object[] }} payload
 */
function sendDiscordWebhook(payload) {
  const url = discordWebhookUrl();
  if (!url) {
    return false;
  }
  if (!payload || (!payload.content && !payload.embeds)) {
    console.log("[sk-discord] skip — empty payload");
    return false;
  }

  try {
    const res = $http.send({
      url,
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      timeout: 10,
    });
    const status = res && (res.statusCode || res.status);
    if (status && status >= 200 && status < 300) {
      console.log("[sk-discord] sent", status);
      return true;
    }
    console.log(
      "[sk-discord] unexpected status",
      status,
      res && res.raw ? String(res.raw).slice(0, 200) : "",
    );
    return false;
  } catch (err) {
    console.log("[sk-discord] send failed", err);
    return false;
  }
}

const COLORS = {
  loginOk: 0x3d9a6a,
  loginFail: 0xc45c5c,
  error: 0xd97706,
};

function requestMeta(e) {
  const meta = { ip: "", method: "", path: "" };
  try {
    const info = e.requestInfo();
    if (!info) return meta;
    meta.ip = String(
      info.headers && (info.headers["x-real-ip"] || info.headers["x-forwarded-for"])
        ? info.headers["x-real-ip"] || info.headers["x-forwarded-for"]
        : info.remoteIP || info.remoteAddr || "",
    ).split(",")[0].trim();
    meta.method = String(info.method || "");
    meta.path = String(
      (info.url && (info.url.path || info.url.pathname)) || info.path || "",
    );
  } catch (err) {}
  return meta;
}

/** Admin password login success or failure. */
function notifyLogin(data) {
  const d = data || {};
  const ok = Boolean(d.ok);
  const fields = [
    field("Identity", d.identity || "—", true),
    field("Result", ok ? "Success" : "Failed", true),
  ];
  if (d.name) fields.push(field("Name", d.name, true));
  if (d.role) fields.push(field("Role", d.role, true));
  if (d.email) fields.push(field("Email", d.email, false));
  if (d.ip) fields.push(field("IP", d.ip, true));
  if (!ok && d.error) fields.push(field("Error", d.error, false));

  return sendDiscordWebhook({
    embeds: [
      {
        title: ok ? "Admin login" : "Admin login failed",
        color: ok ? COLORS.loginOk : COLORS.loginFail,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: "SK MLBB · PocketBase ops" },
      },
    ],
  });
}

/** Hook / persistence / unexpected error. */
function notifyError(data) {
  const d = data || {};
  const fields = [
    field("Where", d.where || "unknown", true),
    field("Collection", d.collection || "—", true),
  ];
  if (d.recordId) fields.push(field("Record", d.recordId, true));
  if (d.ip) fields.push(field("IP", d.ip, true));
  if (d.method || d.path) {
    fields.push(field("Request", `${d.method || "?"} ${d.path || ""}`.trim(), false));
  }
  if (d.error) fields.push(field("Error", d.error, false));
  if (d.detail) fields.push(field("Detail", d.detail, false));

  return sendDiscordWebhook({
    embeds: [
      {
        title: d.title || "PocketBase error",
        color: COLORS.error,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: "SK MLBB · PocketBase ops" },
      },
    ],
  });
}

module.exports = {
  discordWebhookUrl,
  sendDiscordWebhook,
  requestMeta,
  notifyLogin,
  notifyError,
};
