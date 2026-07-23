# Dialled In — Portal

The hub for the whole platform. .NET 10 Aspire solution — see the root `CLAUDE.md`
for the plan. Currently scaffolding: holding pages only.

| Project | What it is |
|---------|------------|
| `DialledIn.Portal.AppHost` | Aspire orchestrator — run this and it launches everything. |
| `DialledIn.Portal.Web` | Blazor Server frontend (`portal-web`) — holding pages for Dialer, Outreach, Team, Activity, Settings. |
| `DialledIn.Portal.ApiService` | Web API backend (`portal-api`) — `/api/status` for now; `/api/pair/*`, `/api/me`, `/api/generate` to come. |
| `DialledIn.Portal.ServiceDefaults` | Shared Aspire wiring (telemetry, health checks, service discovery). |

## Run

```powershell
dotnet run --project DialledIn.Portal.AppHost
```

The Aspire dashboard opens with both services; click the `portal-web` endpoint for
the site.

Two halves:

- **Outreach hub** — company pitch, personas (prompt templates + tone presets), team
  members, Anthropic key, extension pairing, and a log of every generated draft.
  Upload files (product sheets, case studies, past messages) and define a tone of
  voice — generation pulls from both, so drafts understand the products and sound
  like the sender.
- **Dialer** — progressive cold-calling: a shared call queue dialled via Twilio with
  answering-machine detection, routing answered humans straight to a free browser
  agent over WebRTC. Campaign controls, pacing, and call history.
