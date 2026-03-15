# Mobile Legends Tournament Tracker Proposal

## 1. Cover Page

- Project Title: Mobile Legends Tournament Tracker
- Client Name / Organization: Sangguniang Kabataan of Barangay 176-E
- Submitted By: Gerald
- Date: 2026-03-08

## 2. Table of Contents

1. Cover Page
2. Table of Contents
3. Executive Summary / Project Overview
4. Project Objectives
5. Scope of Work
6. Technical Approach / Solution Architecture
7. Technology Stack
8. Non-Functional Requirements (NFRs)
9. Team Composition & Roles
10. Project Timeline / Milestones
11. Deliverables
12. Assumptions & Dependencies
13. Risk Analysis & Mitigation Plan
14. Change Management Process
15. Communication & Reporting Plan
16. Testing & Quality Assurance
17. Deployment & Release Strategy
18. Maintenance & Support Plan
19. Cost Estimate / Pricing
20. Appendices

## 3. Executive Summary / Project Overview

This proposal outlines a Mobile Legends tournament tracking system for the Sangguniang Kabataan of Barangay 176-E. The project is intended to support tournament organizers with a secure private management area while also giving the public a simple way to view upcoming and current events.

The system will be a mobile-first web app. It will include a secured admin side under `/app` and a public side under `/p`. The admin side will support management of admins, participants, teams, tournaments, drafts, and suggestions. The public side will focus on visibility for tournament events.

Because the project target is 90 days, the recommended delivery method is Agile. This will allow the project to be built in smaller working parts, reviewed earlier, and adjusted quickly when feedback is given.

## 4. Project Objectives

- Provide a secure admin panel for tournament management.
- Separate private organizer functions from public event viewing.
- Support the tournament lifecycle from planning to live event to completion.
- Allow multiple admins to use the system with different permission levels.
- Help incomplete teams find suitable registered participants.
- Support draft-related planning and match preparation.
- Include role-based participant rankings for more informed team suggestions.
- Show upcoming and current events clearly for the public.
- Build the app as a mobile-first web platform that is practical, maintainable, and scalable.

## 5. Scope of Work

### A. Functional Scope

#### Admin Area: `/app`

- Secure login for admins
- Admin account management
- Participant management
- Team management
- Tournament management
- Tournament planning drafts
- Match draft tracking for MLBB picks and bans
- Draft suggestion support for planning and match preparation
- Team suggestion support for incomplete teams
- Practice games (participant-only matches, no team assignment)
- Participant role ranking support
- Shared admin navigation, search, filtering, and status handling

#### Public Area: `/p`

- Public landing page for tournament visibility
- Upcoming events page
- Current or live events page
- Optional public event details page for a selected event

### B. Out of Scope (Optional)

- Advanced analytics dashboards
- Push notifications or SMS notifications
- Livestream integrations
- Native mobile applications
- Bracket automation beyond the initial required tournament and draft data structure

## 6. Technical Approach / Solution Architecture

The project will be built on the current web application foundation and organized into two main route groups:

- `/app` for private admin use
- `/p` for public viewing

The app will be delivered as a mobile-first web application, which means the interface will be designed first for phones and then improved for larger screens.

At a high level, the system will work like this:

```txt
Admins
  -> open the private `/app` pages
  -> log in and pass access control
  -> manage admins, participants, teams, tournaments, drafts, and suggestions
  -> save and read records through the backend service

Public users
  -> open the public `/p` pages
  -> view upcoming and current events
  -> read only data that is approved for public viewing

Backend service
  -> handles login and permissions
  -> stores admin, participant, team, tournament, and draft records
  -> stores team suggestions and draft suggestions

App support tools
  -> manage saved data loading and updates
  -> manage app state and remembered preferences
  -> improve search, filtering, and repeated actions
```

### Proposed Routes

```txt
/
/app
/app/admins
/app/participants
/app/teams
/app/tournaments
/app/drafts

/p
/p/upcoming
/p/current
```

Optional future route:

