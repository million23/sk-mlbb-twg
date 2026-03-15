import type { Collections } from "@/types/pocketbase-types";
import PocketBase from "pocketbase";
import { ENV } from "varlock/env";

const pb = new PocketBase(ENV.VITE_POCKETHOST_URL?.trim());

const pocketbase = <T extends keyof Collections>(collectionName: T) => {
    return pb.collection<Collections[T]>(collectionName);
};

export default pocketbase;
