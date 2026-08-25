# SK 176‑E MLBB Tournament — User Manual

Manual for the **Barangay 176-E Mobile Legends** tournament site and committee tracker (Sangguniang Kabataan 176‑E, with PINTIG and volunteers).

Use this if you are:

- a **player** signing up or checking status
- **committee staff** reviewing registrations, building teams, and running matches
- a **superadmin** creating the tournament and committee accounts

---

## Contents

1. [How the event is structured](#1-how-the-event-is-structured)
2. [Public site](#2-public-site)
3. [Player registration](#3-player-registration)
4. [Verify registration](#4-verify-registration)
5. [Watching tournaments and matches](#5-watching-tournaments-and-matches)
6. [Committee sign-in](#6-committee-sign-in)
7. [Roles and permissions](#7-roles-and-permissions)
8. [Dashboard](#8-dashboard)
9. [Tournaments](#9-tournaments)
10. [Participants](#10-participants)
11. [Teams](#11-teams)
12. [Matches](#12-matches)
13. [Team standing](#13-team-standing)
14. [Committee admins](#14-committee-admins)
15. [Suggested runbook](#15-suggested-runbook)
16. [Words we use](#16-words-we-use)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. How the event is structured

**One tournament** for this SK event — not four separate tournaments.

That one tournament’s elimination is split into **four brackets** (Bracket A, B, C, D). Pairings stay inside a bracket until teams advance to **playoffs**.

Typical full field:

| Piece | Default |
| --- | --- |
| Tournaments | 1 |
| Brackets | 4 (A–D) |
| Teams per bracket | up to 16 |
| Full field | 64 teams |
| Squad size | 5 mains + 1 backup (6 total) |
| Default series | Best of 3 |

Auto-match needs a **multiple of 4** teams so the four brackets stay even (for example 16, 32, 48, or 64).

The admin app can store more than one tournament record (drafts, past seasons). For this SK cup, run **one live tournament**.

```txt
Players register
    → committee approves
    → teams form (named squads, join listed, or open matching)
    → Auto matches → Round 1 in 4 brackets
    → Score & winner for every match
    → Advance winners → next round
    → when each bracket is down to 2 teams → Playoff quarterfinals
    → continue until a champion
```

---

## 2. Public site

Open the site in a browser (phone or desktop). The header has:

| Link | What it does |
| --- | --- |
| Home | Landing page, eligibility, how to sign up |
| Tournaments | Public list of events |
| About | Organizers, PINTIG / SK leaders, supporting cast |
| Verify registration | Look up a 6-digit status code |
| Register | Start the sign-up wizard |

Theme (light / dark) is in the header. The site is built for phones first.

**Eligibility (public copy):**

- At least **15 years old** on tournament day
- Lives in Bagong Silang **Phase 4, 9, 10A, or 10B** (the form stores phase as 4, 9, or 10)
- Solo or squad: open matching, join a listed team, or create a named team

Registration is only available when a tournament has registration **enabled** and the window is **open**.

---

## 3. Player registration

Path: **Register**.

If no tournament is open, the form stays closed. If more than one is open, pick the event first.

### 3.1 Choose a team path

Do this **before** consent.

| Choice | Meaning |
| --- | --- |
| **Open matching** | Register alone. After approval you stay unassigned until the committee runs **Auto teams** or **Quick team**. |
| **Join a listed team** | Pick an existing team the committee (or another squad) already named. |
| **Create / name a team** | Name a squad and register **2–6** teammates in one session (capped by the tournament max, usually 6). |

A team **should** include at least one Phase 9 resident. A Phase 9 resident as **team captain** is preferred but **not required**. Those rules are **guidance only** — the form and approve button do not block them.

### 3.2 Consent (T&A)

Read the SK terms and agreement. You must accept before credentials unlock. Acceptance is recorded with the consent version.

### 3.3 Credentials

Each person (or each teammate in a create-team batch) enters:

- Full name
- Email (contact only — not a login)
- In-game name (IGN)
- Birthdate (age is checked against **tournament day**)
- MLBB user ID and server ID
- Home address: **Phase, Package, Block, Lot** (not a free-form street)
- Preferred lanes (up to 3): Mid, Gold, Exp, Support, Jungle
- Philippine mobile number

**Email rule:** one email may hold only **one pending or approved** registration per tournament, any team path.

Create-team: fill credentials (and later documents) for **each** teammate, then review once.

### 3.4 Documents

Required for each registrant:

1. Valid ID or school ID, **front**
2. Valid ID or school ID, **back**

**Purok endorsement** is optional at sign-up. If they skip it, approval is **conditional**. They must present the endorsement at the tournament.

Allowed files: JPG, PNG, WebP, HEIC, or PDF, **5 MiB or smaller** each.

### 3.5 Review and submit

Check the summary, then submit. You get a **6-digit status code** (create-team: one code **per teammate**). The same code is emailed.

Save the code. Use it on **Verify registration**. There is no player account.

A Turnstile check may appear if the site is configured for it.

---

## 4. Verify registration

Path: **Verify registration**.

Enter the 6-digit code (from the receipt or email). You can also open a link with `?code=123456`.

| Status | Meaning |
| --- | --- |
| **Pending** | Committee is still checking credentials and documents |
| **Approved** | Cleared as a participant; wait for team and schedule updates |
| **Rejected** | Not approved; the reason is shown when the committee entered one |

The receipt shows name, IGN, address, lanes, team path, and tournament title. It does **not** log the player into admin.

---

## 5. Watching tournaments and matches

Path: **Tournaments**.

Public events are listed with status, venue, schedule, and whether registration is open. Open an event to see matches (round, teams, score, winner). Completed matches can show per-player lane stats when staff have entered them.

Statuses you may see: Draft, Upcoming, Live, Completed, Archived.

---

## 6. Committee sign-in

Path: `/app/auth/login` (committee only).

Sign in with the email and password issued by a superadmin. Password must be 8–32 characters.

After login you land on the **Dashboard**. Use the sidebar to move around. The tournament picker in the sidebar sets which event Participants, Teams, Matches, and Standing apply to.

Sign out from the account menu at the bottom of the sidebar. Light/dark theme is there too.

---

## 7. Roles and permissions

| | **Staff** | **Superadmin** |
| --- | --- | --- |
| Dashboard, overview, participants, teams, matches, standing | Yes | Yes |
| Approve / reject players, build teams, run matches | Yes | Yes |
| Create / edit / archive **tournaments** | No | Yes |
| Create / edit / delete **admin accounts** | View list only | Yes |
| Audit log | No | Page exists (placeholder) |
| Inactive account | Cannot use the app | Cannot use the app |

You cannot delete your own admin account.

---

## 8. Dashboard

Lists tournaments with status, venue, dates, and whether registration is open. Open an event to resume that tournament’s workspace.

---

## 9. Tournaments

Path: **Tournaments** (platform list). Superadmin creates and edits; staff can view and open an event.

### 9.1 Create the SK event (superadmin)

Use **Add tournament**. Typical fields:

| Field | Typical SK value |
| --- | --- |
| Title | Event name shown publicly |
| Slug | URL-friendly id (filled from the title) |
| Description / venue | Optional |
| Start / end | Tournament window |
| Status | `draft` → `upcoming` → `live` → `completed` |
| Registration enabled | On when sign-ups should be possible |
| Registration open / close | Window for the public form |
| Max teams | Optional cap |
| Min / max team size | Usually **5 / 6** |
| Match best-of | Usually **3** |
| Bracket count | **4** (default) |

Set status to **upcoming** or **live** and turn registration on when you want the public Register button to work.

Only **one** tournament is needed for this cup. Four brackets are created later on the Matches page, not as four tournament records.

### 9.2 Overview

Opening a tournament shows counts (pending, approved, teams), registration window, charts, and shortcuts to Participants, Teams, and Matches.

---

## 10. Participants

Path: tournament → **Participants**.

Tabs: All, Pending, Approved, Rejected, plus Archived. Search by name, IGN, email, status code, or address. Export a spreadsheet when you need a sheet for the hall.

### 10.1 Review a registrant

Open a row. Check:

- Age 15+ on tournament day
- Phase 4, 9, or 10
- Documents (ID front/back). Purok endorsement optional. If missing, approve is conditional and they present it at the tournament.
- Team path (open matching / join listed / create team)
- Email and IGN

### 10.2 Approve

Approve only while status is **pending**. The app blocks approve if age or phase fails, or if join/create-team data is incomplete.

What happens next:

| Team path | After approve |
| --- | --- |
| **Open matching** | Participant, no team yet. Use **Auto teams** or **Quick team** later. |
| **Join listed team** | Assigned to that team if it still exists. |
| **Create / name team** | A `forming` team is created (or reused) when teammates sharing that name are approved. If some are still pending, the team appears after the rest are approved. |

You can also add a participant by hand (walk-ins) with **Add participant**.

### 10.3 Reject

Enter a reason. The player sees it on Verify. Rejected people are not in the match pool.

### 10.4 Other actions

Edit credentials, replace documents, archive, restore. After approve you can still form/join a team from the detail sheet if assignment did not finish automatically.

---

## 11. Teams

Path: tournament → **Teams**.

Statuses:

| Status | Meaning |
| --- | --- |
| **Forming** | Named / assembling; not a full ready squad yet |
| **Ready** | Enough members (at the tournament min, usually 5) |
| **Incomplete** | Below ready size |
| **Inactive** | Left out of auto-match |
| **Archived** | Hidden from the active list |

### 11.1 Auto teams (open matching)

After you have approved open-matching players:

1. Open **Auto teams** (sometimes labeled around open matching).
2. The app packs **lane-balanced squads of 5** (Mid, Gold, Exp, Support, Jungle).
3. Confirm. Teams are named like **Open Match 1**, **Open Match 2**, …
4. Leftovers (not enough for a full five-lane squad) stay unassigned — use **Quick team**.

Only **approved**, unassigned, open-matching players who are not inactive are in this pool.

### 11.2 Quick team

Manually name a team, pick a captain, and tick unassigned players (up to 6). Useful for leftovers and last-minute squads.

### 11.3 Manual teams

**Add team** for a named squad (captain, status). Open a team to add or remove members, archive, or restore.

Create-team registrations already produce a forming row when teammates are approved — you usually only need to confirm roster size and mark **ready**.

### 11.4 Before you generate matches

- Mark squads **ready** when they should play
- Set unused teams **inactive** or archive them so they are skipped
- Team count for auto-match must be a **multiple of 4**

Export teams to a spreadsheet if you need a printed roster.

---

## 12. Matches

Path: tournament → **Matches**.

This is the live operations page: generate the bracket, enter scores, advance winners, and record player stats.

### 12.1 Auto matches (Round 1)

1. Confirm ready teams (multiple of 4).
2. Click **Auto matches**.
3. Preview: teams shuffled into **Bracket A–D**, then paired **inside** each bracket.
4. Reshuffle if the draw looks wrong.
5. Confirm. Round 1 matches are created as **scheduled**.

You do **not** create four tournaments. All four brackets belong to this one event.

If the team count is not a multiple of 4, generation is refused.

### 12.2 Add or edit a match

**Add match** for a manual slot (label, round, order, best-of, two teams, status, notes). Edit the same fields later. Archive a match to remove it from the active list (needed before regenerating a round).

Match statuses: **Scheduled**, **Live**, **Completed**, **Walkover**, **Cancelled**.

### 12.3 Score & winner

For every finished match:

1. Open **Score & winner**.
2. Enter game scores (e.g. 2–1 in a BO3).
3. Pick the **winner**.
4. Save. Status becomes completed (or set **walkover** if one side did not play).

Advance winners **requires** every match in the current round to be **completed** or **walkover** **and** have a winner.

### 12.4 Advance winners

Use this after a round is fully scored — not before.

1. Click **Advance winners**.
2. The app picks the current source round (Round 1, then Round 2, and so on).
3. Preview the next pairings. Reshuffle if needed.
4. Confirm.

Winners stay in their bracket until playoffs.

| When this round is done | What gets created |
| --- | --- |
| Round 1 | Round 2 (still inside A–D) |
| Round 2 | Semifinals (still inside A–D) |
| Each bracket down to **2 teams** | **Playoff quarterfinals** (cross-bracket; same-bracket rematches are avoided) |

Example with 16 teams per bracket:

- Round 1 — 8 matches per bracket
- Advance → Round 2 — 4 matches per bracket
- Advance → Semifinals — 2 matches per bracket
- Advance → Quarterfinals — 8 playoff teams (2 from each bracket)

If a bracket has an odd number of winners, one team is listed as **left out** of that pairing (bye). Check the preview.

**Common errors**

| Message | What to do |
| --- | --- |
| No elimination matches | Run **Auto matches** first |
| Matches still need a winner | Finish **Score & winner** for that round |
| Round 2 / Semifinals / Playoffs already exist | Archive those next-round matches before generating again |
| Playoffs already exist | Do not advance again |
| Need a multiple of 4 teams | Fix the ready roster, then auto-match |

### 12.5 Player stats (optional)

Open **stats** on a match to enter per-player **lane**, **KDA** (`kills/deaths/assists`), rating, and gold. The public match view can show these after you save.

---

## 13. Team standing

Path: tournament → **Team Standing**.

Standings use completed and walkover matches (and any match with a winner):

1. Match wins
2. Game difference (games won minus games lost)
3. Games won
4. Team name

Win rate is shown for reference. Rankings appear after at least one scored match.

---

## 14. Committee admins

Path: **Admins** (superadmin manages; staff can view).

Create accounts with name, email, password, role (**staff** or **superadmin**), and active flag. Deactivate instead of deleting when someone should lose access. You cannot delete yourself.

**Audit log** is listed for superadmin; the page is a placeholder until logging is wired.

---

## 15. Suggested runbook

### Before registration

1. Superadmin creates **one** tournament, `bracket_count` 4, team size 5–6, best-of 3.
2. Set registration window and enable registration.
3. Set status to **upcoming**.
4. Share the public Register and Verify links.

### During registration

1. Staff work the **Pending** tab every day.
2. Check documents, age, phase, and team path; approve or reject with a reason.
3. Create-team squads appear as **forming** when teammates are approved.
4. Join-listed players attach to their team on approve.
5. Leave open-matching players unassigned until the window closes (or batch them sooner if you prefer).

### After registration closes

1. Turn registration **off**.
2. Finish remaining pending reviews.
3. Run **Auto teams** for open matching; **Quick team** for leftovers.
4. Confirm named squads are **ready**; inactive/archive the rest.
5. Count ready teams — must be a multiple of 4. Full SK field is 64 (16 × 4).
6. Set tournament status to **live**.

### Match day

1. **Auto matches** → confirm Round 1.
2. Play the round; enter **Score & winner** as matches finish.
3. When the round is complete, **Advance winners**.
4. Repeat until playoffs, then until a champion.
5. Optional: fill player stats for the public recap.
6. Check **Team Standing**.
7. When finished, set the tournament to **completed**.

---

## 16. Words we use

| Term | Meaning |
| --- | --- |
| **Registrant** | Person who submitted the public form, not yet approved |
| **Participant** | Person accepted into the tournament (or added by staff) |
| **Status code** | 6-digit code to check registration; not a password |
| **Team intent** | Open matching, join listed team, or create/name a team |
| **Home address** | Phase, Package, Block, Lot only |
| **Consent (T&A)** | SK terms the registrant must accept |
| **Bracket** | One of four elimination groups (A–D) inside the tournament |
| **Playoffs** | Cross-bracket stage after each group is down to two teams |
| **Staff / Superadmin** | Committee login roles |

Avoid calling registrants “users” or “accounts.” Players do not log in.

---

## 17. Troubleshooting

**Register is closed**  
No tournament has registration enabled, or the window is outside open/close dates. Superadmin: check Tournaments.

**“Email already used”**  
That email already has a pending or approved registration for this tournament. Use Verify with the existing code, or a different email.

**Under 15**  
Age is computed on **tournament day** (event start date), not today.

**Wrong phase**  
Only 4, 9, and 10 are accepted. 10A / 10B residents pick **Phase 10**.

**Approve button blocked**  
Pending only; must be 15+; phase 4/9/10; join-team must have a listed team; create-team must have a team name.

**Open matching players have no team**  
Expected until **Auto teams** or **Quick team**.

**Auto matches refuses the roster**  
Team count is not a multiple of 4, or there are fewer than 4 ready teams. Inactive/archive extras or add squads.

**Advance winners does nothing useful**  
Unscored matches in the current round, or the next round already exists (archive it first).

**Public cannot see the event**  
Status may still be `draft`, or the person is looking at the wrong link. Use **Tournaments** on the public site.

**Forgot admin password**  
A superadmin must reset or recreate the account. There is no self-serve reset on this app.

**Player lost the status code**  
Search Participants by name, email, or IGN; the code is on the record. Do not share other people’s documents.

---

*This manual describes the SK 176‑E MLBB tracker as implemented for committee operations and public registration. Developer setup lives in `README.md`.*
