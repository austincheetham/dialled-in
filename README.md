# Dialled In

Cold outreach, done properly — an AI-assisted cold-calling dialer and LinkedIn
messaging in one place.

Two channels, one idea: get sales reps talking to real people faster. The dialer works
a call queue and connects answered humans straight to a free agent; the LinkedIn
extension drafts a personalised message with Claude from the profile you're viewing.
Either way, a human makes the touch — no bulk messaging, no spam automation.

## Parts

| Part | Folder | Status | What it is |
|------|--------|--------|------------|
| **Standalone extension** | [`extension/standalone/`](extension/standalone/) | ✅ Working | Chrome extension, bring your own Anthropic API key. Drafts personalised LinkedIn outreach, fully local. |
| **Connected extension** | [`extension/connected/`](extension/connected/) | 🚧 Planned | Same experience, but generation goes through the portal — no API key on your machine, settings managed by your team. |
| **Portal** | [`portal/`](portal/) | 🚧 Planned | The hub: web app for teams covering the cold-calling dialer and outreach settings — pitch, personas and tone presets, members, API key, call and message history. |

## Quick start (standalone extension)

1. Download and unzip the extension (or clone this repo).
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and
   pick the `extension/standalone` folder.
3. Click the Dialled In icon → paste your [Anthropic API key](https://console.anthropic.com),
   fill in your name, company, and pitch.
4. Visit any LinkedIn profile, pick a tone, hit **Generate message**.

Full instructions in [`extension/standalone/README.md`](extension/standalone/README.md).

## A note on use

Dialled In assists human outreach — drafting messages one profile at a time and
connecting live calls to live agents. Automated bulk messaging violates LinkedIn's
terms, and nobody likes robocalls. Keep a human in the loop.
