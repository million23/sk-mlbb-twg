import { useSyncExternalStore } from "react";
import { pb } from "@/lib/pocketbase";

function subscribe(callback: () => void) {
  return pb.authStore.onChange(() => callback());
}

function getSnapshot() {
  return pb.authStore.isValid;
}

function getServerSnapshot() {
  return false;
}

async function signInAndTrackLogin(email: string, password: string) {
  const auth = await pb.collection("admins").authWithPassword(email, password);

  // Don't fail login for telemetry/audit timestamp issues.
  if (auth.record?.id) {
    try {
      await pb.collection("admins").update(auth.record.id, {
        lastLoginAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to update lastLoginAt", error);
    }
  }

  return auth;
}

export function usePocketBaseAuth() {
  const isValid = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    isValid,
    record: pb.authStore.record,
    signIn: signInAndTrackLogin,
    signOut: () => pb.authStore.clear(),
  };
}
