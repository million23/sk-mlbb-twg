import type { Collections } from "@/types/pocketbase-types";
import PocketBase from "pocketbase";
import { ENV } from "varlock/env";

export const pb = new PocketBase(
  ENV.VITE_POCKETHOST_URL?.trim() || "https://pb.sk-mlbb-twg.com"
);

export function getCollection<T extends keyof Collections>(name: T) {
  return pb.collection<Collections[T]>(name);
}