```txt
/p/events/:eventId
```

### Main Data Structure

#### Admin Accounts

- `email`
- `password`
- `name`
- `role`
- `isActive`
- `lastLoginAt`

Suggested access levels:

- `superadmin`
- `staff`

#### Participants

- `gameID` (replaces IGN)
- `name` (real name)
- `contactNumber`
- `area`
- `preferredRoles` (array of 3 roles in priority order)
- `experienceLevel`
- `roleRankings`
- `performanceBasis`
- `status`
- `team` (relation to teams)

The `area` field is intended for local address grouping such as package, phase, block, and lot style addresses like `Phase 10A Package 2 Block 24 Lot 1`.

Participant ranking should be based on:

- game performance rating
- KDA
- accumulated gold

Role options: `mid`, `gold`, `exp`, `support`, `jungle`. Role rankings help show how strong a participant is in each role.

#### Teams

- `name`
- `captain` (relation to participants)
- `status`
- Team members are linked via `participants.team` relation

Team rule:

- 5 main members
- 1 backup member (6 total)

#### Team Suggestions (View Collection)

These suggestions are for teams that do not yet have enough members. They are derived from `teams` and `participants` as a read-only view (`team_suggestions`). The view recommends which unassigned participants can fill missing team slots based on role fit, ranking, and available slots.

- `participantId`, `participantGameID`, `suggestedTeamId`, `suggestedTeamName`
- `roleFit`, `preferredRole1`, `preferredRole2`, `preferredRole3`
- `rankingBasis`, `teamMemberCount`, `teamSlotsLeft`, `suggestionPriority`, `sortScore`, `reason`

#### Tournaments

- `title`
- `slug`
- `description`
- `venue`
- `startAt`
- `endAt`
- `status`

Suggested tournament stages:

- `draft`
- `upcoming`
- `live`
- `completed`
- `archived`

#### Tournament Drafts

- `title`
- `format`
- `rules`
- `maxTeams`
- `scheduledAt`
- `notes`
- `publishToTournament`

#### Match Drafts

- `tournament`
- `teamA`
- `teamB`
- `matchLabel`
- `gameNumber`
- `firstPickTeam`
- `bans`
- `picks`
- `status`

#### Draft Suggestions (View Collection)

Derived from `tournaments` as a read-only view (`draft_suggestions`). Provides default draft suggestion seeds for active tournaments.

- `tournamentId`, `tournamentTitle`
- `matchLabel`, `suggestedBans`, `suggestedPicks`, `notes`, `status`

#### Practice Games

- `title`
- `participantIds` (json array of selected participants)
- `scheduledAt`
- `notes`
- `status` (`planned`, `ongoing`, `completed`)

Practice games allow internal matches with selected participants only, without team assignment.

## 7. Technology Stack

- Frontend: React, TypeScript, Vite, TanStack Router, Tailwind CSS v4, shadcn/ui
- State and data tools: Nanostores, `@nanostores/persistent`, TanStack Query, TanStack Pacer
- Environment variables: Varlock (schema validation, type-safe `ENV` access)
- Backend and storage: PocketHost or PocketBase
- Testing: Vitest, Testing Library
- Package manager: Bun

## 8. Non-Functional Requirements (NFRs)

### Performance

- The app should feel fast when moving between pages.
- Admin actions should update smoothly and clearly.
- Search, filtering, and repeated actions should remain responsive.

### Scalability

- The structure should support adding more tournaments, teams, participants, and admins over time.
- The app should support gradual feature growth without requiring a full redesign.

### Security

- Only signed-in admins can access `/app`.
- Admin permissions should be role-based.
- Sensitive actions such as managing other admins should be restricted.
- Access rules should be enforced by the backend, not only by the user interface.

### Availability / Uptime

- Public event pages should remain simple and dependable during tournament activity.
- The admin system should be stable enough for day-to-day tournament operations.

### Usability

- The app should be easy to use on phones.
- Public pages should remain readable on both mobile and desktop.
- Admin screens should use clear and consistent patterns.

