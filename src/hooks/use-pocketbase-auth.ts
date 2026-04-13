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

export function usePocketBaseAuth() {
  const isValid = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    isValid,
    record: pb.authStore.record,
    signIn: (email: string, password: string) =>
      pb.collection("admins").authWithPassword(email, password),
    signOut: () => pb.authStore.clear(),
  };
}
