import { Hono } from "hono";
import { GotvMatch } from "./gotv-match";
import { originAuth } from "./auth";
import { listMatchIndex } from "./match-index";
import { Dashboard } from "./dashboard/page";

const app = new Hono<{ Bindings: Env }>();

app.use("*", async (c, next) => {
  if (c.req.method !== "GET") return next();
  const path = new URL(c.req.url).pathname;
  if (path !== "/" && path !== "/api/matches") return next();
  const key = c.env.DASHBOARD_KEY;
  if (key) {
    const ok =
      c.req.query("key") === key || c.req.header("X-Dashboard-Key") === key;
    if (!ok) return c.text("Unauthorized", 401);
  }
  await next();
});

app.get("/assets/*", async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  if (res.status === 404) return c.text("Not Found", 404);
  const path = new URL(c.req.url).pathname;
  const headers = new Headers(res.headers);
  if (path.endsWith(".css")) {
    headers.set("Content-Type", "text/css; charset=utf-8");
    headers.set("Cache-Control", "public, max-age=86400");
  }
  return new Response(res.body, { status: res.status, headers });
});

app.get("/", async (c) => {
  const url = new URL(c.req.url);
  const origin = url.origin;
  const matches = await listMatchIndex(c.env);
  const indexEnabled = Boolean(c.env.MATCH_INDEX);
  const apiPath = `/api/matches${url.search}`;
  return c.html(
    <Dashboard
      origin={origin}
      indexEnabled={indexEnabled}
      matches={matches}
      apiPath={apiPath}
    />,
  );
});

app.get("/api/matches", async (c) => {
  const origin = new URL(c.req.url).origin;
  const matches = await listMatchIndex(c.env);
  return c.json({
    origin,
    indexEnabled: Boolean(c.env.MATCH_INDEX),
    matches,
  });
});

app.all("/gotv/*", async (c) => {
  const url = new URL(c.req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0] !== "gotv" || segments.length < 2) {
    return c.text("Not Found", 404);
  }

  const token = segments[1];

  if (c.req.method === "POST") {
    const auth = c.req.header("X-Origin-Auth");
    if (auth == null || auth === "") {
      return c.text("tv_broadcast_origin_auth required", 401);
    }
    const expected = originAuth(c.env);
    if (expected === "" || auth !== expected) {
      return c.text("Unauthorized", 401);
    }
  }

  const innerPath = "/" + segments.slice(1).join("/") + url.search;
  const doUrl = new URL(innerPath, url.origin);
  const id = c.env.GOTV.idFromName(token);
  const stub = c.env.GOTV.get(id);
  const req = new Request(doUrl.toString(), c.req.raw);
  return stub.fetch(req);
});

export { GotvMatch };
export default app;
