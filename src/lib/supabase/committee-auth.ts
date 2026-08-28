import type { Session } from "@supabase/supabase-js";
import {
  canAccessAdminApp,
  type AdminAuthRecord,
} from "@/lib/admin/permissions";
import { supabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

export type CommitteeAdminRow = Database["public"]["Tables"]["admins"]["Row"];

export interface CommitteeAuthSnapshot {
  ready: boolean;
  session: Session | null;
  admin: CommitteeAdminRow | null;
}

type Listener = () => void;

let snapshot: CommitteeAuthSnapshot = {
  ready: false,
  session: null,
  admin: null,
};

const listeners = new Set<Listener>();
let boot: Promise<void> | null = null;
let listening = false;

function emit() {
  for (const listener of listeners) listener();
}

function setSnapshot(next: CommitteeAuthSnapshot) {
  snapshot = next;
  emit();
}

async function loadAdmin(
  userId: string | undefined,
): Promise<CommitteeAdminRow | null> {
  if (!userId) return null;
  const result = await supabase
    .from("admins")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (result.error) {
    console.error("Failed to load committee profile", result.error);
    return null;
  }
  return result.data;
}

async function applySession(session: Session | null) {
  const admin = await loadAdmin(session?.user.id);
  setSnapshot({
    ready: true,
    session,
    admin,
  });
}

export function subscribeCommitteeAuth(listener: Listener): () => void {
  listeners.add(listener);
  void ensureCommitteeAuth();
  return () => {
    listeners.delete(listener);
  };
}

export function getCommitteeAuthSnapshot(): CommitteeAuthSnapshot {
  return snapshot;
}

export function getServerCommitteeAuthSnapshot(): CommitteeAuthSnapshot {
  return { ready: false, session: null, admin: null };
}

export async function ensureCommitteeAuth(): Promise<CommitteeAuthSnapshot> {
  if (!boot) {
    boot = (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Supabase getSession failed", error);
      await applySession(data.session ?? null);
      if (!listening) {
        listening = true;
        supabase.auth.onAuthStateChange((_event, session) => {
          void applySession(session);
        });
      }
    })();
  }
  await boot;
  return snapshot;
}

export function getAuthRecordId(): string | undefined {
  return snapshot.admin?.id;
}

export function getCommitteeAdminRecord(): AdminAuthRecord {
  return snapshot.admin;
}

export async function signInCommittee(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  await applySession(data.session);
  const admin = snapshot.admin;
  if (!canAccessAdminApp(admin)) {
    await supabase.auth.signOut();
    await applySession(null);
    throw new Error("This account is not an active committee login.");
  }
  if (admin?.id) {
    const touch = await supabase
      .from("admins")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", admin.id);
    if (touch.error) {
      console.error("Failed to update last_login_at", touch.error);
    } else {
      await applySession(data.session);
    }
  }
}

export async function signOutCommittee() {
  await supabase.auth.signOut();
  await applySession(null);
}

export function isCommitteeSessionValid(
  snap: CommitteeAuthSnapshot = snapshot,
): boolean {
  return Boolean(snap.ready && snap.session && canAccessAdminApp(snap.admin));
}

