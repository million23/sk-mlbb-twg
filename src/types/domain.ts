export type AdminRole = 'superadmin' | 'staffAdmin'

export interface AdminAccount {
  id: string
  email: string
  password: string
  name: string
  role: AdminRole
  isActive: boolean
  lastLoginAt: string | null
}

export type PlayerRole = 'roamer' | 'jungler' | 'mid' | 'gold' | 'exp'

export interface ParticipantPerformanceBasis {
  gamePerformanceRating: number
  kda: number
  accumulatedGold: number
}

export interface ParticipantRecord {
  id: string
  ign: string
  realName: string
  contactNumber: string
  area: string
  preferredRoles: [PlayerRole, PlayerRole, PlayerRole]
  experienceLevel: string
  roleRankings: Record<PlayerRole, number>
  performanceBasis: ParticipantPerformanceBasis
  status: 'unassigned' | 'suggested' | 'assigned' | 'inactive'
  teamId: string | null
}

export interface TeamRecord {
  id: string
  name: string
  captainParticipantId: string | null
  logoUrl: string
  status: 'forming' | 'ready' | 'incomplete' | 'inactive'
  participantIds: string[]
}

export interface TeamSuggestionRecord {
  id: string
  participantId: string
  suggestedTeamId: string
  roleFit: PlayerRole
  rankingBasis: ParticipantPerformanceBasis
  reason: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
}

export type TournamentStatus =
  | 'draft'
  | 'upcoming'
  | 'live'
  | 'completed'
  | 'archived'

export interface TournamentRecord {
  id: string
  title: string
  slug: string
  description: string
  venue: string
  startAt: string
  endAt: string
  status: TournamentStatus
}

export interface TournamentDraftRecord {
  id: string
  title: string
  format: string
  rules: string
  maxTeams: number
  scheduledAt: string
  notes: string
  publishToTournamentId: string | null
}

export interface MatchDraftRecord {
  id: string
  tournamentId: string
  teamAId: string
  teamBId: string
  matchLabel: string
  gameNumber: number
  firstPickTeamId: string | null
  bans: string[]
  picks: string[]
  status: 'pending' | 'active' | 'completed'
}

export interface PracticeGameRecord {
  id: string
  title: string
  participantIds: string[]
  scheduledAt: string
  notes: string
  status: 'planned' | 'ongoing' | 'completed'
}

export interface DraftSuggestionRecord {
  id: string
  tournamentId: string
  matchLabel: string
  suggestedBans: string[]
  suggestedPicks: string[]
  notes: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface TrackerDb {
  admins: AdminAccount[]
  participants: ParticipantRecord[]
  teams: TeamRecord[]
  teamSuggestions: TeamSuggestionRecord[]
  tournaments: TournamentRecord[]
  tournamentDrafts: TournamentDraftRecord[]
  matchDrafts: MatchDraftRecord[]
  practiceGames: PracticeGameRecord[]
  draftSuggestions: DraftSuggestionRecord[]
}

