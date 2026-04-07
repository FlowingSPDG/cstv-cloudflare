# Security

If you believe you have found a security vulnerability, please **do not** open a public issue.

Instead, contact the maintainers privately (e.g. via GitHub Security Advisories for this repository, if enabled, or the email listed in the maintainer profile).

Include:

- A short description of the issue and its impact
- Steps to reproduce (proof-of-concept) where possible
- Affected versions or deployment shape (Workers / Durable Objects, etc.)

**Operational note:** Restrict who can `POST` to your `/gotv/...` ingest URLs (firewall, Cloudflare Access, or IP allowlists in addition to `X-Origin-Auth`). Public viewers only need `GET`.
