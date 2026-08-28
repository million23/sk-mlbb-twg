import { useCommitteeAuth } from "@/hooks/use-committee-auth";
import {
  canAccessAdminApp,
  canAccessTournamentOps,
  canDeleteAdmin,
  canManageAdmins,
  canManageMatches,
  canManageParticipants,
  canManageTeams,
  canManageTournaments,
  canViewAdmins,
  canViewAuditLog,
  canViewDashboard,
  canViewMatches,
  canViewParticipants,
  canViewTeamStanding,
  canViewTeams,
  canViewTournaments,
  getAdminRole,
  isAdminActive,
  isSuperadmin,
  type AdminAuthRecord,
} from "@/lib/admin/permissions";

export function useAdminRbac() {
  const { record, isValid } = useCommitteeAuth();
  const auth = record as AdminAuthRecord;

  return {
    isValid,
    auth,
    role: getAdminRole(auth),
    isActive: isAdminActive(auth),
    isSuperadmin: isSuperadmin(auth),
    canAccessAdminApp: canAccessAdminApp(auth),
    canAccessTournamentOps: canAccessTournamentOps(auth),
    canViewDashboard: canViewDashboard(auth),
    canViewTournaments: canViewTournaments(auth),
    canManageTournaments: canManageTournaments(auth),
    canViewParticipants: canViewParticipants(auth),
    canManageParticipants: canManageParticipants(auth),
    canViewTeams: canViewTeams(auth),
    canManageTeams: canManageTeams(auth),
    canViewMatches: canViewMatches(auth),
    canManageMatches: canManageMatches(auth),
    canViewTeamStanding: canViewTeamStanding(auth),
    canViewAdmins: canViewAdmins(auth),
    canManageAdmins: canManageAdmins(auth),
    canViewAuditLog: canViewAuditLog(auth),
    canDeleteAdmin: (targetAdminId: string | undefined) =>
      canDeleteAdmin(auth, targetAdminId),
  };
}
