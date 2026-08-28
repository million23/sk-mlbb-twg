import { useSyncExternalStore } from "react";
import {
  ensureCommitteeAuth,
  getCommitteeAuthSnapshot,
  getServerCommitteeAuthSnapshot,
  isCommitteeSessionValid,
  signInCommittee,
  signOutCommittee,
  subscribeCommitteeAuth,
} from "@/lib/supabase/committee-auth";

export function useCommitteeAuth() {
  const snap = useSyncExternalStore(
    subscribeCommitteeAuth,
    getCommitteeAuthSnapshot,
    getServerCommitteeAuthSnapshot,
  );

  return {
    ready: snap.ready,
    isValid: isCommitteeSessionValid(snap),
    record: snap.admin,
    session: snap.session,
    signIn: signInCommittee,
    signOut: () => {
      void signOutCommittee();
    },
  };
}

export { ensureCommitteeAuth };
