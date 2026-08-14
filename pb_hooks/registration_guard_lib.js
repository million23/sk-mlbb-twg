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

var ELIGIBLE_PHASES = { "4": true, "9": true, "10": true };

/** DateTime.string() / ISO / date-only → comparable string. */
function dateFieldToString(raw) {
  if (raw == null) return "";
  if (typeof raw === "object") {
    try {
      if (typeof raw.string === "function") {
        return String(raw.string()).trim();
      }
    } catch (err) {}
  }
  return String(raw).trim();
}

/** Prefer calendar date prefix (avoids TZ day-shift). */
function dayFromDateField(raw) {
  const s = dateFieldToString(raw);
  if (!s) return "";
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (m) return m[1];
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + mo + "-" + day;
  } catch (err) {
    return "";
  }
}

/** Age-check day: tournament start, else registration window end/start. */
function resolveTournamentDayFromRecord(tournament) {
  if (!tournament) return "";
  return (
    dayFromDateField(tournament.get("start_at")) ||
    dayFromDateField(tournament.get("registration_close_at")) ||
    dayFromDateField(tournament.get("registration_open_at")) ||
    ""
  );
}

/** Calendar age on tournament day (YYYY-MM-DD). Null if invalid. */
function ageOnTournamentDay(birthdate, tournamentDay) {
  const b = dayFromDateField(birthdate);
  const day = dayFromDateField(tournamentDay);
  if (!b || !day) return null;
  const birth = new Date(b + "T00:00:00");
  const td = new Date(day + "T00:00:00");
  if (isNaN(birth.getTime()) || isNaN(td.getTime())) return null;
  let age = td.getFullYear() - birth.getFullYear();
  const m = td.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && td.getDate() < birth.getDate())) age -= 1;
  return age;
}

/**
 * Phase 4/9/10 + age 15+ on tournament day. Applies to all creates
 * (public + admin) so API bypass cannot skip eligibility.
 */
