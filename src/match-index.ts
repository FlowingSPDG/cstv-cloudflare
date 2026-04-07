/** KV record for dashboard / API (key: match:<token>) */
export type MatchIndexRecord = {
  token: string;
  map: string;
  protocol: number;
  tps: number;
  signupFragment: number;
  maxFullFragment: number;
  updatedAt: number;
  /** false if broadcast was reset or never completed start */
  hasStart: boolean;
};

const PREFIX = "match:";
const TTL_SEC = 60 * 60 * 24 * 7;

export async function upsertMatchIndex(
  env: Env,
  record: MatchIndexRecord,
): Promise<void> {
  const kv = env.MATCH_INDEX;
  if (!kv) return;
  await kv.put(PREFIX + record.token, JSON.stringify(record), {
    expirationTtl: TTL_SEC,
  });
}

export async function listMatchIndex(env: Env): Promise<MatchIndexRecord[]> {
  const kv = env.MATCH_INDEX;
  if (!kv) return [];
  const listed = await kv.list({ prefix: PREFIX });
  const out: MatchIndexRecord[] = [];
  for (const { name } of listed.keys) {
    const raw = await kv.get(name);
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw) as MatchIndexRecord);
    } catch {
      /* skip */
    }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}
