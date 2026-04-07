# cstv-cloudflare

[GOTV+ / playcast](https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Broadcast) relay on [Cloudflare Workers](https://developers.cloudflare.com/workers/) and **Durable Objects** (one object per match `token`, so ingest stays consistent worldwide). [Hono](https://hono.dev/) routes `/gotv/*` to the object.

## Quick start (fork / clone → your Cloudflare account)

1. **Prerequisites:** Node.js 20+, a Cloudflare account, [`wrangler`](https://developers.cloudflare.com/workers/wrangler/) via npm.
2. Clone and install:

   ```bash
   git clone <your-fork-url>
   cd cstv-cloudflare
   npm ci
   ```

3. Log in and deploy:

   ```bash
   npx wrangler login
   npx wrangler deploy
   ```

4. **Set ingest secret** (required for `POST` from the game server):

   ```bash
   npx wrangler secret put ORIGIN_AUTH
   ```

   For local dev, copy `.dev.vars.example` → `.dev.vars` and set `ORIGIN_AUTH` there (never commit `.dev.vars`).

5. **Point the game server** at your worker (HTTPS, **no trailing slash** on the base URL):

   ```cfg
   tv_enable 1
   tv_broadcast_url "https://<your-worker>.workers.dev/gotv"
   tv_broadcast_origin_auth "<same value as ORIGIN_AUTH>"
   tv_broadcast 1
   ```

6. **Viewers** use `playcast` with the **same base** you publish (again, no trailing slash):

   ```text
   playcast "https://<your-worker>.workers.dev/gotv/<MATCH_OR_TOKEN>"
   ```

   The token in the URL is whatever the game server sends (Valve documents formats like `s<steamid>t<cookie>`; your public alias can differ — see VDC).

## HTTP surface

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/gotv/:token/:fragment/start` | Header `X-Origin-Auth` required. Query: `tick`, `tps`, `map`, `keyframe_interval`, `protocol`. |
| `POST` | `/gotv/:token/:fragment/full` | Query: `tick`. |
| `POST` | `/gotv/:token/:fragment/delta` | Query: `endtick`, optional `final`. |
| `GET` | `/gotv/:token/sync` | JSON; short CDN-friendly cache (see vars below). |
| `GET` | `/gotv/:token/:fragment/start|full|delta` | Binary (`application/octet-stream`). |

If `/full` or `/delta` arrives before a successful `/start`, the worker responds with **205 Reset Content** (per VDC).

## Environment / Wrangler vars

Set in `wrangler.toml` `[vars]` or in the dashboard:

| Variable | Default | Purpose |
|----------|---------|---------|
| `SYNC_FRAGMENT_DELAY` | `8` | “Live edge” offset: sync without `?fragment=` picks roughly `latestFull - delay` (Valve reference relay uses 8; VDC mentions ~N−4 for buffering experiments). |
| `SYNC_CACHE_MAX_AGE` | `3` | `Cache-Control: max-age` for `/sync` (seconds). VDC suggests a few seconds; tune with your CDN. |
| `SYNC_NOT_READY_USE_404` | unset | Set to `true` to return **404** when the chosen fragment is not ready (closer to gotv-plus-go); default is **405** (Valve relay style). |
| `TOKEN_REDIRECT` | unset | Optional global `token_redirect` string in `/sync` JSON (VDC: path segment for generic → match-specific playcast URLs). |

**Secrets:** `ORIGIN_AUTH` — shared secret for ingest (`tv_broadcast_origin_auth`).

No KV or D1 bindings are required; the worker runs with **Durable Objects + `ORIGIN_AUTH` + optional `[vars]`** only.

## Cloudflare caching (production)

- **Bypass cache** for `*/sync` (or very short TTL) so viewers stay near live.
- **Cache** `GET` `start` / `full` / `delta` only when you are sure a given URL is immutable after the fragment is complete (see VDC + gotv-plus-go README).

## Hidden `playcast` options (client-side)

Documented in [gotv-plus-go README](https://github.com/FlowingSPDG/gotv-plus-go/blob/master/README.MD): **F** (start at fragment N → `sync?fragment=N`), **A** (`sync?fragment=1`), **C** (skips `/sync`, hits fragments directly — your `GET` routes must still serve data), **B** (client behaviour; server stores blobs transparently).

## Limits

- Worker request body size limits apply ([documentation](https://developers.cloudflare.com/workers/platform/limits/)).
- Durable Object memory applies for all retained fragments; very long matches may need a future R2 offload (not implemented here).

## CI

See [.github/workflows/deploy.yml](.github/workflows/deploy.yml). Use repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Set `ORIGIN_AUTH` in the dashboard or via `wrangler secret put`.

## License

MIT — see [LICENSE](LICENSE).

## References

- [Counter-Strike: Global Offensive Broadcast (Valve Developer Community)](https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Broadcast)
- [gotv-plus-go](https://github.com/FlowingSPDG/gotv-plus-go)
