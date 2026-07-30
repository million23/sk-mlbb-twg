# SK MLBB Tournament Tracker

Domain language for the Sangguniang Kabataan Barangay 176-E Mobile Legends tournament tracker.

## Language

**Registrant**:
A non-admin person submitting themselves through public registration before committee approval.
_Avoid_: User, account, applicant (unless contrasting approval states)

**Participant**:
A person in the tournament system after registration has been accepted (or created by an admin).
_Avoid_: Player as the record name (IGN may still be called in-game name)

**Home address**:
A structured barangay address of Phase, Package, Block, and Lot only — e.g. Phase 10 Package 4 Block 57 Lot 2.
_Avoid_: Free-form street address, full postal address

**Eligible phase**:
A Phase value allowed for residency: 4, 9, or 10.
_Avoid_: Phase 10-A / Phase 10-B as Phase field values

**Team intent**:
The registrant’s choice early in registration (right after consent): open matching, join an existing listed team, or create/name a preferred team. Create-team may register multiple teammates (2–6, clamped by tournament team size) in one session. Create-team submit immediately creates (or reuses) a `forming` team row for committee verify; roster assign happens after approve.
_Avoid_: Team preference (ambiguous), fill mode alone

**Phase-9 team rule**:
A registering team should include at least one resident whose Phase is 9. **Currently deferred** — not enforced in the public form or committee approve gate; kept as soft guidance in copy only.
_Avoid_: Phase-9 requirement (when meaning individual residency)

**Consent (T&A)**:
The terms and agreement a registrant must accept before the public registration form unlocks.
_Avoid_: Terms of service alone (when meaning this SK consent gate), checkbox without recorded acceptance

**Registration email**:
The required contact email on a public registration; one email may hold only one pending or approved registration per tournament (any team intent). Not a login identity.
_Avoid_: Account email, auth email (when meaning admin login)
