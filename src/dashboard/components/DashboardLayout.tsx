import type { FC, PropsWithChildren } from "hono/jsx";

export const DashboardLayout: FC<PropsWithChildren> = ({ children }) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>CSTV — Match list</title>
      <link rel="stylesheet" href="/assets/dashboard.css" />
    </head>
    <body>{children}</body>
  </html>
);
