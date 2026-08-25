# SK MLBB Tournament Tracker — QA guide

Hand this guide to the tester. Fill in the blanks under **Before you start**, then work through the checklist. For every problem, copy a template into a GitHub issue (or send the filled template to the project owner).

---

## Before you start

| Item | Value |
|------|--------|
| Test website URL | _[paste staging/test URL here]_ |
| GitHub issues link | _[paste repo Issues URL here]_ |
| Who to ask for admin login | _[name / contact]_ |
| Test accounts | Use only accounts shared for QA. Do **not** use real resident data. |
| Devices to cover | At least one desktop browser **and** one phone (or phone-width window) |

### Safety rules

- Do **not** put real passwords, API keys, or `.env` values in issue tickets or screenshots.
- Blur or crop personal info (names, IDs, emails, documents) in screenshots unless the ticket needs a fake test example.
- Prefer **made-up test data** (fake names, emails, IGNs). Use sample images for ID / endorsement uploads, not real IDs.
- If something looks like a security problem (you can see other people’s data, skip login, etc.), stop and report it privately to the project owner — do not post full details in a public issue.

### Words we use

| Term | Meaning |
|------|---------|
| Registrant | Someone filling out public registration (not yet approved) |
| Participant | Someone accepted into the tournament (or added by an admin) |
| Home address | Phase, Package, Block, and Lot only (e.g. Phase 10 Package 4 Block 57 Lot 2) |
| Eligible phase | Phase **4**, **9**, or **10** only |
| Team intent | Open matching, join an existing team, or create/name a preferred team |
| Phase-9 team rule | Preferred guidance (Phase **9** on a team; Phase 9 captain optional); **not enforced** in the form |
| Consent (T&A) | Terms & agreement the registrant must accept before the form unlocks |
| Registration email | Contact email on the form (not an admin login) |

---

## How to report a finding

1. Reproduce once more (or note if it only happens sometimes).
2. Use the **Bug** or **Enhancement** template below.
3. Describe what you saw as a user — screens, buttons, messages. No need for code or file names.
4. Open a new GitHub issue (or send the filled template to the project owner).
5. Log it in the **Session log** at the bottom.

**One issue = one problem.** If three different things broke, file three issues.

---

## Bug template

Copy everything below into the issue body and fill it in.

```md
**Title:** [short — e.g. "Cannot submit registration when Phase is 9"]

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Enter '....'
4. See error / wrong result

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots (blur real personal data).

**Desktop (please complete the following information):**
 - OS: [e.g. Windows 11]
 - Browser [e.g. Chrome, Edge, Safari]
 - Version [e.g. 128]

**Smartphone (please complete the following information):**
 - Device: [e.g. iPhone 14 / Samsung A54]
 - OS: [e.g. iOS 17 / Android 14]
 - Browser [e.g. Safari, Chrome]
 - Version [e.g. 17]

**Additional context**
- Environment: [test URL you used]
- Consistency: [always / sometimes]
- Role: [public registrant / admin / other]
- Tournament name (if relevant):
- Notes:
```

---

## Enhancement template

Use this when the app works but something should be clearer or easier.

```md
**Title:** [short — e.g. "Show a clearer message when the registration email is already used"]

## Current behavior
[What happens today]

## Proposed behavior
[What should happen instead]

## Why it matters
[Who gets stuck — registrant, committee, admin]

## Scenario
1. ...
2. ...

## Additional context
- Priority feel: [nice-to-have / should-have / blocker for go-live]
- Related issue (if any):
```

---

## QA checklist

Check each item as you test. File an issue for every fail.

### A. Public — registration

Start from the test website → registration page.

- [ ] Terms & agreement must be accepted before the form can be used
- [ ] Step order: Consent → Team → Credentials → (Team select / Team name when needed) → Documents → Pending
- [ ] Team intent works first: open matching / join an existing team / create a team (with member count)
- [ ] Required fields work: name, birthdate, home address (Phase / Package / Block / Lot), IGN, server ID, user ID, preferred lane, registration email
- [ ] Home address only allows Phase **4**, **9**, or **10**
- [ ] Under 15 by tournament day is rejected with a clear message
- [ ] Document uploads work: school ID (front and back). Purok endorsement is optional. Skipping it still submits.
- [ ] After approve without endorsement, admin shows Conditional. Verify page says present it at the tournament.
- [ ] Create-team: can register 2–6 players (within tournament min/max), each with credentials + documents; pending shows all status codes
- [ ] Phase-9 team rule is **not** blocking submit or approve (deferred)
- [ ] Same registration email cannot hold another pending or approved registration for the same tournament (clear error)
- [ ] After submit, success or “pending” state is obvious
- [ ] Form is usable on a phone (fields, documents, errors)

### B. Public — other pages

- [ ] Home / landing page loads
- [ ] Links to registration (and any public tournament info) work
- [ ] Verify page works for a valid case and shows a clear error for an invalid case
- [ ] Public tournament list / detail shows expected info when available

### C. Admin — login

Ask the project owner for a **test** admin account. Do not share the password in tickets.

- [ ] Valid login works
- [ ] Invalid login shows a clear error
- [ ] After logout, admin pages are no longer accessible
- [ ] Opening an admin page while logged out sends you to login (or blocks access)

### D. Admin — tournaments

- [ ] You can see the tournament list
- [ ] You can open a tournament’s management area
- [ ] Create / edit / archive tournament works if those actions are available

### E. Admin — participants & teams

- [ ] List / search / filter participants
- [ ] Approve or reject a registrant
- [ ] Approving without a Phase 9 resident is allowed while Phase-9 rule is deferred
- [ ] Create / edit a participant as admin (if available)
- [ ] List / manage teams
- [ ] Team standing view loads

### F. Admin — matches & other

- [ ] Matches: list / create / update (whatever is available)
- [ ] Audit logs visible if your role allows it
- [ ] Admin user list / invite / roles (whatever is available)

### G. General quality

- [ ] Loading and empty states are understandable
- [ ] Errors explain what to do next (not a silent fail or blank screen)
- [ ] Bad or oversized uploads fail with a clear message
- [ ] Critical paths work on desktop and mobile

---

## Session log

| Date | Area (A–G) | Finding (1 line) | Bug or enhancement? | Issue link or status |
|------|------------|------------------|---------------------|----------------------|
|      |            |                  |                     |                      |
|      |            |                  |                     |                      |
|      |            |                  |                     |                      |

### Notes for the project owner

-
-
-
