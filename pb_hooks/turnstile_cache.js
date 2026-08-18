/**
 * Remember a Turnstile token after one successful Cloudflare siteverify.
 *
 * Create-team registration POSTs once per teammate with the same widget token.
 * Cloudflare tokens are single-use (`timeout-or-duplicate` on replay), so the
 * hook reuses a verified token for a short window instead of calling siteverify
 * again.
 */

var TTL_MS = 5 * 60 * 1000;
var MAX_USES = 6;
var store = {};

function keyFor(token, remoteIp) {
  return String(remoteIp || "") + "\0" + String(token || "");
}

function prune(now) {
  for (var k in store) {
    if (!Object.prototype.hasOwnProperty.call(store, k)) continue;
    if (!store[k] || store[k].expiresAt <= now) delete store[k];
  }
}

function remember(token, remoteIp, now) {
  if (!token) return;
  prune(now);
  store[keyFor(token, remoteIp)] = {
    expiresAt: now + TTL_MS,
    uses: 1,
  };
}

function acceptTurnstile(opts) {
  var token = opts && opts.token ? String(opts.token) : "";
  var remoteIp = opts && opts.remoteIp ? String(opts.remoteIp) : "";
  var now = opts && opts.now != null ? opts.now : Date.now();
  var verify = opts && opts.verify;
  if (!token) return false;
  prune(now);
  var row = store[keyFor(token, remoteIp)];
  if (row && row.expiresAt > now) {
    if (row.uses >= MAX_USES) return false;
    row.uses += 1;
    return true;
  }
  if (typeof verify !== "function" || !verify()) return false;
  remember(token, remoteIp, now);
  return true;
}

function resetForTests() {
  store = {};
}

module.exports = {
  TTL_MS: TTL_MS,
  MAX_USES: MAX_USES,
  remember: remember,
  acceptTurnstile: acceptTurnstile,
  resetForTests: resetForTests,
};
