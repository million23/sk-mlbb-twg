function isStaff(e) {
  try {
    const info = typeof e.requestInfo === "function" ? e.requestInfo() : null;
    const auth = (info && info.auth) || e.auth;
    if (!auth) return false;
    if (auth.id) return true;
    if (typeof auth.getId === "function" && auth.getId()) return true;
  } catch (err) {
    console.log("[sk-matches] auth check failed", err);
  }
  return false;
}

function isDraft(record) {
  return record && String(record.get("status") || "") === "draft";
}

function stripDraftsFromList(e) {
  e.next();
  if (isStaff(e)) return;

  const records = e.records || [];
  const visible = [];
  for (let i = 0; i < records.length; i++) {
    if (!isDraft(records[i])) visible.push(records[i]);
  }
  e.records = visible;
  if (e.result) {
    e.result.items = visible;
  }
}

function hideDraftView(e) {
  if (!isStaff(e) && isDraft(e.record)) {
    throw new NotFoundError("Match not found");
  }
  e.next();
}

module.exports = {
  stripDraftsFromList,
  hideDraftView,
};
