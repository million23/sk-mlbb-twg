/** Lane / role values shared across participants, matches, and views. */
export type PlayerLane = "mid" | "gold" | "exp" | "support" | "jungle";

/** JSON blob on `participants.performance_basis` (snake_case keys). */
export interface ParticipantPerformanceBasis {
  game_performance_rating?: number;
  kda?: number;
  accumulated_gold?: number;
}

/**
 * Admin ranking payload on `participants.role_rankings`.
 * Shape is app-defined; keep values JSON-serializable.
 */
export type RoleRankings = Record<string, string | number | boolean | null>;

export interface Collections {
  admins: {
    id: string;
    name: string;
    role: "superadmin" | "staff";
    is_active: boolean;
    last_login_at?: string;
    created?: string;
    updated?: string;
  };

  audit_log: {
    id: string;
    table_name?: string;
    record_id?: string;
    key_field?: string;
    created_by?: string;
    updated_by?: string;
    created?: string;
    updated?: string;
  };

  match_drafts: {
    id: string;
    tournament: string;
    team_a?: string;
    team_b?: string;
    match_label?: string;
    game_number?: number;
    first_pick_team?: string;
    bans?: string[];
    picks?: string[];
    status: "pending" | "active" | "completed";
    created_by?: string;
    updated_by?: string;
    archived: boolean;
    created?: string;
    updated?: string;
  };

  match_result: {
    id: string;
    match: string;
    player: string;
    lane?: PlayerLane;
    kills?: number;
    deaths?: number;
    assists?: number;
    game_performance_rating?: number;
    accumulated_gold?: number;
    archived: boolean;
    created_by?: string;
    updated_by?: string;
    created?: string;
    updated?: string;
  };

  matches: {
    id: string;
    tournament: string;
    team_a?: string;
    team_b?: string;
    winner?: string;
    bracket?: string;
    round?: string;
    order?: number;
    best_of: number;
    match_label?: string;
    scheduled_at?: string;
    status: "scheduled" | "live" | "completed" | "walkover" | "cancelled";
    score_a?: number;
    score_b?: number;
    notes?: string;
    created_by?: string;
    updated_by?: string;
    archived: boolean;
    created?: string;
    updated?: string;
  };

  participants: {
    id: string;
    tournament: string;
    name: string;
    email: string;
    ign: string;
    birthdate: string;
    contact_number?: string;
    user_id: string;
    server_id: string;
    address_phase: "4" | "9" | "10";
    address_package: string;
    address_block: string;
    address_lot: string;
    preferred_lane: PlayerLane;
    /** Multi-select in PocketBase (max 5). */
    preferred_roles?: PlayerLane[];
    role_rankings?: RoleRankings;
    performance_basis?: ParticipantPerformanceBasis;
    team_intent?: "open_matching" | "join_team" | "create_team";
    preferred_team?: string;
    preferred_team_name?: string;
    registration_status: "pending" | "approved" | "rejected";
    registration_reject_reason?: string;
    registration_status_code?: string;
    consent_version?: string;
    school_id_front?: string;
    school_id_back?: string;
    purok_endorsement?: string;
    status: "unassigned" | "suggested" | "assigned" | "inactive";
    team?: string;
    created_by?: string;
    updated_by?: string;
    archived: boolean;
    consent_accepted_at?: string;
    created?: string;
    updated?: string;
  };

  teams: {
    id: string;
    tournament: string;
    name: string;
    captain?: string;
    status: "forming" | "ready" | "incomplete" | "inactive";
    created_by?: string;
    updated_by?: string;
    archived: boolean;
    created?: string;
    updated?: string;
  };

  tournament_drafts: {
    id: string;
    title: string;
    format?: string;
    /** Editor field — HTML/text string from PocketBase. */
    rules?: string;
    max_teams?: number;
    scheduled_at?: string;
    notes?: string;
    publish_to_tournament?: string;
    created_by?: string;
    updated_by?: string;
    archived?: boolean;
    created?: string;
    updated?: string;
  };

  tournaments: {
    id: string;
    title: string;
    slug?: string;
    description?: string;
    venue?: string;
    start_at?: string;
    end_at?: string;
    status: "draft" | "upcoming" | "live" | "completed" | "archived";
    registration_enabled: boolean;
    registration_open_at?: string;
    registration_close_at?: string;
    max_teams?: number;
    min_team_size: number;
    max_team_size: number;
    bracket_count: number;
    bracket_format: "single_elimination";
    match_best_of: number;
    archived: boolean;
    created_by?: string;
    updated_by?: string;
    created?: string;
    updated?: string;
  };

  /** View — SQLite over `tournaments`. Expression columns may arrive as JSON-typed scalars. */
  draft_suggestions: {
    id: string;
    tournament_id?: string;
    tournament_title: string;
    match_label?: string;
    suggested_bans?: string[] | string;
    suggested_picks?: string[] | string;
    notes?: string;
    status?: "pending" | "approved" | "rejected" | string;
    created?: string;
    updated?: string;
  };

  /** View — SQLite over participants/teams/tournaments. */
  team_suggestions: {
    id: string;
    participant_id?: string;
    participant_game_id: string;
    participant_status: "unassigned" | "suggested" | "assigned" | "inactive";
    participant_has_team?: boolean | number;
    suggested_team_id?: string;
    suggested_team_name: string;
    suggested_team_status: "forming" | "ready" | "incomplete" | "inactive";
    role_fit: PlayerLane;
    preferred_role_1: PlayerLane;
    preferred_role_2?: PlayerLane | string | null;
    preferred_role_3?: PlayerLane | string | null;
    role_data_quality?: string;
    role_match_score?: number;
    role_match_level?: string;
    ranking_basis?: ParticipantPerformanceBasis;
    game_performance_rating?: number;
    kda?: number;
    accumulated_gold?: number;
    team_member_count?: number;
    team_slots_left?: number;
    suggestion_priority?: number;
    sort_score?: number;
    reason?: string;
    status?: "pending" | "accepted" | "rejected" | "expired" | string;
    created?: string;
    updated?: string;
  };
}
