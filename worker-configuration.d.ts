interface Env {
  GOTV: DurableObjectNamespace;
  /** Ingest shared secret (wrangler secret) */
  ORIGIN_AUTH: string;
  SYNC_FRAGMENT_DELAY?: string;
  SYNC_CACHE_MAX_AGE?: string;
  /** "true" → 404 when sync fragment not ready (gotv-plus-go style) */
  SYNC_NOT_READY_USE_404?: string;
  /** Optional global `token_redirect` segment for /sync JSON (VDC) */
  TOKEN_REDIRECT?: string;
}
