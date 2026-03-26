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

/** Bracket / schedule row for a tournament (distinct from per-game `match_drafts`). */
export enum MatchStatus {
    Scheduled = "scheduled",
    Live = "live",
    Completed = "completed",
    Walkover = "walkover",
    Cancelled = "cancelled",
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
        name?: string;
        role?: "superadmin" | "staff";
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
        status?: "pending" | "active" | "completed";
        bans?: any;
        picks?: any;
        created?: string;
        updated?: string;
    };

    matches: {
        id: string;
        tournament?: string;
        teamA?: string;
        teamB?: string;
        winner?: string;
        round?: string;
        order?: number;
        bestOf: number;
        matchLabel?: string;
        scheduledAt?: string;
        status?: "scheduled" | "live" | "completed" | "walkover" | "cancelled";
        scoreA?: number;
        scoreB?: number;
        notes?: string;
        createdBy?: string;
        updatedBy?: string;
        archived?: boolean;
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
        status?: "unassigned" | "suggested" | "assigned" | "inactive";
        team?: string;
        birthdate?: string;
        createdBy?: string;
        updatedBy?: string;
        archived?: boolean;
        created?: string;
        updated?: string;
    };

    teams: {
        id: string;
        name?: string;
        captain?: string;
        status?: "forming" | "ready" | "incomplete" | "inactive";
        updatedBy?: string;
        createdBy?: string;
        archived?: boolean;
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
        status?: "draft" | "upcoming" | "live" | "completed" | "archived";
        createdBy?: string;
        updatedBy?: string;
        archived?: boolean;
        created?: string;
        updated?: string;
    };

    audit_log: {
        id: string;
        table_name?: any;
        record_id?: any;
        key_field?: any;
        created_by?: any;
        updated_by?: any;
        created?: any;
        updated?: any;
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
        participantStatus?: "unassigned" | "suggested" | "assigned" | "inactive";
        participantHasTeam?: any;
        suggestedTeamId?: string;
        suggestedTeamName?: string;
        suggestedTeamStatus?: "forming" | "ready" | "incomplete" | "inactive";
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
