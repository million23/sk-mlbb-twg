export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AdminRole = "superadmin" | "staff";
export type PlayerLane = "mid" | "gold" | "exp" | "support" | "jungle";
export type AddressPhase = "4" | "9" | "10";
export type TournamentStatus =
  | "draft"
  | "upcoming"
  | "live"
  | "completed"
  | "archived";
export type TeamStatus = "forming" | "ready" | "incomplete" | "inactive";
export type TeamIntent = "open_matching" | "join_team" | "create_team";
export type ParticipantStatus =
  | "unassigned"
  | "suggested"
  | "assigned"
  | "inactive";
export type RegistrationStatus = "pending" | "approved" | "rejected";
export type MatchStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "completed"
  | "walkover"
  | "cancelled";
export type MatchDraftStatus = "pending" | "active" | "completed";
export type BracketFormat = "single_elimination";

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: AdminRole;
          is_active: boolean;
          last_login_at: string | null;
          created: string;
          updated: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: AdminRole;
          is_active?: boolean;
          last_login_at?: string | null;
          created?: string;
          updated?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admins"]["Insert"]>;
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          title: string;
          slug: string | null;
          description: string | null;
          venue: string | null;
          start_at: string | null;
          end_at: string | null;
          status: TournamentStatus;
          registration_enabled: boolean;
          registration_open_at: string | null;
          registration_close_at: string | null;
          max_teams: number | null;
          min_team_size: number;
          max_team_size: number;
          bracket_count: number;
          bracket_format: BracketFormat;
          match_best_of: number;
          archived: boolean;
          created_by: string | null;
          updated_by: string | null;
          created: string;
          updated: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tournaments"]["Row"]> & {
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["tournaments"]["Row"]>;
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          tournament: string;
          name: string;
          captain: string | null;
          status: TeamStatus;
          archived: boolean;
          created_by: string | null;
          updated_by: string | null;
          created: string;
          updated: string;
        };
        Insert: Partial<Database["public"]["Tables"]["teams"]["Row"]> & {
          tournament: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Row"]>;
        Relationships: [];
      };
      participants: {
        Row: {
          id: string;
          tournament: string;
          name: string;
          email: string;
          ign: string;
          birthdate: string;
          contact_number: string | null;
          user_id: string;
          server_id: string;
          address_phase: AddressPhase;
          address_package: string;
          address_block: string;
          address_lot: string;
          preferred_lane: PlayerLane[];
          preferred_roles: PlayerLane[] | null;
          role_rankings: Json | null;
          performance_basis: Json | null;
          team_intent: TeamIntent | null;
          preferred_team: string | null;
          preferred_team_name: string | null;
          registration_status: RegistrationStatus;
          registration_reject_reason: string | null;
          registration_status_code: string | null;
          consent_version: string | null;
          consent_accepted_at: string | null;
          school_id_front: string | null;
          school_id_back: string | null;
          purok_endorsement: string | null;
          status: ParticipantStatus;
          team: string | null;
          archived: boolean;
          created_by: string | null;
          updated_by: string | null;
          created: string;
          updated: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["participants"]["Row"]
        > & {
          tournament: string;
          name: string;
          email: string;
          ign: string;
          birthdate: string;
          user_id: string;
          server_id: string;
          address_phase: AddressPhase;
          address_package: string;
          address_block: string;
          address_lot: string;
        };
        Update: Partial<Database["public"]["Tables"]["participants"]["Row"]>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          tournament: string;
          team_a: string | null;
          team_b: string | null;
          winner: string | null;
          bracket: string | null;
          round: string | null;
          order: number | null;
          best_of: number;
          match_label: string | null;
          scheduled_at: string | null;
          status: MatchStatus;
          score_a: number | null;
          score_b: number | null;
          notes: string | null;
          archived: boolean;
          created_by: string | null;
          updated_by: string | null;
          created: string;
          updated: string;
        };
        Insert: Partial<Database["public"]["Tables"]["matches"]["Row"]> & {
          tournament: string;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Row"]>;
        Relationships: [];
      };
      match_result: {
        Row: {
          id: string;
          match: string;
          player: string;
          lane: PlayerLane | null;
          kills: number | null;
          deaths: number | null;
          assists: number | null;
          game_performance_rating: number | null;
          accumulated_gold: number | null;
          game_number: number | null;
          archived: boolean;
          created_by: string | null;
          updated_by: string | null;
          created: string;
          updated: string;
        };
        Insert: Partial<Database["public"]["Tables"]["match_result"]["Row"]> & {
          match: string;
          player: string;
        };
        Update: Partial<Database["public"]["Tables"]["match_result"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      registration_email_available: {
        Args: { p_tournament: string; p_email: string };
        Returns: boolean;
      };
      registration_listed_teams: {
        Args: { p_tournament: string };
        Returns: { id: string; name: string }[];
      };
      registration_status_lookup: {
        Args: { p_code: string };
        Returns: Json;
      };
    };
    Enums: {
      admin_role: AdminRole;
      player_lane: PlayerLane;
    };
    CompositeTypes: Record<string, never>;
  };
}
