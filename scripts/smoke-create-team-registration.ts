/**
 * Smoke-test create-team public registration against PocketBase.
 *
 * Usage (from repo root):
 *   bun run scripts/smoke-create-team-registration.ts
 *
 * Required env:
 *   VITE_POCKETHOST_URL   — e.g. https://pb.example.com
 *   SMOKE_TOURNAMENT_ID   — open tournament id
 *
 * Optional:
 *   SMOKE_TEAM_SIZE=2     — 2–6 (default 2)
 *   SMOKE_TEAM_NAME=…     — preferred team name (default Smoke Squad <timestamp>)
 *   SMOKE_EMAIL_BASE=chavezgerald23@gmail.com
 *     → players use plus-aliases: chavezgerald23+smoke<stamp>p0@gmail.com
 *   VITE_TURNSTILE_SITE_KEY — ignored; server must allow create (TURNSTILE_SKIP=1 on PB for smoke)
 *
 * Creates N pending participants with unique emails/docs. Does not approve them.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv() {
	const path = resolve(process.cwd(), ".env");
	if (!existsSync(path)) return;
	const text = readFileSync(path, "utf8");
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eq = trimmed.indexOf("=");
		if (eq < 0) continue;
		const key = trimmed.slice(0, eq).trim();
		let val = trimmed.slice(eq + 1).trim();
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			val = val.slice(1, -1);
		}
		if (process.env[key] === undefined) process.env[key] = val;
	}
}

loadDotEnv();

const base = (process.env.VITE_POCKETHOST_URL || "").replace(/\/$/, "");
const tournamentId = (process.env.SMOKE_TOURNAMENT_ID || "").trim();
const teamSize = Math.min(
	6,
	Math.max(2, Number(process.env.SMOKE_TEAM_SIZE || "2") || 2),
);
const stamp = Date.now();
const teamName =
	(process.env.SMOKE_TEAM_NAME || "").trim() || `Smoke Squad ${stamp}`;
const emailBase = (
	process.env.SMOKE_EMAIL_BASE || "chavezgerald23@gmail.com"
).trim();

function smokeEmail(index: number): string {
	const at = emailBase.lastIndexOf("@");
	if (at < 1) {
		throw new Error(`Invalid SMOKE_EMAIL_BASE: ${emailBase}`);
	}
	const local = emailBase.slice(0, at);
	const domain = emailBase.slice(at + 1);
	// Gmail plus-alias so all receipts land in the same inbox.
	return `${local}+smoke${stamp}p${index}@${domain}`;
}

if (!base) {
	console.error("Missing VITE_POCKETHOST_URL");
	process.exit(1);
}
if (!tournamentId) {
	console.error("Missing SMOKE_TOURNAMENT_ID");
	process.exit(1);
}

/** Minimal 1×1 PNG */
const PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
	"base64",
);

function statusCode() {
	return String(Math.floor(100000 + Math.random() * 900000));
}

async function createPlayer(index: number) {
	const email = smokeEmail(index);
	const code = statusCode();
	const form = new FormData();
	form.append("tournament", tournamentId);
	form.append("name", `Smoke Player ${index + 1}`);
	form.append("email", email);
	form.append("ign", `SmokeIGN${index + 1}`);
	form.append("birthdate", "2008-01-15 00:00:00.000Z");
	form.append("user_id", `smoke${stamp}${index}`);
	form.append("server_id", "2001");
	form.append("address_phase", index === 0 ? "9" : "4");
	form.append("address_package", "1");
	form.append("address_block", "2");
	form.append("address_lot", "3");
	form.append("preferred_lane", "mid");
	form.append("preferred_roles", "mid");
	form.append("status", "unassigned");
	form.append("registration_status", "pending");
	form.append("archived", "false");
	form.append("registration_status_code", code);
	form.append("team_intent", "create_team");
	form.append("preferred_team_name", teamName);
	form.append("consent_version", "sk-ta-2026-08");
	form.append("consent_accepted_at", new Date().toISOString());
	form.append(
		"school_id_front",
		new Blob([PNG], { type: "image/png" }),
		"front.png",
	);
	form.append(
		"school_id_back",
		new Blob([PNG], { type: "image/png" }),
		"back.png",
	);
	form.append(
		"purok_endorsement",
		new Blob([PNG], { type: "image/png" }),
		"endorsement.png",
	);

	const qs = new URLSearchParams({
		website: "",
		app_origin: "http://localhost:1023",
	});
	const url = `${base}/api/collections/participants/records?${qs}`;
	const res = await fetch(url, { method: "POST", body: form });
	const body = await res.json().catch(() => null);
	if (!res.ok) {
		throw new Error(
			`Player ${index + 1} failed (${res.status}): ${JSON.stringify(body)}`,
		);
	}
	return {
		email,
		statusCode:
			(body && body.registration_status_code) || code,
		id: body && body.id,
		preferredTeam: body && body.preferred_team,
	};
}

console.log(`Smoke create-team → ${base}`);
console.log(`Tournament ${tournamentId} · ${teamSize} players · "${teamName}"`);

const results = [];
for (let i = 0; i < teamSize; i++) {
	const row = await createPlayer(i);
	results.push(row);
	console.log(
		`  ✓ player ${i + 1}: ${row.email} code=${row.statusCode} preferred_team=${row.preferredTeam || "—"}`,
	);
}

const teamFilter = encodeURIComponent(
	`tournament = "${tournamentId}" && archived != true`,
);
const teamsRes = await fetch(
	`${base}/api/collections/teams/records?page=1&perPage=200&filter=${teamFilter}`,
);
const teamsBody = await teamsRes.json().catch(() => null);
if (!teamsRes.ok) {
	throw new Error(
		`Team list failed (${teamsRes.status}): ${JSON.stringify(teamsBody)}`,
	);
}
const key = teamName.trim().toLowerCase();
const team = (teamsBody?.items || []).find(
	(t) => String(t?.name || "").trim().toLowerCase() === key,
);
if (!team?.id) {
	throw new Error(
		`Expected forming team "${teamName}" in teams table after register (redeploy pb_hooks?).`,
	);
}
console.log(`  ✓ team row: ${team.id} status=${team.status} name="${team.name}"`);

const linked = results.every(
	(r) => r.preferredTeam && r.preferredTeam === team.id,
);
if (!linked) {
	throw new Error(
		"Expected each registrant preferred_team to match the forming team id.",
	);
}

console.log("\nDone. Pending registrants + forming team created:");
for (const r of results) {
	console.log(`  ${r.statusCode}  ${r.email}  id=${r.id}`);
}
console.log(
	"\nApprove all peers in admin to assign them onto this team.",
);
