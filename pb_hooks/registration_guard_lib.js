/**
 * Shared registration guards — load with require() inside each hook handler.
 * PocketBase isolates handlers; top-level helpers in *.pb.js are NOT visible inside them.
 */

function isAdminAuth(e) {
  try {
    const auth = e.auth;
    if (!auth) return false;
    return (
      auth.collectionName === "admins" || auth.collection().name === "admins"
    );
  } catch (err) {
    return false;
  }
}

function requestBody(e) {
  try {
    const info = e.requestInfo();
    return info && info.body && typeof info.body === "object" ? info.body : {};
  } catch (err) {
    return {};
  }
}

function requestHeaders(e) {
  try {
    return e.requestInfo().headers || {};
  } catch (err) {
    return {};
  }
}

function requestQuery(e) {
  try {
    const info = e.requestInfo();
    return info && info.query && typeof info.query === "object" ? info.query : {};
  } catch (err) {
    return {};
  }
}

function queryString(query, key) {
  const v = query[key];
  if (v == null) return "";
  if (Array.isArray(v)) return String(v[0] || "").trim();
  return String(v).trim();
}

function bodyString(body, key) {
  const v = body[key];
  if (v == null) return "";
  return String(v).trim();
}

function headerString(headers, key) {
  const v = headers[key] || headers[String(key).toLowerCase()] || "";
  return String(v).trim();
}

function verifyTurnstile(secret, token, remoteIp) {
  const form = [
    "secret=" + encodeURIComponent(secret),
    "response=" + encodeURIComponent(token),
  ];
  if (remoteIp) {
    form.push("remoteip=" + encodeURIComponent(remoteIp));
  }

  const res = $http.send({
    url: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.join("&"),
    timeout: 15,
  });

  if (res.statusCode !== 200) {
    console.log("[sk-guard] turnstile http", res.statusCode);
    return false;
  }

  try {
    const raw =
      typeof res.body === "string"
        ? res.body
        : typeof res.raw === "string"
          ? res.raw
          : JSON.stringify(res.body || {});
    const data = JSON.parse(raw || "{}");
    return data && data.success === true;
  } catch (err) {
    console.log("[sk-guard] turnstile parse failed", err);
    return false;
  }
}

function hasActiveDuplicate(app, filter, params) {
  try {
    const rows = app.findRecordsByFilter(
      "participants",
      filter,
      "-created",
      1,
      0,
      params,
    );
    return rows && rows.length > 0;
  } catch (err) {
    console.log("[sk-guard] duplicate query failed", err);
    throw new BadRequestError(
      "Could not verify registration uniqueness. Try again.",
    );
  }
}

function enforceCreateGuards(e) {
  const body = requestBody(e);
  const headers = requestHeaders(e);
  const query = requestQuery(e);
  const admin = isAdminAuth(e);

  if (!admin) {
    const bait =
      queryString(query, "website") ||
      headerString(headers, "X-Reg-Website") ||
      headerString(headers, "x-reg-website") ||
      bodyString(body, "website") ||
      bodyString(body, "company_url");
    if (bait) {
      throw new BadRequestError("Registration rejected.");
    }
  }

  // Public creates must pass Turnstile. No silent skip when secret is missing
  // (use TURNSTILE_SKIP=1 only for local PB without Cloudflare).
  if (!admin) {
    const skip = String($os.getenv("TURNSTILE_SKIP") || "") === "1";
    const secret = String($os.getenv("TURNSTILE_SECRET_KEY") || "").trim();
    if (skip) {
      console.log("[sk-guard] TURNSTILE_SKIP=1 — Turnstile verify bypassed");
    } else if (!secret) {
      throw new BadRequestError(
        "Registration bot protection is not configured on the server.",
      );
    } else {
      const token =
        queryString(query, "turnstile_token") ||
        headerString(headers, "X-Turnstile-Token") ||
        headerString(headers, "x-turnstile-token") ||
        bodyString(body, "turnstile_token") ||
        bodyString(body, "cf-turnstile-response");
      if (!token) {
        throw new BadRequestError(
          "Complete the human verification challenge.",
        );
      }
      const remoteIp = headerString(headers, "x-forwarded-for")
        .split(",")[0]
        .trim();
      if (!verifyTurnstile(secret, token, remoteIp)) {
        throw new BadRequestError(
          "Human verification failed. Please try again.",
        );
      }
    }
  }

  const tournamentId = String(e.record.get("tournament") || "").trim();
  const email = String(e.record.get("email") || "")
    .trim()
    .toLowerCase();
  const userId = String(e.record.get("user_id") || "").trim();
  const serverId = String(e.record.get("server_id") || "").trim();

  if (email) e.record.set("email", email);
  if (userId) e.record.set("user_id", userId);
  if (serverId) e.record.set("server_id", serverId);

  if (tournamentId && email) {
    if (
      hasActiveDuplicate(
        e.app,
        'tournament = {:tid} && email = {:email} && (registration_status = "pending" || registration_status = "approved")',
        { tid: tournamentId, email: email },
      )
    ) {
      throw new BadRequestError(
        "This email already has a pending or approved registration for this tournament.",
      );
    }
  }

  if (tournamentId && userId && serverId) {
    if (
      hasActiveDuplicate(
        e.app,
        'tournament = {:tid} && user_id = {:uid} && server_id = {:sid} && (registration_status = "pending" || registration_status = "approved")',
        { tid: tournamentId, uid: userId, sid: serverId },
      )
    ) {
      throw new BadRequestError(
        "This Mobile Legends account already has a pending or approved registration for this tournament.",
      );
    }
  }
}

