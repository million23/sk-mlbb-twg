/// <reference path="../pb_data/types.d.ts" />

/**
 * Hide draft matches from guests.
 * Helpers in sk_matches_lib.js — require inside handlers.
 * PocketHost isolates *.pb.js top-level functions (isStaffAuth is not defined).
 */

onRecordsListRequest((e) => {
  const matches = require(`${__hooks}/sk_matches_lib.js`);
  matches.stripDraftsFromList(e);
}, "matches");

onRecordViewRequest((e) => {
  const matches = require(`${__hooks}/sk_matches_lib.js`);
  matches.hideDraftView(e);
}, "matches");
