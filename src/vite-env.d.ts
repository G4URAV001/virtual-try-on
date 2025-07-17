/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_FASHN_API_URL?: string;
  readonly VITE_FASHN_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
