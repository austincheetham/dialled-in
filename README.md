# Dialled In

AI-drafted LinkedIn outreach — personalised, one profile at a time, always sent by a human.

Browse to a LinkedIn profile, click the button, and get an outreach message drafted by
Claude from what's visible on the page. You edit it, you send it. No bulk messaging, no
automation — just a faster first draft.

## Parts

| Part | Folder | Status | What it is |
|------|--------|--------|------------|
| **Standalone extension** | [`extension/standalone/`](extension/standalone/) | ✅ Working | Chrome extension, bring your own Anthropic API key. Everything runs locally in your browser. |
| **Connected extension** | [`extension/connected/`](extension/connected/) | 🚧 Planned | Same experience, but generation goes through the portal — no API key on your machine, settings managed by your team. |
| **Portal** | [`portal/`](portal/) | 🚧 Planned | Web app for teams: manage the pitch, personas and tone presets, members, and the API key; review every generated draft. |

## Quick start (standalone)

1. Download and unzip the extension (or clone this repo).
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and
   pick the `extension/standalone` folder.
3. Click the Dialled In icon → paste your [Anthropic API key](https://console.anthropic.com),
   fill in your name, company, and pitch.
4. Visit any LinkedIn profile, pick a tone, hit **Generate message**.

Full instructions in [`extension/standalone/README.md`](extension/standalone/README.md).

## A note on use

This tool drafts messages from profiles you're already viewing, one at a time, with you
editing and sending manually — keep it that way. Automated bulk messaging violates
LinkedIn's terms and gets accounts restricted fast.
