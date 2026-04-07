interface Env {
  ASSETS: Fetcher;
  GOTV: DurableObjectNamespace;
  /** Ingest shared secret (wrangler secret) */
  ORIGIN_AUTH: string;
  /** Optional KV: indexes active matches for / and /api/matches */
  MATCH_INDEX?: KVNamespace;
  /** If set, GET / and GET /api/matches require ?key= or X-Dashboard-Key */
  DASHBOARD_KEY?: string;
  SYNC_FRAGMENT_DELAY?: string;
  SYNC_CACHE_MAX_AGE?: string;
  /** "true" → 404 when sync fragment not ready (gotv-plus-go style) */
  SYNC_NOT_READY_USE_404?: string;
  /** Optional global `token_redirect` segment for /sync JSON (VDC) */
  TOKEN_REDIRECT?: string;
}
