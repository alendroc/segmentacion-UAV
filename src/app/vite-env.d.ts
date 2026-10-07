/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base del back end. En desarrollo, "/api" y lo intercepta MSW. */
  readonly VITE_API_URL: string;
  /** "true" arranca el service worker de MSW antes de montar React. */
  readonly VITE_USE_MOCKS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
