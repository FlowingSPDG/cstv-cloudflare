/** Shared secret for ingest (`tv_broadcast_origin_auth` / `ORIGIN_AUTH`). */
export function originAuth(env: Env): string {
  return env.ORIGIN_AUTH ?? "";
}

/** Optional global `token_redirect` segment for `/sync` JSON (VDC). */
export function tokenRedirectForSync(env: Env): string | undefined {
  const g = env.TOKEN_REDIRECT?.trim();
  return g || undefined;
}