function emailAvailable(app, tournamentId, email) {
  return !hasActiveDuplicate(
    app,
    'tournament = {:tid} && email = {:email} && (registration_status = "pending" || registration_status = "approved")',
    { tid: tournamentId, email: email },
  );
}

/**
 * Public status-code lookup — returns a receipt without document file fields.
 * @returns {object|null} sanitized payload, or null when not found / invalid code
 */
function lookupByStatusCode(app, rawCode) {
  const code = String(rawCode || "").trim();
  if (!/^\d{6}$/.test(code)) {
    return null;
  }

  let rows;
  try {
    rows = app.findRecordsByFilter(
      "participants",
      "registration_status_code = {:code} && archived = false",
      "-created",
      1,
      0,
      { code: code },
    );
  } catch (err) {
    console.log("[sk-guard] status lookup failed", err);
    throw new BadRequestError("Could not look up registration. Try again.");
  }

  if (!rows || rows.length === 0) {
    return null;
  }

  const r = rows[0];
  let tournamentTitle = "";
  const tournamentId = String(r.get("tournament") || "");
  if (tournamentId) {
    try {
      const t = app.findRecordById("tournaments", tournamentId);
      tournamentTitle = String(t.get("title") || "");
    } catch (err) {
      console.log("[sk-guard] tournament expand failed", err);
    }
  }

  let preferredTeamName = String(r.get("preferred_team_name") || "").trim();
  const preferredTeamId = String(r.get("preferred_team") || "");
  if (!preferredTeamName && preferredTeamId) {
    try {
      const team = app.findRecordById("teams", preferredTeamId);
      preferredTeamName = String(team.get("name") || "").trim();
    } catch (err) {
      console.log("[sk-guard] preferred team expand failed", err);
    }
  }

  return {
    registration_status: String(r.get("registration_status") || "pending"),
    registration_reject_reason: String(r.get("registration_reject_reason") || ""),
    registration_status_code: code,
    tournament_title: tournamentTitle,
    name: String(r.get("name") || ""),
    email: String(r.get("email") || ""),
    ign: String(r.get("ign") || ""),
    birthdate: String(r.get("birthdate") || ""),
    contact_number: String(r.get("contact_number") || ""),
    user_id: String(r.get("user_id") || ""),
    server_id: String(r.get("server_id") || ""),
    address_phase: String(r.get("address_phase") || ""),
    address_package: String(r.get("address_package") || ""),
    address_block: String(r.get("address_block") || ""),
    address_lot: String(r.get("address_lot") || ""),
    preferred_lane: String(r.get("preferred_lane") || ""),
    team_intent: String(r.get("team_intent") || ""),
    preferred_team_name: preferredTeamName,
    status: String(r.get("status") || ""),
    consent_version: String(r.get("consent_version") || ""),
    consent_accepted_at: String(r.get("consent_accepted_at") || ""),
    created: String(r.get("created") || ""),
  };
}

module.exports = {
  enforceCreateGuards,
  emailAvailable,
  lookupByStatusCode,
};
