/// <reference path="../pb_data/types.d.ts" />

/**
 * Public roster: name + lanes only.
 * Do not open the full participants collection to guests.
 * Helpers in sk_participants_lib.js — require inside handlers.
 */

onRecordsListRequest((e) => {
  const participants = require(`${__hooks}/sk_participants_lib.js`);
  participants.stripGuestList(e);
}, "participants");

onRecordViewRequest((e) => {
  const participants = require(`${__hooks}/sk_participants_lib.js`);
  participants.hideGuestView(e);
}, "participants");

routerAdd("GET", "/sk/public/roster", (e) => {
  const participants = require(`${__hooks}/sk_participants_lib.js`);
  const q = e.request.url.query();
  const tournamentId = String(q.get("tournament") || "").trim();

  if (!tournamentId) {
    throw new BadRequestError("tournament is required");
  }

  return e.json(200, {
    teams: participants.publicRoster(e.app, tournamentId),
  });
});
