var LANE_OK = {
  mid: true,
  gold: true,
  exp: true,
  support: true,
  jungle: true,
};

var GUEST_HIDDEN_FIELDS = [
  "email",
  "ign",
  "birthdate",
  "contact_number",
  "user_id",
  "server_id",
  "address_phase",
  "address_package",
  "address_block",
  "address_lot",
  "role_rankings",
  "performance_basis",
  "team_intent",
  "preferred_team",
  "preferred_team_name",
  "registration_status",
  "registration_reject_reason",
  "registration_status_code",
  "consent_version",
  "school_id_front",
  "school_id_back",
  "purok_endorsement",
  "created_by",
  "updated_by",
  "consent_accepted_at",
];

function isStaff(e) {
  try {
    const info = typeof e.requestInfo === "function" ? e.requestInfo() : null;
    const auth = (info && info.auth) || e.auth;
    if (!auth) return false;
    if (auth.id) return true;
    if (typeof auth.getId === "function" && auth.getId()) return true;
  } catch (err) {
    console.log("[sk-participants] auth check failed", err);
  }
  return false;
}

function coerceLane(value) {
  const s = String(value || "")
    .trim()
    .toLowerCase();
  return LANE_OK[s] ? s : "";
}

function lanesFromValue(val) {
  if (val == null || val === "") return [];
  if (typeof val === "string") {
    const t = val.trim();
    if (!t) return [];
    if (t.charAt(0) === "[") {
      try {
        const parsed = JSON.parse(t);
        return Array.isArray(parsed) ? lanesFromValue(parsed) : [];
      } catch (err) {
        const one = coerceLane(t);
        return one ? [one] : [];
      }
    }
    if (t.indexOf(",") >= 0) {
      const parts = t.split(",");
      const out = [];
      for (let i = 0; i < parts.length; i++) {
        const one = coerceLane(parts[i]);
        if (one) out.push(one);
      }
      return out;
    }
    const one = coerceLane(t);
    return one ? [one] : [];
  }
  if (Array.isArray(val)) {
    const out = [];
    for (let i = 0; i < val.length; i++) {
      const one = coerceLane(val[i]);
      if (one) out.push(one);
    }
    return out;
  }
  return [];
}

function lanesOf(record) {
  const fromRoles = lanesFromValue(record.get("preferred_roles"));
  if (fromRoles.length) return fromRoles;
  return lanesFromValue(record.get("preferred_lane"));
}

function isGuestVisibleRoster(record) {
  if (!record) return false;
  if (record.get("archived") === true) return false;
  if (String(record.get("status") || "") !== "assigned") return false;
  if (!String(record.get("team") || "").trim()) return false;
  if (String(record.get("registration_status") || "") !== "approved") {
    return false;
  }
  return true;
}

function hideGuestFields(record) {
  if (!record || typeof record.hide !== "function") return;
  try {
    record.hide.apply(record, GUEST_HIDDEN_FIELDS);
  } catch (err) {
    console.log("[sk-participants] hide failed", err);
  }
}

function stripGuestList(e) {
  e.next();
  if (isStaff(e)) return;

  const records = e.records || [];
  const visible = [];
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    if (!isGuestVisibleRoster(row)) continue;
    hideGuestFields(row);
    visible.push(row);
  }
  e.records = visible;
  if (e.result) {
    e.result.items = visible;
  }
}

function hideGuestView(e) {
  if (!isStaff(e) && !isGuestVisibleRoster(e.record)) {
    throw new NotFoundError("Participant not found");
  }
  e.next();
  if (!isStaff(e)) {
    hideGuestFields(e.record);
  }
}

function publicRoster(app, tournamentId) {
  let teams;
  try {
    teams = app.findRecordsByFilter(
      "teams",
      'tournament = {:tid} && archived != true && status != "inactive"',
      "name",
      200,
      0,
      { tid: tournamentId },
    );
  } catch (err) {
    console.log("[sk-participants] roster teams query failed", err);
    throw new BadRequestError("Could not load roster.");
  }

  let participants;
  try {
    participants = app.findRecordsByFilter(
      "participants",
      'tournament = {:tid} && archived != true && status = "assigned" && team != "" && registration_status = "approved"',
      "name",
      500,
      0,
      { tid: tournamentId },
    );
  } catch (err) {
    console.log("[sk-participants] roster players query failed", err);
    throw new BadRequestError("Could not load roster.");
  }

  const byTeam = {};
  for (let i = 0; i < (participants || []).length; i++) {
    const p = participants[i];
    const teamId = String(p.get("team") || "").trim();
    if (!teamId) continue;
    if (!byTeam[teamId]) byTeam[teamId] = [];
    byTeam[teamId].push({
      id: String(p.id || ""),
      name: String(p.get("name") || "").trim() || "Unnamed",
      lanes: lanesOf(p),
    });
  }

  const items = [];
  for (let i = 0; i < (teams || []).length; i++) {
    const team = teams[i];
    const id = String(team.id || "");
    if (!id) continue;
    const players = byTeam[id] || [];
    if (!players.length) continue;
    items.push({
      id: id,
      name: String(team.get("name") || "").trim() || "Unnamed team",
      players: players,
    });
  }

  return items;
}

module.exports = {
  stripGuestList,
  hideGuestView,
  publicRoster,
};
