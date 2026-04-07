import type { FC } from "hono/jsx";

type Props = { apiPath: string };

export const DashboardFooter: FC<Props> = ({ apiPath }) => (
  <p class="foot">
    API:{" "}
    <a href={apiPath}>
      {apiPath}
    </a>{" "}
    ·{" "}
    <a href="https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Broadcast">
      Valve GOTV+ specification
    </a>
  </p>
);
