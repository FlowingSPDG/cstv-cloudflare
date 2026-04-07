import type { SyncResponse } from "./types";
import { tokenRedirectForSync } from "./auth";
import { upsertMatchIndex, type MatchIndexRecord } from "./match-index";

type FragmentData = {
  tick?: number;
  endtick?: number;
  full?: ArrayBuffer;
  delta?: ArrayBuffer;
  fullAtMs: number;
  deltaAtMs: number;
  final?: boolean;
};

function isSyncReady(f: FragmentData | undefined): boolean {
  if (!f) return false;
  return (
    f.full != null &&
    f.delta != null &&
    f.tick != null &&
    f.endtick != null
  );
}

function parseIntParam(v: string | null, def: number): number {
  if (v == null || v === "") return def;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

function parseFloatParam(v: string | null, def: number): number {
  if (v == null || v === "") return def;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : def;
}

function parseBoolParam(v: string | null): boolean {
  if (v == null || v === "") return false;
  return v === "1" || v.toLowerCase() === "true";
}

export class GotvMatch implements DurableObject {
  private signupFragment = -1;
  private tps = 0;
  private keyframeInterval = 3;
  private protocol = 4;
  private mapName = "";
  private readonly starts = new Map<number, ArrayBuffer>();
  private readonly fragments = new Map<number, FragmentData>();
  private maxFullFragment = 0;
  private lastFullReceivedAtMs = 0;

  constructor(
    private readonly _ctx: DurableObjectState,
    private readonly env: Env,
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 1) {
      return new Response("Not Found", { status: 404 });
    }

    if (parts.length === 2 && parts[1] === "sync" && request.method === "GET") {
      return this.handleSyncGet(url);
    }

    if (parts.length === 3) {
      const fragNum = parseInt(parts[1], 10);
      const kind = parts[2];
      if (!Number.isFinite(fragNum)) {
        return new Response("BadRequest:invalid fragment", { status: 400 });
      }
      if (kind === "start") {
        if (request.method === "POST") {
          return this.handlePostStart(request, url, fragNum);
        }
        if (request.method === "GET") {
          return this.handleGetStart(fragNum);
        }
      }
      if (kind === "full") {
        if (request.method === "POST") {
          return this.handlePostFull(request, url, fragNum);
        }
        if (request.method === "GET") {
          return this.handleGetFull(fragNum);
        }
      }
      if (kind === "delta") {
        if (request.method === "POST") {
          return this.handlePostDelta(request, url, fragNum);
        }
        if (request.method === "GET") {
          return this.handleGetDelta(fragNum);
        }
      }
    }

    return new Response("Not Found", { status: 404 });
  }

  private broadcastStarted(): boolean {
    return this.signupFragment >= 0 && this.starts.has(this.signupFragment);
  }

  private reset205(): Response {
    return new Response("RESET CONTENT", { status: 205 });
  }

  private async handlePostStart(
    request: Request,
    url: URL,
    fragment: number,
  ): Promise<Response> {
    const tick = parseIntParam(url.searchParams.get("tick"), 0);
    const tps = parseFloatParam(url.searchParams.get("tps"), 0);
    const map = url.searchParams.get("map") ?? "";
    const keyframe_interval = parseFloatParam(
      url.searchParams.get("keyframe_interval"),
      3,
    );
    const protocol = parseIntParam(url.searchParams.get("protocol"), 4);

    const body = await request.arrayBuffer();
    this.signupFragment = fragment;
    this.starts.set(fragment, body);
    this.tps = Math.round(tps);
    this.mapName = map;
    this.keyframeInterval = keyframe_interval;
    this.protocol = protocol;

    await this.touchMatchIndex();
    return new Response(null, { status: 200 });
  }

  private async handlePostFull(
    request: Request,
    url: URL,
    fragment: number,
  ): Promise<Response> {
    if (!this.broadcastStarted()) {
      return this.reset205();
    }
    const tick = parseIntParam(url.searchParams.get("tick"), 0);
    const body = await request.arrayBuffer();
    const now = Date.now();
    let f = this.fragments.get(fragment);
    if (!f) {
      f = { fullAtMs: 0, deltaAtMs: 0 };
      this.fragments.set(fragment, f);
    }
    f.tick = tick;
    f.full = body;
    f.fullAtMs = now;
    if (fragment > this.maxFullFragment) this.maxFullFragment = fragment;
    this.lastFullReceivedAtMs = now;

    await this.touchMatchIndex();
    return new Response(null, { status: 200 });
  }

  private async handlePostDelta(
    request: Request,
    url: URL,
    fragment: number,
  ): Promise<Response> {
    if (!this.broadcastStarted()) {
      return this.reset205();
    }
    const endtick = parseIntParam(url.searchParams.get("endtick"), 0);
    const final = parseBoolParam(url.searchParams.get("final"));
    const body = await request.arrayBuffer();
    const now = Date.now();
    let f = this.fragments.get(fragment);
    if (!f) {
      f = { fullAtMs: 0, deltaAtMs: 0 };
      this.fragments.set(fragment, f);
    }
    f.endtick = endtick;
    f.delta = body;
    f.deltaAtMs = now;
    f.final = final;

    await this.touchMatchIndex();
    return new Response(null, { status: 200 });
  }

  private async touchMatchIndex(): Promise<void> {
    const token = this._ctx.id.name;
    if (!token || !this.env.MATCH_INDEX) return;
    if (!this.broadcastStarted() && !this.mapName) return;
    const record: MatchIndexRecord = {
      token,
      map: this.mapName,
      protocol: this.protocol,
      tps: this.tps,
      signupFragment: this.signupFragment >= 0 ? this.signupFragment : 0,
      maxFullFragment: this.maxFullFragment,
      updatedAt: Date.now(),
      hasStart: this.broadcastStarted(),
    };
    await upsertMatchIndex(this.env, record);
  }

  private handleGetStart(fragment: number): Response {
    if (!this.broadcastStarted()) {
      return new Response("MATCH NOT FOUND", { status: 404 });
    }
    if (fragment !== this.signupFragment) {
      return new Response("Invalid or expired start fragment, please re-sync", {
        status: 404,
      });
    }
    const buf = this.starts.get(fragment);
    if (!buf) {
      return new Response("FRAGMENT NOT FOUND", { status: 404 });
    }
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  private handleGetFull(fragment: number): Response {
    if (!this.broadcastStarted()) {
      return new Response("MATCH NOT FOUND", { status: 404 });
    }
    const f = this.fragments.get(fragment);
    if (!f?.full) {
      return new Response("FRAGMENT NOT FOUND", { status: 404 });
    }
    return new Response(f.full, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  private handleGetDelta(fragment: number): Response {
    if (!this.broadcastStarted()) {
      return new Response("MATCH NOT FOUND", { status: 404 });
    }
    const f = this.fragments.get(fragment);
    if (!f?.delta) {
      return new Response("FRAGMENT NOT FOUND", { status: 404 });
    }
    return new Response(f.delta, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  private delayFragments(): number {
    const d = parseInt(this.env.SYNC_FRAGMENT_DELAY ?? "8", 10);
    return Number.isFinite(d) && d >= 0 ? d : 8;
  }

  private syncCacheMaxAge(): number {
    const d = parseInt(this.env.SYNC_CACHE_MAX_AGE ?? "3", 10);
    return Number.isFinite(d) && d >= 0 ? d : 3;
  }

  private use404ForNotReady(): boolean {
    return (this.env.SYNC_NOT_READY_USE_404 ?? "").toLowerCase() === "true";
  }

  private handleSyncGet(url: URL): Response {
    if (!this.broadcastStarted()) {
      return new Response("Broadcast has not started yet", { status: 404 });
    }

    const fragParam = url.searchParams.get("fragment");
    const latestMode =
      fragParam === null || fragParam === "" || fragParam === "0";

    const delay = this.delayFragments();
    const now = Date.now();
    const maxAgeSec = this.syncCacheMaxAge();

    let chosenFrag: number | null = null;
    let data: FragmentData | undefined;

    if (latestMode) {
      let cand = this.maxFullFragment - delay;
      if (cand < this.signupFragment) cand = this.signupFragment;
      data = this.fragments.get(cand);
      if (isSyncReady(data)) {
        chosenFrag = cand;
      }
    } else {
      let start = parseInt(fragParam!, 10);
      if (!Number.isFinite(start)) {
        return new Response("BadRequest:fragment", { status: 400 });
      }
      if (start < this.signupFragment) start = this.signupFragment;
      const keys = Array.from(this.fragments.keys());
      const maxKey = keys.length
        ? Math.max(this.maxFullFragment, ...keys)
        : this.maxFullFragment;
      for (let i = start; i <= maxKey; i++) {
        const f = this.fragments.get(i);
        if (isSyncReady(f)) {
          chosenFrag = i;
          data = f;
          break;
        }
      }
    }

    if (chosenFrag == null || !isSyncReady(data)) {
      const status = this.use404ForNotReady() ? 404 : 405;
      const text = this.use404ForNotReady()
        ? "FRAGMENT NOT FOUND"
        : "Fragment not found, please check back soon";
      return new Response(text, { status });
    }

    const rtdelay = (now - (data!.fullAtMs || now)) / 1000;
    const rcvage = (now - this.lastFullReceivedAtMs) / 1000;

    const sync: SyncResponse = {
      tick: data!.tick!,
      endtick: data!.endtick!,
      rtdelay,
      rcvage,
      fragment: chosenFrag!,
      signup_fragment: this.signupFragment,
      tps: this.tps,
      keyframe_interval: this.keyframeInterval,
      map: this.mapName,
      protocol: this.protocol,
    };

    const tr = tokenRedirectForSync(this.env);
    if (tr) sync.token_redirect = tr;

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${maxAgeSec}`,
      Expires: new Date(now + maxAgeSec * 1000).toUTCString(),
    });

    return new Response(JSON.stringify(sync), { status: 200, headers });
  }
}