function enforceEligibilityGuards(e) {
  const tournamentId = String(e.record.get("tournament") || "").trim();
  if (!tournamentId) {
    throw new BadRequestError("Tournament is required");
  }

  let tournament;
  try {
    tournament = e.app.findRecordById("tournaments", tournamentId);
  } catch (err) {
    console.log("[sk-guard] tournament lookup failed", err);
    throw new BadRequestError("Tournament not found");
  }

  const tournamentDay = resolveTournamentDayFromRecord(tournament);
  if (!tournamentDay) {
    throw new BadRequestError(
      "Tournament date is missing — set start_at on the tournament.",
    );
  }

  const phase = String(e.record.get("address_phase") || "").trim();
  if (!ELIGIBLE_PHASES[phase]) {
    throw new BadRequestError("Phase must be 4, 9, or 10");
  }

  const birthdate = e.record.get("birthdate");
  const age = ageOnTournamentDay(birthdate, tournamentDay);
  if (age === null) {
    throw new BadRequestError("Invalid birthdate");
  }
  if (age < 15) {
    throw new BadRequestError(
      "Must be 15+ on tournament day (age on " +
        tournamentDay +
        ": " +
        age +
        ")",
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

  enforceEligibilityGuards(e);

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

  ensureFormingTeamForCreateIntent(e);
}

/**
 * Create-team registration: find or create a forming teams row and link
 * preferred_team so committee can verify immediately. Players stay pending /
 * unassigned until approve.
 */
function ensureFormingTeamForCreateIntent(e) {
  const intent = String(e.record.get("team_intent") || "");
  if (intent !== "create_team") return;

  const teamName = String(e.record.get("preferred_team_name") || "").trim();
  if (!teamName) {
    throw new BadRequestError("Team name is required when creating a team");
  }
  e.record.set("preferred_team_name", teamName);

  const tournamentId = String(e.record.get("tournament") || "").trim();
  if (!tournamentId) {
    throw new BadRequestError("Tournament is required");
  }

  if (String(e.record.get("preferred_team") || "").trim()) return;

  const key = teamName.toLowerCase();
  let team = null;
  try {
    const teams = e.app.findRecordsByFilter(
      "teams",
      "tournament = {:tid} && archived != true",
      "-created",
      500,
      0,
      { tid: tournamentId },
    );
    for (let i = 0; i < (teams || []).length; i++) {
      const t = teams[i];
      const n = String(t.get("name") || "")
        .trim()
        .toLowerCase();
      if (n === key) {
        team = t;
        break;
      }
    }
  } catch (err) {
    console.log("[sk-guard] team lookup failed", err);
    throw new BadRequestError("Could not reserve team name. Try again.");
  }

  if (!team) {
    try {
      const collection = e.app.findCollectionByNameOrId("teams");
      team = new Record(collection);
      team.set("tournament", tournamentId);
      team.set("name", teamName);
      team.set("status", "forming");
      team.set("archived", false);
      e.app.save(team);
      console.log(
        "[sk-guard] created forming team",
        String(team.id || ""),
        teamName,
      );
    } catch (err) {
      console.log("[sk-guard] team create failed", err);
      throw new BadRequestError("Could not create team. Try again.");
    }
  }

  e.record.set("preferred_team", team.id);
}

function emailAvailable(app, tournamentId, email) {
  return !hasActiveDuplicate(
    app,
    'tournament = {:tid} && email = {:email} && (registration_status = "pending" || registration_status = "approved")',
    { tid: tournamentId, email: email },
  );
}

/**
 * Public join-team list. Hides forming teams that only exist as create-team
 * registration placeholders (preferred_team links, nobody assigned yet).
 */
function listedJoinableTeams(app, tournamentId) {
  let teams;
  try {
    teams = app.findRecordsByFilter(
      "teams",
      'tournament = {:tid} && archived = false && status != "inactive"',
      "name",
      200,
      0,
      { tid: tournamentId },
    );
  } catch (err) {
    console.log("[sk-guard] listed teams query failed", err);
    throw new BadRequestError("Could not load teams. Try again.");
  }

  let participants;
  try {
    participants = app.findRecordsByFilter(
      "participants",
      'tournament = {:tid} && archived != true && (team_intent = "create_team" || status = "assigned")',
      "-created",
      500,
      0,
      { tid: tournamentId },
    );
  } catch (err) {
    console.log("[sk-guard] listed teams peers query failed", err);
    throw new BadRequestError("Could not load teams. Try again.");
  }

  const items = [];
  for (let i = 0; i < (teams || []).length; i++) {
    const team = teams[i];
    const teamId = String(team.id || "");
    if (!teamId) continue;
    const status = String(team.get("status") || "");

    if (status === "forming") {
      let assigned = false;
      let pendingCreatePlaceholder = false;
      for (let j = 0; j < (participants || []).length; j++) {
        const p = participants[j];
        if (
          String(p.get("team") || "") === teamId &&
          String(p.get("status") || "") === "assigned"
        ) {
          assigned = true;
          break;
        }
        if (
          String(p.get("preferred_team") || "") === teamId &&
          String(p.get("team_intent") || "") === "create_team" &&
          (String(p.get("registration_status") || "") === "pending" ||
            String(p.get("registration_status") || "") === "approved")
        ) {
          pendingCreatePlaceholder = true;
        }
      }
      if (!assigned && pendingCreatePlaceholder) continue;
    }

    items.push({
      id: teamId,
      name: String(team.get("name") || ""),
    });
  }

  return items;
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
    preferred_lane: Array.isArray(r.get("preferred_lane")) ? r.get("preferred_lane").join(",") : String(r.get("preferred_lane") || ""),
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
  enforceEligibilityGuards,
  ensureFormingTeamForCreateIntent,
  emailAvailable,
  listedJoinableTeams,
  lookupByStatusCode,
  dayFromDateField,
  resolveTournamentDayFromRecord,
  ageOnTournamentDay,
};
