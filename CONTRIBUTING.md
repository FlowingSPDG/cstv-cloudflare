# Contributing

1. Fork the repository and create a branch for your change.
2. Run `npm install` and `npm run check` before opening a PR.
3. Use `npm run dev` with a local `.dev.vars` (see `.dev.vars.example`) to exercise ingest and playcast paths.
4. Do not commit `.dev.vars`, API tokens, or Cloudflare account IDs.

Pull requests that adjust GOTV+ HTTP behavior should note compatibility with [Valve’s broadcast documentation](https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Broadcast) and, where relevant, [gotv-plus-go](https://github.com/FlowingSPDG/gotv-plus-go).
