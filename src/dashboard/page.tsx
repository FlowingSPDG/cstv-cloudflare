import type { FC } from "hono/jsx";
import type { MatchIndexRecord } from "../match-index";
import { DashboardLayout } from "./components/DashboardLayout";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardMatchSection } from "./components/DashboardMatchSection";
import { DashboardFooter } from "./components/DashboardFooter";

export type DashboardProps = {
  origin: string;
  indexEnabled: boolean;
  matches: MatchIndexRecord[];
  apiPath: string;
};

export const Dashboard: FC<DashboardProps> = ({
  origin,
  indexEnabled,
  matches,
  apiPath,
}) => (
  <DashboardLayout>
    <div class="wrap">
      <DashboardHeader />
      <DashboardMatchSection
        origin={origin}
        indexEnabled={indexEnabled}
        matches={matches}
      />
      <DashboardFooter apiPath={apiPath} />
    </div>
  </DashboardLayout>
);
