// Dialled — background service worker
// Makes the Claude API call (keeps the key out of the page context
// and avoids CORS issues from the content script).

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GENERATE_MESSAGE") {
    generateVariants(msg.profile, msg.tone, msg.msgType)
      .then((variants) => sendResponse({ ok: true, variants }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true; // keep the channel open for the async response
  }
  if (msg.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
  }
});

const MSG_TYPES = {
  connection: {
    label: "connection request note",
    constraint:
      "HARD LIMIT: 280 characters per message (LinkedIn cuts connection notes at 300 — leave headroom). One or two sentences. No greeting line needed beyond 'Hi {first name}'."
  },
  inmail: {
    label: "InMail / direct message",
    constraint: "WORD_LIMIT" // filled in from settings
  },
  followup: {
    label: "follow-up message after a cold call or previous touch",
    constraint:
      "WORD_LIMIT. Open by referencing the previous touch naturally ('good to speak earlier' / 'tried to catch you on the phone') without inventing specifics of what was said."
  }
};

// The "Witty" tone is a deliberately different approach to most outreach tooling:
// it leads with honesty and dry self-awareness about the problem/situation rather
// than performing personalisation. It overrides the default "open on a profile
// detail" rule and the default three angles (see generateVariants below).
const WITTY_GUIDE = `TONE — witty and honest:
- Witty and honest. Some messages should openly acknowledge this is a cold message. Others should just be dryly self-aware about the unglamorous nature of what we solve. Not every message needs to do both — vary it across the three.
- The goal in every case is a half-smile and a reply, not a standing ovation.
- One light touch maximum. Land it and move on. No exclamation marks after the joke. No puns on their name, title or company.
- Wit targets the problem or the situation, never the person or their team. Never punch down at their current setup or past decisions.
- Never use the word "unsolicited" — it sounds legal and cold in the wrong way.
- If the witty angle doesn't come naturally, just be straight with them. Honesty without the wit still beats polish without either.

Good examples (these happen to be about finance automation — copy the VOICE, never the subject; write about the sender's actual pitch):
"Invoice automation isn't the most exciting thing you'll hear about this week. But saving your finance team hours of manual processing probably is. Worth 15 minutes?"
"I know this is a cold message. We help UK finance teams stop processing invoices by hand. Not glamorous, genuinely useful."
"Nobody ever got excited about supplier statement reconciliation. Plenty of FDs have got excited about what happens when you stop doing it manually though."
"I'll keep it short. We help UK businesses automate invoicing, ordering and statement reconciliation. Unglamorous problem, results tend to speak for themselves."

Bad examples (never do this):
"I hope this message finds you well!" (the opposite of self-aware)
"I know you're busy, but..." (false humility, everyone uses it)
"Still drowning in manual invoices? We've got the lifejacket!" (tries too hard, punches at their situation)`;

async function generateVariants(profile, tone, msgType) {
  const settings = await chrome.storage.sync.get({
    apiKey: "",
    senderName: "",
    senderRole: "",
    senderCompany: "",
    pitch: "",
    model: "claude-haiku-4-5-20251001",
    maxWords: 80
  });

  if (!settings.apiKey) throw new Error("NO_KEY");

  const typeDef = MSG_TYPES[msgType] || MSG_TYPES.inmail;
  const constraint = typeDef.constraint.replace(
    "WORD_LIMIT",
    `Maximum ${settings.maxWords} words. Shorter is better.`
  );

  const isWitty = tone === "Witty";

  // The witty tone leads with honesty/self-awareness instead of forced
  // personalisation, so it relaxes the opener rule and redefines the 3 angles.
  const openingRule = isWitty
    ? "You do NOT need to open on a profile detail. Earn attention by either openly acknowledging this is a cold message, or being dryly self-aware about the unglamorous problem you solve. Use profile facts only where they genuinely fit."
    : 'Open with something specific to THIS person\'s profile (their role, company, a post, career move) — never "I came across your profile".';

  const toneRule = isWitty ? WITTY_GUIDE : `Tone requested: ${tone}.`;

  const angles = isWitty
    ? `1. one that openly acknowledges this is a cold message,
2. one that is dryly self-aware about how unglamorous the problem is,
3. one that is just straight and honest, with little or no wit (a forced joke is worse than none).`
    : `1. anchored on their current role/company,
2. anchored on the most specific detail available (a post, career move, niche in their about section),
3. the boldest/most direct version.`;

  const system = `You write short, personalised LinkedIn outreach messages.

You are writing a ${typeDef.label}.

Rules:
- ${constraint}
- ${openingRule}
- One clear reason for reaching out, one soft call to action (a question works best).
- No bullet points, no subject line, no sign-off block — just the message body ending with the sender's first name.
- Sound like a human typing on their phone, not a marketing email. British English.
- Never use em dashes or double hyphens (— or --). Use commas, full stops, or brackets instead.
- Never invent facts about the prospect that aren't in the profile data.
- ${toneRule}

OUTPUT FORMAT — follow exactly:
Return a JSON array of exactly 3 strings, each a complete alternative message taking a DIFFERENT angle:
${angles}
If the profile data is too sparse to differentiate angles, still return 3 honest variations in phrasing.
Return ONLY the raw JSON array — no markdown fences, no commentary, no keys, nothing else. Never refuse, never explain.`;

  const senderInfo = [
    settings.senderName && `Name: ${settings.senderName}`,
    settings.senderRole && `Role: ${settings.senderRole}`,
    settings.senderCompany && `Company: ${settings.senderCompany}`,
    settings.pitch && `What I do / why I reach out: ${settings.pitch}`
  ].filter(Boolean).join("\n");

  const userPrompt = `SENDER (me):
${senderInfo || "(no sender details provided — keep the message generic about the sender, specific about the prospect)"}

PROSPECT (LinkedIn profile I'm viewing):
${JSON.stringify(profile, null, 2)}

Write the 3 message variants now as a raw JSON array of 3 strings.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: settings.model,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) throw new Error("BAD_KEY");
    throw new Error(`API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = (data.content || [])
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  return parseVariants(raw);
}

function parseVariants(raw) {
  // Strip markdown fences if the model added them anyway
  let clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  // Grab the first [...] block in case of stray text
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start !== -1 && end > start) clean = clean.slice(start, end + 1);

  try {
    const arr = JSON.parse(clean);
    if (Array.isArray(arr)) {
      const strings = arr.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim());
      if (strings.length) return strings.slice(0, 3);
    }
  } catch (_) {
    // fall through
  }
  // Last resort: treat the whole output as a single variant
  return [raw];
}