## 9. Team Composition & Roles

This project is currently expected to be developed as a focused solo build with flexible responsibilities based on need.

- Project owner / developer: handles planning, development, iteration, and technical decisions
- Client representatives: provide feedback, approvals, and clarification of tournament rules and priorities
- Admin users: validate whether the workflows are practical for real tournament operations

## 10. Project Timeline / Milestones

The project is expected to be completed within 90 days and will follow Agile methodology rather than waterfall. The timeline below should be treated as iterative working phases, not a rigid one-pass sequence.

### Phase 1: Foundation

- Configure backend connection and admin login
- Add route groups for `/app` and `/p`
- Set up the main data-loading layer
- Set up app state and remembered local preferences
- Add helpers for search, filtering, and repeated actions

### Phase 2: Core Admin Management

- Build `/app/admins`
- Build `/app/participants`
- Build `/app/teams`
- Build `/app/tournaments`
- Add participant role ranking support
- Add incomplete-team suggestion support based on participant data and ranking metrics

### Phase 3: Draft Features

- Add tournament draft workflows
- Add match draft tracking for picks and bans
- Add draft suggestion support for planning and match preparation

### Phase 4: Public Event Pages

- Build `/p/upcoming`
- Build `/p/current`
- Add optional public event detail page if needed

### Phase 5: Hardening

- Refine validation and admin permission rules
- Improve loading, empty, and error states
- Add tests for important flows

## 11. Deliverables

- Secured admin route group under `/app`
- Public route group under `/p`
- Admin pages for admins, participants, teams, tournaments, and drafts
- Team suggestion tools for incomplete teams (view-based)
- Draft suggestion tools for planning and match preparation (view-based)
- Practice game support (participant-only matches)
- Participant role ranking support (3 preferred roles)
- Backend data structure and access rules
- Environment variable schema (Varlock) for deployment config
- Frontend state and data-loading setup
- Basic test coverage for important pages and management flows

## 12. Assumptions & Dependencies

- PocketHost or PocketBase will be the approved backend service.
- The tournament workflow for SK of Barangay 176-E can be supported by the proposed records and pages.
- The project will be delivered as a mobile-first web application.
- No native mobile app is required.
- The first implementation focus is tournament management, team formation support, and public event visibility.
- Some field names and validation rules may still be adjusted after feedback.

## 13. Risk Analysis & Mitigation Plan

### Risk: Scope growth during planning

- Impact: high
- Likelihood: medium
- Mitigation: keep the early implementation focused on admin auth, tournaments, teams, participants, suggestion foundations, and public event pages

### Risk: Admin permissions becoming too broad

- Impact: high
- Likelihood: medium
- Mitigation: enforce backend access rules and separate higher-level admin permissions from regular admin actions

### Risk: Public pages exposing internal records

- Impact: medium
- Likelihood: medium
- Mitigation: allow public pages to show only approved event records and enforce this through backend rules

### Risk: Suggestions not matching organizer expectations

- Impact: medium
- Likelihood: medium
- Mitigation: keep suggestions editable, reviewable, and optional so admins stay in control of final decisions

### Risk: Participant rankings being inconsistent

- Impact: medium
- Likelihood: medium
- Mitigation: base rankings on measurable values such as game performance rating, KDA, and accumulated gold, while keeping admin review available

## 14. Change Management Process

- New change requests should be reviewed based on impact to scope, timeline, and priority.
- Small adjustments can be absorbed into Agile iterations when practical.
- Larger changes should be discussed before implementation so they do not disrupt the 90-day target.
- Client feedback should guide the order of work, but major scope changes should be evaluated carefully.

## 15. Communication & Reporting Plan

- Regular progress updates should be shared during development.
- Feedback should be collected continuously because the project follows Agile methodology.
- Working features should be reviewed in smaller increments instead of waiting for one final full handoff.
- Priorities can be adjusted based on client feedback and actual project progress.

## 16. Testing & Quality Assurance

