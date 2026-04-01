/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_POCKETHOST_URL?: string;
  }
}

export {};