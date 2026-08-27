/// <reference path="../pb_data/types.d.ts" />

/**
 * Guests cannot list or view draft matches.
 * Staff (admins collection auth) still see drafts in the committee app.
 *
 * PocketBase `matches.status` select must include `draft`.
 */
function isStaffAuth(e) {
  return Boolean(e.auth && e.auth.id);
}

function hideDraftsFilter(existing) {
  const extra = 'status != "draft"';
  if (existing && String(existing).trim()) {
    return "(" + existing + ") && (" + extra + ")";
  }
  return extra;
}

onRecordsListRequest((e) => {
  if (!isStaffAuth(e)) {
    e.filter = hideDraftsFilter(e.filter);
  }
  e.next();
}, "matches");

onRecordViewRequest((e) => {
  if (
    !isStaffAuth(e) &&
    e.record &&
    String(e.record.get("status") || "") === "draft"
  ) {
    throw new NotFoundError("Match not found");
  }
  e.next();
}, "matches");
