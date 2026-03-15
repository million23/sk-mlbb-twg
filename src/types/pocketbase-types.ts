/** MLBB roles used in participants.preferredRoles and team_suggestions view */
export type PlayerRole = 'mid' | 'gold' | 'exp' | 'support' | 'jungle'

/** Performance metrics stored in participants.performanceBasis */
export interface ParticipantPerformanceBasis {
    gamePerformanceRating?: number
    kda?: number
    accumulatedGold?: number
}

export interface Collections {
    admins: {
        id: string
        email?: string
        name?: string
        role?: 'superadmin' | 'staff'
        isActive?: boolean
        lastLoginAt?: string
        created?: string
        updated?: string
    }

    match_drafts: {
        id: string
        tournament?: string
        teamA?: string
        teamB?: string
        matchLabel?: string
        gameNumber?: number
        firstPickTeam?: string
        status?: 'pending' | 'active' | 'completed'
        bans?: string[]
        picks?: string[]
        created?: string
        updated?: string
    }

    participants: {
        id: string
        gameID?: string
        name?: string
        contactNumber?: string
        area?: string
        preferredRoles?: PlayerRole[]
        roleRankings?: Record<PlayerRole, number>
        performanceBasis?: ParticipantPerformanceBasis
        status?: 'unassigned' | 'suggested' | 'assigned' | 'inactive'
        team?: string
        created?: string
        updated?: string
    }

    teams: {
        id: string
        name?: string
        captain?: string
        status?: 'forming' | 'ready' | 'incomplete' | 'inactive'
        created?: string
        updated?: string
    }

    tournament_drafts: {
        id: string
        title?: string
        format?: string
        rules?: string
        maxTeams?: number
        scheduledAt?: string
        notes?: string
        publishToTournament?: string
        created?: string
        updated?: string
    }

    tournaments: {
        id: string
        title?: string
        slug?: string
        description?: string
        venue?: string
        startAt?: string
        endAt?: string
        status?: 'draft' | 'upcoming' | 'live' | 'completed' | 'archived'
        created?: string
        updated?: string
    }

    team_suggestions: {
        id: string
        participantId?: string
        participantGameID?: string
        participantStatus?: 'unassigned' | 'suggested' | 'assigned' | 'inactive'
        participantHasTeam?: 0 | 1
        suggestedTeamId?: string
        suggestedTeamName?: string
        suggestedTeamStatus?: 'forming' | 'ready' | 'incomplete' | 'inactive'
        roleFit?: PlayerRole
        preferredRole1?: string
        preferredRole2?: string
        preferredRole3?: string
        roleDataQuality?: 'complete' | 'partial' | 'missing'
        roleMatchScore?: number
        roleMatchLevel?: 'strong' | 'good' | 'fallback'
        rankingBasis?: ParticipantPerformanceBasis
        gamePerformanceRating?: number
        kda?: number
        accumulatedGold?: number
        teamMemberCount?: number
        teamSlotsLeft?: number
        suggestionPriority?: 'high' | 'medium' | 'low'
        sortScore?: number
        reason?: string
        status?: 'pending'
        created?: string
        updated?: string
    }

    draft_suggestions: {
        id: string
        tournamentId?: string
        tournamentTitle?: string
        matchLabel?: string
        suggestedBans?: string[]
        suggestedPicks?: string[]
        notes?: string
        status?: 'pending'
        created?: string
        updated?: string
    }
}
