/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_POCKETHOST_URL?: string;
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  }
}

export {};