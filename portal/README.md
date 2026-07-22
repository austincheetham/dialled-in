# Dialled In — Portal

Not built yet — see the root `CLAUDE.md` for the plan.

The hub for the whole platform. .NET 10 / ASP.NET Core: Blazor Server admin UI,
minimal API endpoints for the connected extension (`/api/pair/*`, `/api/me`,
`/api/generate`), EF Core + SQLite to start.

Two halves:

- **Outreach hub** — company pitch, personas (prompt templates + tone presets), team
  members, Anthropic key, extension pairing, and a log of every generated draft.
- **Dialer** — progressive cold-calling: a shared call queue dialled via Twilio with
  answering-machine detection, routing answered humans straight to a free browser
  agent over WebRTC. Campaign controls, pacing, and call history.
