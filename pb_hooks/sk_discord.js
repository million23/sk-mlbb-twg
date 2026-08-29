/**
 * Discord webhook helpers — load with require() inside each hook handler.
 * PocketBase isolates handlers; top-level helpers in *.pb.js are NOT visible.
 *
 * Env (PocketHost only): DISCORD_WEBHOOK_URL
 * If unset, notifications are skipped (no error).
 *
 * Used for ops alerts: admin logins, logs, record changes, hook errors.
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
  warn: 0xd97706,
  error: 0xc45c5c,
  recordCreate: 0x3d9a6a,
  recordUpdate: 0x4c6b8a,
  recordDelete: 0x6b5b95,
};

/** slog: Debug=-4, Info=0, Warn=4, Error=8 */
const LOG_LEVEL_WARN = 4;
const LOG_LEVEL_ERROR = 8;

function logLevelName(level) {
  const n = Number(level);
  if (n >= LOG_LEVEL_ERROR) return "error";
  if (n >= LOG_LEVEL_WARN) return "warn";
  if (n >= 0) return "info";
  return "debug";
}

function stringifyLogData(data) {
  if (data == null || data === "") return "";
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch (err) {
    return String(data);
  }
}

const HIDDEN_RECORD_KEYS = {
  password: 1,
  passwordConfirm: 1,
  tokenKey: 1,
  turnstile_token: 1,
  website: 1,
  email: 1,
  contact_number: 1,
  birthdate: 1,
  address_phase: 1,
  address_package: 1,
  address_block: 1,
  address_lot: 1,
  school_id_front: 1,
  school_id_back: 1,
  purok_endorsement: 1,
};

const NOISE_UPDATE_KEYS = {
  last_login_at: 1,
  created: 1,
  updated: 1,
  updated_by: 1,
};

function collectionNameFromEvent(e) {
  try {
    if (e.collection && e.collection.name) return String(e.collection.name);
    const record = e.record;
    if (!record) return "";
    if (typeof record.collectionName === "function") {
      return String(record.collectionName() || "");
    }
    if (typeof record.collection === "function") {
      const c = record.collection();
      return c && c.name ? String(c.name) : "";
    }
  } catch (err) {}
  return "";
}

function recordSnapshot(record) {
  let raw = {};
  try {
    if (record && typeof record.publicExport === "function") {
      raw = record.publicExport() || {};
    }
  } catch (err) {}
  const out = {};
  for (const k in raw) {
    if (HIDDEN_RECORD_KEYS[k]) continue;
    out[k] = raw[k];
  }
  return out;
}

function recordDiff(before, after) {
  const keys = {};
  for (const k in before) keys[k] = 1;
  for (const k in after) keys[k] = 1;
  const changes = {};
  for (const k in keys) {
    if (HIDDEN_RECORD_KEYS[k]) continue;
    const a = stringifyLogData(before[k]);
    const b = stringifyLogData(after[k]);
    if (a !== b) changes[k] = { from: before[k], to: after[k] };
  }
  return changes;
}

function noiseOnlyUpdate(changes) {
  const keys = Object.keys(changes);
  if (!keys.length) return true;
  for (let i = 0; i < keys.length; i++) {
    if (!NOISE_UPDATE_KEYS[keys[i]]) return false;
  }
  return true;
}

function recordLabel(snap) {
  return String(
    (snap && (snap.name || snap.title || snap.ign || snap.match_label || snap.slug)) ||
      "",
  );
}

function pickValue(obj, keys) {
  if (obj == null) return "";
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    let v;
    try {
      if (typeof obj.get === "function") v = obj.get(k);
    } catch (err) {}
    if (v == null) {
      try {
        v = obj[k];
      } catch (err) {}
    }
    if (v != null && v !== "") return String(v);
  }
  return "";
}

function formatAuthRecord(auth) {
  if (!auth) return "";
  const id = String(auth.id || "");
  let name = "";
  let email = "";
  let col = "";
  try {
    if (typeof auth.get === "function") {
      name = String(auth.get("name") || "");
      email = String(
        (typeof auth.email === "function" ? auth.email() : auth.get("email")) ||
          "",
      );
    }
  } catch (err) {}
  try {
    if (typeof auth.collection === "function") {
      const c = auth.collection();
      col = c && c.name ? String(c.name) : "";
    } else if (auth.collectionName) {
      col = String(
        typeof auth.collectionName === "function"
          ? auth.collectionName()
          : auth.collectionName,
      );
    }
  } catch (err) {}
  const parts = [];
  if (name) parts.push(name);
  if (email && email !== name) parts.push(email);
  if (col) parts.push("(" + col + ")");
  if (id) parts.push(id);
  return parts.join(" ");
}

function ipFromEvent(e) {
  if (!e) return "";
  try {
    if (typeof e.realIP === "function") {
      const ip = String(e.realIP() || "").trim();
      if (ip) return ip;
    }
  } catch (err) {}
  try {
    const info = typeof e.requestInfo === "function" ? e.requestInfo() : null;
    if (info) {
      const fromHeader = pickValue(info.headers, [
        "x-real-ip",
        "X-Real-Ip",
        "x-forwarded-for",
        "X-Forwarded-For",
      ]);
      if (fromHeader) return fromHeader.split(",")[0].trim();
      const fromInfo = pickValue(info, ["remoteIP", "remoteAddr", "userIP"]);
      if (fromInfo) return fromInfo.split(",")[0].trim();
    }
  } catch (err) {}
  return "";
}

