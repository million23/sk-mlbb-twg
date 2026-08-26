/// <reference path="../pb_data/types.d.ts" />

/**
 * Public registration guards.
 * Helpers live in registration_guard_lib.js (require inside handlers —
 * PocketHost isolates *.pb.js top-level functions).
 *
 * Env on PocketHost: TURNSTILE_SECRET_KEY
 * Optional: TURNSTILE_SKIP=1
 */

onRecordCreateRequest((e) => {
  const guard = require(`${__hooks}/registration_guard_lib.js`);
  guard.enforceCreateGuards(e);
  // Participant row is committed after next(). Captain is a relation to
  // that row — setting it on the team before this fails / gets dropped.
  e.next();
  guard.assignCreateTeamCaptainAfterCreate(e);
}, "participants");

routerAdd("GET", "/sk/registration/email-available", (e) => {
  const guard = require(`${__hooks}/registration_guard_lib.js`);
  const q = e.request.url.query();
  const tournamentId = String(q.get("tournament") || "").trim();
  const email = String(q.get("email") || "")
    .trim()
    .toLowerCase();

  if (!tournamentId || !email || email.indexOf("@") < 0) {
    throw new BadRequestError("tournament and email are required");
  }

  return e.json(200, {
    available: guard.emailAvailable(e.app, tournamentId, email),
  });
});

/** Public receipt lookup by 6-digit status code (no document files). */
routerAdd("GET", "/sk/registration/status", (e) => {
  const guard = require(`${__hooks}/registration_guard_lib.js`);
  const q = e.request.url.query();
  const code = String(q.get("code") || "").trim();

  if (!/^\d{6}$/.test(code)) {
    throw new BadRequestError("Enter a valid 6-digit status code");
  }

  const receipt = guard.lookupByStatusCode(e.app, code);
  if (!receipt) {
    return e.json(200, { found: false });
  }

  return e.json(200, { found: true, receipt: receipt });
});

/** Public join-team list (hides pending create-team placeholders). */
routerAdd("GET", "/sk/registration/listed-teams", (e) => {
  const guard = require(`${__hooks}/registration_guard_lib.js`);
  const q = e.request.url.query();
  const tournamentId = String(q.get("tournament") || "").trim();

  if (!tournamentId) {
    throw new BadRequestError("tournament is required");
  }

  return e.json(200, {
    items: guard.listedJoinableTeams(e.app, tournamentId),
  });
});
