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
  e.next();
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
