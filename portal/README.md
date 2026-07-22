# Dialled In — Portal

Not built yet — see the root `CLAUDE.md` for the plan.

.NET 10 / ASP.NET Core: Blazor Server admin UI, minimal API endpoints for the connected
extension (`/api/pair/*`, `/api/me`, `/api/generate`), EF Core + SQLite to start.

Admins manage the company pitch, personas (prompt templates + tone presets), team
members, and the Anthropic key; users pair their extension with a short code; every
generation is logged for review.
