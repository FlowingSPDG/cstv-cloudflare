/** Shared by dashboard SSR and any API consumers. */

export function formatRelativeTime(ms: number, now = Date.now()): string {
  const s = Math.floor((now - ms) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return new Date(ms).toLocaleString();
}

export function playcastCommand(origin: string, token: string): string {
  return `playcast "${origin}/gotv/${token}"`;
}

export function gotvUrl(origin: string, token: string): string {
  return `${origin}/gotv/${token}`;
}
