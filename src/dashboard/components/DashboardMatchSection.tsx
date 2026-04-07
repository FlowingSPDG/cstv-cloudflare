import type { FC } from "hono/jsx";
import type { MatchIndexRecord } from "../../match-index";
import {
  formatRelativeTime,
  gotvUrl,
  playcastCommand,
} from "../format";

type Props = {
  origin: string;
  indexEnabled: boolean;
  matches: MatchIndexRecord[];
};

export const DashboardMatchSection: FC<Props> = ({
  origin,
  indexEnabled,
  matches,
}) => {
  const hasRows = matches.length > 0;

  return (
    <>
      {!indexEnabled && (
        <div class="panel warn">
          <h2>Setup</h2>
          <p style="margin:0; color: var(--muted); font-size: 0.9rem;">
            Listing matches requires a Workers KV binding named{" "}
            <code>MATCH_INDEX</code>. Uncomment{" "}
            <code>[[kv_namespaces]]</code> in <code>wrangler.toml</code>, create
            a namespace, then redeploy (see README → Dashboard).
          </p>
        </div>
      )}

      <div class="panel">
        <h2>Active matches</h2>
        {!hasRows && (
          <div class="empty">
            No matches yet. Rows appear after the game server posts{" "}
            <code>/gotv/&lt;token&gt;/start</code>.
          </div>
        )}
        {hasRows && (
          <table>
            <thead>
              <tr>
                <th>Map</th>
                <th>Token</th>
                <th>Info</th>
                <th>Updated</th>
                <th>Playback</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => {
                const url = gotvUrl(origin, m.token);
                const cmd = playcastCommand(origin, m.token);
                return (
                  <tr>
                    <td class="map">{m.map || "—"}</td>
                    <td class="token">{m.token}</td>
                    <td class="mono">
                      p{m.protocol ?? "?"} · tps {m.tps ?? "?"} · maxFrag{" "}
                      {m.maxFullFragment ?? 0}
                    </td>
                    <td class="mono">{formatRelativeTime(m.updatedAt)}</td>
                    <td class="playback-cell">
                      <label class="field-label">Playcast (select text, then copy)</label>
                      <textarea readonly class="cmd-in" rows={2}>
                        {cmd}
                      </textarea>
                      <label class="field-label">GOTV URL</label>
                      <input readonly class="url-in" value={url} />
                      <p class="url-open">
                        <a href={url}>Open in browser</a>
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};
