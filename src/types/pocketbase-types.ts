/** MLBB roles used in participants.preferredRoles and team_suggestions view */
export enum PlayerRole {
    Mid = "mid",
    Gold = "gold",
    Exp = "exp",
    Support = "support",
    Jungle = "jungle",
}

/** Performance metrics stored in participants.performanceBasis */
export interface ParticipantPerformanceBasis {
    gamePerformanceRating?: number;
    kda?: number;
    accumulatedGold?: number;
}

export enum AdminRole {
    Superadmin = "superadmin",
    Staff = "staff",
}

export enum MatchDraftStatus {
    Pending = "pending",
    Active = "active",
    Completed = "completed",
}

export enum ParticipantStatus {
    Unassigned = "unassigned",
    Suggested = "suggested",
    Assigned = "assigned",
    Inactive = "inactive",
}

export enum TeamStatus {
    Forming = "forming",
    Ready = "ready",
    Incomplete = "incomplete",
    Inactive = "inactive",
}

export enum TournamentStatus {
    Draft = "draft",
    Upcoming = "upcoming",
    Live = "live",
    Completed = "completed",
    Archived = "archived",
}

export interface Collections {
    admins: {
        id: string;
        email?: string;
        name?: string;
        role?: AdminRole;
        isActive?: boolean;
        lastLoginAt?: string;
        created?: string;
        updated?: string;
    };

    match_drafts: {
        id: string;
        tournament?: string;
        teamA?: string;
        teamB?: string;
        matchLabel?: string;
        gameNumber?: number;
        firstPickTeam?: string;
        status?: MatchDraftStatus;
        bans?: any;
        picks?: any;
        created?: string;
        updated?: string;
    };

    participants: {
        id: string;
        gameID?: string;
        name?: string;
        contactNumber?: string;
        area?: string;
        preferredRoles?: any;
        roleRankings?: any;
        performanceBasis?: any;
        status?: ParticipantStatus;
        team?: string;
        birthdate?: string;
        created?: string;
        updated?: string;
    };

    teams: {
        id: string;
        name?: string;
        captain?: string;
        status?: TeamStatus;
        created?: string;
        updated?: string;
    };

    tournament_drafts: {
        id: string;
        title?: string;
        format?: string;
        rules?: string;
        maxTeams?: number;
        scheduledAt?: string;
        notes?: string;
        publishToTournament?: string;
        created?: string;
        updated?: string;
    };

    tournaments: {
        id: string;
        title?: string;
        slug?: string;
        description?: string;
        venue?: string;
        startAt?: string;
        endAt?: string;
        status?: TournamentStatus;
        created?: string;
        updated?: string;
    };

    draft_suggestions: {
        id: string;
        tournamentId?: string;
        tournamentTitle?: string;
        matchLabel?: any;
        suggestedBans?: any;
        suggestedPicks?: any;
        notes?: any;
        status?: any;
        created?: any;
        updated?: any;
    };

    team_suggestions: {
        id: string;
        participantId?: string;
        participantGameID?: string;
        participantStatus?: ParticipantStatus;
        participantHasTeam?: any;
        suggestedTeamId?: string;
        suggestedTeamName?: string;
        suggestedTeamStatus?: TeamStatus;
        roleFit?: any;
        preferredRole1?: any;
        preferredRole2?: any;
        preferredRole3?: any;
        roleDataQuality?: any;
        roleMatchScore?: any;
        roleMatchLevel?: any;
        rankingBasis?: any;
        gamePerformanceRating?: number;
        kda?: number;
        accumulatedGold?: number;
        teamMemberCount?: any;
        teamSlotsLeft?: any;
        suggestionPriority?: any;
        sortScore?: any;
        reason?: any;
        status?: any;
        created?: any;
        updated?: any;
    };
}
