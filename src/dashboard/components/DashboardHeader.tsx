import type { FC } from "hono/jsx";

export const DashboardHeader: FC = () => (
  <header>
    <h1>CSTV dashboard</h1>
    <p class="sub">
      Ingested match tokens with <code>playcast</code> commands and stream URLs. No
      client-side script — select text in the fields below and copy manually (Ctrl+C / ⌘C).
    </p>
  </header>
);