- Unit and component testing for important logic and UI behavior
- Flow testing for admin login, CRUD operations, and public event views
- Validation testing for participant, team, tournament, and draft records
- Review of role ranking and suggestion logic
- Final user review for practical tournament workflow fit

Acceptance should focus on:

- working admin login
- usable admin management pages
- correct public event visibility
- understandable mobile-first interface
- suggestion features behaving according to the agreed rules

## 17. Deployment & Release Strategy

- Prepare the app for a production web deployment
- Configure required environment values (e.g. `VITE_POCKETHOST_URL`) via Varlock schema
- Release the application in usable stages rather than waiting for all possible features
- Prioritize the most important working features first
- Keep the release process simple and stable for the 90-day timeline

## 18. Maintenance & Support Plan

- Provide a short post-build adjustment period for fixes and improvements
- Allow follow-up refinement after initial rollout based on actual tournament use
- Prioritize issues affecting login, team management, tournament visibility, and core admin flows
- Use feedback from organizers to guide the next improvements

## 19. Cost Estimate / Pricing

- Not included in this proposal version

## 20. Appendices

### Appendix A: First Recommended Implementation Slice

- admin login
- `/app/admins`
- `/app/participants`
- `/app/teams`
- `/app/tournaments`
- `/app/drafts` (tournament drafts, match drafts, draft suggestions, practice games)
- participant role ranking support (3 preferred roles: mid, gold, exp, support, jungle)
- team suggestion support for incomplete teams (view-based)
- practice games (participant-only matches)
- `/p/upcoming`
- `/p/current`

### Appendix B: Summary Note

This proposal is designed to serve as a practical starting document for the Mobile Legends Tournament Tracker for the Sangguniang Kabataan of Barangay 176-E. It can continue to be refined as development moves forward through Agile iterations. For the current PocketBase schema, view SQL, and field details, see `POCKETBASE_TABLES.md`.

### Appendix C: PocketBase Database Setup List

Use this as the PocketBase collection checklist. See `POCKETBASE_TABLES.md` for full schema details and SQL for view collections.

#### Base Collections

**1. `admins`** (Auth collection)

- `name`, `role` (superadmin, staff), `isActive`, `lastLoginAt`
- For users who can access `/app`. Admin management limited by role.

**2. `participants`**

- `gameID`, `name`, `contactNumber`, `area`
- `preferredRoles` (json array of 3: mid, gold, exp, support, jungle)
- `roleRankings`, `performanceBasis` (gamePerformanceRating, kda, accumulatedGold)
- `status` (unassigned, suggested, assigned, inactive)
- `team` (relation to teams)

**3. `teams`**

- `name`, `captain` (relation to participants), `status`
- Members linked via `participants.team`. Target: 5 main + 1 backup.

**4. `tournaments`**

- `title`, `slug`, `description`, `venue`, `startAt`, `endAt`
- `status` (draft, upcoming, live, completed, archived)

**5. `tournament_drafts`**

- `title`, `format`, `rules`, `maxTeams`, `scheduledAt`, `notes`
- `publishToTournament` (relation to tournaments)

**6. `match_drafts`**

- `tournament`, `teamA`, `teamB`, `matchLabel`, `gameNumber`, `firstPickTeam`
- `bans`, `picks` (json), `status` (pending, active, completed)

#### View Collections (Read-Only)

**7. `team_suggestions`** – Derived from `teams` + `participants`

- Suggests unassigned participants for incomplete teams based on role fit, ranking, and slots.
- See `POCKETBASE_TABLES.md` for view SQL.

**8. `draft_suggestions`** – Derived from `tournaments`

- Default draft suggestion seeds for upcoming/live tournaments.
- See `POCKETBASE_TABLES.md` for view SQL.

#### Planned

**9. `practice_games`**

- `title`, `participantIds` (json), `scheduledAt`, `notes`
- `status` (planned, ongoing, completed)

#### Optional later collections

- `matches`, `registrations`, `auditLogs`