function authLabel(e) {
  if (!e) return "";
  try {
    let auth = e.auth;
    if (!auth && typeof e.requestInfo === "function") {
      const info = e.requestInfo();
      auth = info && info.auth;
    }
    const labeled = formatAuthRecord(auth);
    if (labeled) return labeled;
    if (typeof e.hasSuperuserAuth === "function" && e.hasSuperuserAuth()) {
      return "superuser";
    }
  } catch (err) {}
  return "";
}

function actorFromLogData(data) {
  const ip = pickValue(data, [
    "userIP",
    "userIp",
    "user_ip",
    "ip",
    "remoteIP",
    "remoteAddr",
  ]);
  const authId = pickValue(data, ["authId", "auth_id"]);
  const authCol = pickValue(data, ["auth", "authCollection"]);
  const parts = [];
  if (authCol) parts.push("(" + authCol + ")");
  if (authId) parts.push(authId);
  return { user: parts.join(" "), ip: ip.split(",")[0].trim() };
}

function resolveActor(e, extra, logData) {
  let user = authLabel(e);
  let ip = ipFromEvent(e);
  if (logData) {
    const fromLog = actorFromLogData(logData);
    if (!user) user = fromLog.user;
    if (!ip) ip = fromLog.ip;
  }
  if (extra) {
    if (extra.user) user = String(extra.user);
    if (extra.ip) ip = String(extra.ip);
  }
  return { user: user || "guest", ip: ip || "—" };
}

function appendActorFields(fields, actor) {
  fields.push(field("User", actor.user, true));
  fields.push(field("IP", actor.ip, true));
}

function requestMeta(e) {
  const meta = { ip: ipFromEvent(e), method: "", path: "" };
  try {
    const info = e.requestInfo();
    if (!info) return meta;
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
  const user =
    [d.name, d.email || d.identity].filter(Boolean).join(" ") || d.identity || "guest";
  const fields = [
    field("Identity", d.identity || "—", true),
    field("Result", ok ? "Success" : "Failed", true),
  ];
  appendActorFields(fields, { user: user, ip: d.ip || "—" });
  if (d.role) fields.push(field("Role", d.role, true));
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
function notifyError(data, e) {
  const d = data || {};
  const fields = [
    field("Where", d.where || "unknown", true),
    field("Collection", d.collection || "—", true),
  ];
  if (d.recordId) fields.push(field("Record", d.recordId, true));
  appendActorFields(fields, resolveActor(e, d));
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

/** Dashboard Logs row (warn/error). Skip our own Discord send logs. */
function notifyLog(data) {
  const d = data || {};
  const message = String(d.message || "");
  if (message.indexOf("[sk-discord]") !== -1) {
    return false;
  }
  const level = Number(d.level);
  if (!(level >= LOG_LEVEL_WARN)) {
    return false;
  }
  const isError = level >= LOG_LEVEL_ERROR;
  const fields = [
    field("Level", logLevelName(level), true),
  ];
  if (d.id) fields.push(field("Log", d.id, true));
  appendActorFields(fields, resolveActor(null, null, d.data));
  if (message) fields.push(field("Message", message, false));
  const detail = stringifyLogData(d.data);
  if (detail) fields.push(field("Data", detail, false));

  return sendDiscordWebhook({
    embeds: [
      {
        title: isError ? "PocketBase error" : "PocketBase warning",
        color: isError ? COLORS.error : COLORS.warn,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: "SK MLBB · PocketBase logs" },
      },
    ],
  });
}

/** Record create / update / delete. Skips `_` system collections and last-login-only admin updates. */
function notifyRecordChange(action, e) {
  const collection = collectionNameFromEvent(e);
  if (!collection || collection.charAt(0) === "_") {
    return false;
  }

  const record = e && e.record;
  const after = recordSnapshot(record);
  let changes = null;
  if (action === "update") {
    let before = {};
    try {
      before = recordSnapshot(record.original());
    } catch (err) {}
    changes = recordDiff(before, after);
    if (noiseOnlyUpdate(changes)) {
      return false;
    }
  }

  const fields = [
    field("Table", collection, true),
    field("Action", action, true),
    field("Record", (record && record.id) || after.id || "—", true),
  ];
  const label = recordLabel(after);
  if (label) fields.push(field("Label", label, true));
  appendActorFields(fields, resolveActor(e));
  if (changes) {
    fields.push(field("Changes", stringifyLogData(changes), false));
  } else if (action !== "delete") {
    fields.push(field("Data", stringifyLogData(after), false));
  }

  const titles = {
    create: "Record created",
    update: "Record updated",
    delete: "Record deleted",
  };
  const colors = {
    create: COLORS.recordCreate,
    update: COLORS.recordUpdate,
    delete: COLORS.recordDelete,
  };

  return sendDiscordWebhook({
    embeds: [
      {
        title: titles[action] || "Record change",
        color: colors[action] || COLORS.recordUpdate,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: "SK MLBB · PocketBase data" },
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
  notifyLog,
  notifyRecordChange,
  LOG_LEVEL_WARN,
  LOG_LEVEL_ERROR,
};
