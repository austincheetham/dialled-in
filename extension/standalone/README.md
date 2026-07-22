# Dialled — LinkedIn Message Writer (Chrome extension)

Browse to any LinkedIn profile, click the pulse button, get a personalised
outreach message drafted by Claude from what's visible on the page.

## Install (unpacked, for development)

1. Unzip this folder somewhere permanent (Chrome reads it from disk).
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick this folder.
5. Click the Dialled icon in the toolbar → the settings page opens.
6. Paste your **Anthropic API key** (from https://console.anthropic.com),
   fill in your name / company / pitch, and save.

## Use

1. Open LinkedIn — a pulsing button appears bottom-right on any page.
2. Go to a profile at `linkedin.com/in/...` (no refresh needed); the **Generate**
   button lights up only on profile pages.
3. Click it, pick a tone (Friendly / Direct / Curious / Witty), hit **Generate message**.
   **Witty** is the odd one out: instead of forcing personalisation, it leads with
   honesty and dry self-awareness about the (often unglamorous) problem you solve —
   aiming for a half-smile and a reply, not a standing ovation.
4. Edit the draft in the panel, hit **Copy**, paste into a LinkedIn
   connection note or InMail.

Tip: scroll the profile once before generating — LinkedIn lazy-loads the
About and Experience sections, and the more the extension can read, the
more specific the message.

## How it works

- `content.js` runs on all of `linkedin.com` so the button is there the moment
  you arrive, but only enables generation on profile pages (`/in/*`) — it watches
  LinkedIn's client-side navigation so there's no need to refresh. It reads the visible DOM
  (name, headline, about, experience, recent activity) — nothing is
  scraped in bulk and nothing leaves your machine except the single API
  call to Anthropic.
- `background.js` holds the API call so your key never touches the
  LinkedIn page context. The key lives in `chrome.storage.sync`.
- Default model is Haiku 4.5 (fast, ~fraction of a penny per message);
  switch to Sonnet in settings if you want sharper drafts.

## Known limitations

- LinkedIn changes its DOM frequently. The scraper is written defensively
  (anchor-id based, with fallbacks), but if a section comes back empty,
  the selectors in `scrapeProfile()` in `content.js` are the place to fix.
- Works on standard profile pages; Sales Navigator uses a different DOM
  and isn't covered yet.

## A note on use

This drafts messages from profiles you're already viewing, one at a time,
with you editing and sending manually — keep it that way. Automated bulk
messaging violates LinkedIn's terms and gets accounts restricted fast.
