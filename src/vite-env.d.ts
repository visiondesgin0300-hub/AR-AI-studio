/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Absolute origin of the Express server that answers /api, for builds where
   * the screens are not served by that same process — the Android package in
   * particular. Left empty for the ordinary web build.
   */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
