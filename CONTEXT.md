# SK MLBB Tournament Tracker

Domain language for the Sangguniang Kabataan Barangay 176-E Mobile Legends tournament tracker.

## People

**Registrant**:
A non-admin person submitting themselves through public registration before committee approval.
_Avoid_: User, account, applicant (unless contrasting approval states)

**Participant**:
A person in the tournament system after registration has been accepted (or created by an admin).
_Avoid_: Player as the record name (IGN may still be called in-game name)

**Committee**:
SK organizers who review registrations and run the event.
_Avoid_: Admin as the people (admin is the app), staff as the whole group

**Staff**:
A committee login that can run day-to-day tournament work (participants, teams, matches) but cannot create tournaments or manage committee accounts.
_Avoid_: Moderator, editor, operator

**Superadmin**:
A committee login with full access, including tournaments and committee accounts.
_Avoid_: Owner, root, admin (unqualified)

## Registration

**Consent (T&A)**:
The terms and agreement a registrant must accept before the public registration form unlocks.
_Avoid_: Terms of service alone (when meaning this SK consent gate), checkbox without recorded acceptance

**Registration email**:
The required contact email on a public registration; one email may hold only one pending or approved registration per tournament (any team intent). Not a login identity.
_Avoid_: Account email, auth email (when meaning admin login)

**Status code**:
A six-digit receipt a registrant uses to check pending, approved, or rejected. Not a password or login.
_Avoid_: OTP, PIN, tracking number, verification code (when meaning this receipt)

**Home address**:
A structured barangay address of Phase, Package, Block, and Lot only — e.g. Phase 10 Package 4 Block 57 Lot 2.
_Avoid_: Free-form street address, full postal address

**Eligible phase**:
A Phase value allowed for residency: 4, 9, or 10.
_Avoid_: Phase 10-A / Phase 10-B as Phase field values

**Tournament day**:
The calendar date used to check that a registrant is at least 15 years old.
_Avoid_: Today, signup date, birthdate (when meaning the age-check day)

**Registration window**:
The period when public sign-up is allowed for a tournament.
_Avoid_: Open season, enrollment, intake

**Purok endorsement**:
A residency document. Optional at sign-up. Missing file means **conditional approval**: they present it at the tournament.
_Avoid_: Barangay clearance (when meaning this upload), proof of address (generic)

## Teams

**Team intent**:
The registrant’s choice of how they enter a squad: open matching, join a listed team, or create/name a team.
_Avoid_: Team preference (ambiguous), fill mode, path (unqualified)

**Open matching**:
Team intent to register alone and be placed on a squad by the committee after approval.
_Avoid_: Solo queue, random, unassigned (as the intent name)

**Listed team**:
An existing named team a registrant can choose to join.
_Avoid_: Public team, published team, roster (when meaning the join target)

**Create-team**:
Team intent to name a new squad and register teammates (2–6) in one session.
_Avoid_: New team (unqualified), squad builder, batch signup (as the intent name)

**Phase-9 team rule**:
A registering team should include at least one resident whose Phase is 9. Currently deferred — not enforced; soft guidance in copy only. A Phase 9 resident as team captain is preferred but optional.
_Avoid_: Phase-9 requirement (when meaning individual residency)

**Team**:
A named squad of participants in a tournament, typically five mains and one backup.
_Avoid_: Party, lineup (when meaning the persistent squad)

**Preferred lanes**:
Ordered Mobile Legends roles a participant wants to play: mid, gold, exp, support, jungle.
_Avoid_: Rank, position, role ranking (when meaning this preference list)

**IGN**:
The participant’s in-game name in Mobile Legends.
_Avoid_: Username, handle, gamertag (when meaning this field)

## Event

**Tournament**:
One SK cup. This event is a single tournament; it is not four tournaments.
_Avoid_: Season, event (unqualified), league, cup as the record name

**Bracket**:
One of four elimination groups (A–D) inside a tournament. Pairings stay inside a bracket until playoffs.
_Avoid_: Group, pool, division, tournament (when meaning one of the four)

**Playoffs**:
The cross-bracket stage after each elimination bracket is down to two teams.
_Avoid_: Finals (when meaning the whole cross-bracket stage), championship (unqualified)

**Round**:
A stage of play inside elimination (Round 1, Round 2, Semifinals) or playoffs (Quarterfinals onward).
_Avoid_: Game, set, match (when meaning the stage)

**Match**:
A pairing of two teams in a round, inside a bracket or in playoffs.
_Avoid_: Game (a match is a series), fixture, bout

**Advance winners**:
Creating the next round from completed-match winners, still inside each bracket until playoffs.
_Avoid_: Promote, seed, generate next (unqualified)

**Team standing**:
The ranked table of teams from completed match results.
_Avoid_: Leaderboard (unqualified), ranking (when meaning this table)
