export const queryKeys = {
  admins: ["admins"] as const,
  auditLog: ["audit_log"] as const,
  auditRelatedRecord: (collection: string, id: string) =>
    ["audit_related_record", collection, id] as const,
  participants: ["participants"] as const,
  participantsArchived: ["participants", "archived"] as const,
  teams: ["teams"] as const,
  teamsArchived: ["teams", "archived"] as const,
  tournaments: ["tournaments"] as const,
  tournamentsArchived: ["tournaments", "archived"] as const,
  tournamentDrafts: ["tournament_drafts"] as const,
  matchDrafts: ["match_drafts"] as const,
  matches: ["matches"] as const,
  teamSuggestions: ["team_suggestions"] as const,
  draftSuggestions: ["draft_suggestions"] as const,
  publicUpcoming: ["public", "upcoming"] as const,
  publicCurrent: ["public", "current"] as const,
} as const;
