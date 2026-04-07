import { Hono } from "hono";
import { GotvMatch } from "./gotv-match";
import { originAuth } from "./auth";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) =>
  c.text(
    "cstv-cloudflare — GOTV+ relay. Ingest and playcast base path: /gotv (see README).",
  ),
);

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
