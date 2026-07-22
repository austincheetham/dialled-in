# Dialled In

| Part | Folder | Status | What it is |
|------|--------|--------|------------|
| **Standalone extension** | `extension/standalone/` | ✅ Working | Chrome MV3 extension, BYO Anthropic API key, fully local. Drafts a personalised outreach message from the LinkedIn profile being viewed. |
| **Connected extension** | `extension/connected/` | 📝 Planned | Same in-page experience, but sends the scraped profile to the portal, which generates from centrally managed settings. No API key on the user's machine. |
| **Portal** | `portal/` | 📝 Planned | The hub: web app + API behind the connected extension, plus the cold-calling dialer — call queue, agents, campaign settings, call and message history. |

Guardrail across everything: **a human makes the touch**. Messages are drafted one
profile at a time and sent manually; calls connect answered humans to live agents.
No bulk or automated messaging, ever.

## Extensions

Chrome MV3, vanilla JS, no build step — load unpacked from `chrome://extensions`.

- `content.js` runs on `linkedin.com`, enables generation only on `/in/*` profile pages;
  `scrapeProfile()` reads the visible DOM and is the place to fix when LinkedIn changes
  its markup.
- `background.js` is the service worker that makes the generate call (standalone:
  Anthropic API directly, key in `chrome.storage.sync`; connected: the portal's
  `/api/generate`). Keys/tokens never enter the LinkedIn page context.
- `content.js`, `content.css`, and icons stay identical between the two editions — if
  you change one, mirror it in the other.

## Portal (planned)

.NET 10 / ASP.NET Core: Blazor Server admin UI, minimal API endpoints for the
extension, EF Core + SQLite to start. Anthropic key lives server-side (user-secrets
locally, environment in production).

Two halves:

- **Outreach hub** — an admin manages the company pitch, personas (prompt templates +
  tone presets), team members, and the Anthropic key; users pair their extension with a
  short code; every generation is logged for review. Admins also upload knowledge files
  (product sheets, case studies, example messages) and define a tone of voice — both
  feed the generation prompt so drafts understand the products and sound like the
  sender. Extension-facing API is `/api/pair/*`, `/api/me`, and `/api/generate`.
- **Dialer** — progressive cold-calling: a central engine works a shared call queue,
  places calls via Twilio with answering-machine detection, and routes each answered
  human straight to a free browser agent over WebRTC. Campaign controls, pacing, and
  call history live in the same admin UI.

## Conventions

- Secrets never get committed — no API keys or Twilio credentials in code, manifests,
  or appsettings.
- When touching anything that calls the Claude API or names a model, check current
  model IDs and pricing rather than assuming.
