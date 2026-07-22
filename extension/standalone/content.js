// Dialled — content script for linkedin.com
// Injects a floating pulse button as soon as you land anywhere on LinkedIn.
// Generation is only enabled on profile pages (/in/*); clicking generate
// scrapes the visible profile, asks the background worker for a message,
// and shows it in a slide-in panel with copy + regenerate.
// LinkedIn is a SPA, so we watch for client-side navigation and re-gate
// the button without needing a full page refresh.

(() => {
  if (window.__dialledInjected) return;
  window.__dialledInjected = true;

  const TONES = ["Friendly", "Direct", "Curious", "Witty"];
  let currentTone = "Friendly";
  let currentType = "connection";
  let variants = [];
  let activeVariant = 0;

  // Profile pages live under linkedin.com/in/<slug>. Generation is gated on this.
  const isProfilePage = () => /^\/in\/[^/]+/.test(location.pathname);

  // ---------- profile scraping (defensive — LinkedIn DOM shifts often) ----------

  const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");

  function sectionByAnchor(id) {
    const anchor = document.getElementById(id);
    return anchor ? anchor.closest("section") : null;
  }

  // Fallback: find a <section> whose heading text starts with the given word
  function sectionByHeading(word) {
    const re = new RegExp("^" + word, "i");
    for (const sec of document.querySelectorAll("main section")) {
      const h = sec.querySelector("h2, h3, .pvs-header__title, [aria-hidden='true']");
      if (h && re.test(txt(h))) return sec;
    }
    return null;
  }

  function scrapeProfile() {
    const name =
      txt(document.querySelector("main h1")) ||
      (document.title.split("|")[0] || "").replace(/\(\d+\).*/, "").trim();

    // Headline: known class, then any short line in the top card after the name
    let headline = txt(
      document.querySelector("main .text-body-medium.break-words") ||
      document.querySelector("main [data-generated-suggestion-target]")
    );

    const location = txt(
      document.querySelector("main .text-body-small.inline.t-black--light.break-words")
    );

    // Whole top card as a safety net — name block, headline, company, location
    const topCardEl = document.querySelector("main section");
    let topCard = topCardEl ? (topCardEl.innerText || "").replace(/\s+/g, " ").trim().slice(0, 600) : "";
    if (!headline && topCard) {
      // best-effort: text between the name and the first button-ish word
      headline = topCard.split(name).pop().split(/Connect|Message|Follow|More/)[0].trim().slice(0, 160);
    }

    const aboutSec = sectionByAnchor("about") || sectionByHeading("About");
    const about = txt(aboutSec)
      .replace(/^About/i, "")
      .replace(/…see more$/i, "")
      .trim()
      .slice(0, 1200);

    const expSection = sectionByAnchor("experience") || sectionByHeading("Experience");
    let experience = [];
    if (expSection) {
      experience = [...expSection.querySelectorAll("li.artdeco-list__item")]
        .slice(0, 4)
        .map((li) => txt(li).slice(0, 220));
      if (!experience.length) {
        // class fallback: any list items, or the section's raw text
        experience = [...expSection.querySelectorAll("li")].slice(0, 4).map((li) => txt(li).slice(0, 220));
        if (!experience.length) experience = [txt(expSection).replace(/^Experience/i, "").trim().slice(0, 600)];
      }
    }

    const activitySection =
      sectionByAnchor("content_collections") ||
      sectionByAnchor("recent_activity") ||
      sectionByHeading("Activity");
    const recentActivity = activitySection
      ? [...activitySection.querySelectorAll("li")].slice(0, 2).map((li) => txt(li).slice(0, 260)).filter(Boolean)
      : [];

    const profile = { name, headline, location, about, experience, recentActivity, url: window.location.href.split("?")[0] };

    // How much usable signal did we get? (used to warn the user pre-generate)
    profile._signal = [headline, about, experience.join(""), recentActivity.join(""), topCard]
      .join("").length;
    if (!headline && !about && !experience.length) profile.topCard = topCard;

    return profile;
  }

  // ---------- UI ----------

  const root = document.createElement("div");
  root.id = "dialled-root";
  root.innerHTML = `
    <button id="dialled-fab" title="Generate a personalised message" aria-label="Generate a personalised message with Dialled">
      <span class="dialled-pulse">
        <span class="ring r3"></span><span class="ring r2"></span><span class="dot"></span>
      </span>
    </button>

    <div id="dialled-panel" hidden>
      <div class="dialled-head">
        <span class="dialled-logo">D<span class="dialled-i"><i class="stem"></i><i class="pip"></i></span>alled</span>
        <button class="dialled-x" id="dialled-close" aria-label="Close">✕</button>
      </div>

      <div class="dialled-types" role="tablist" aria-label="Message type">
        <button class="dialled-type on" data-mtype="connection">Connection<br><span>≤300 chars</span></button>
        <button class="dialled-type" data-mtype="inmail">InMail / DM</button>
        <button class="dialled-type" data-mtype="followup">Follow-up</button>
      </div>

      <div class="dialled-tones" role="tablist" aria-label="Message tone">
        ${TONES.map((t, i) => `<button class="dialled-tone${i === 0 ? " on" : ""}" data-tone="${t}">${t}</button>`).join("")}
      </div>

      <div id="dialled-body">
        <p class="dialled-hint">Pick a tone, then generate. The message is drafted from what's visible on this profile.</p>
      </div>

      <div class="dialled-actions">
        <button id="dialled-generate" class="dialled-primary">Generate 3 drafts</button>
        <button id="dialled-copy" class="dialled-ghost" hidden>Copy</button>
      </div>
      <button id="dialled-settings" class="dialled-link">Settings</button>
    </div>
  `;
  document.documentElement.appendChild(root);

  const panel = root.querySelector("#dialled-panel");
  const body = root.querySelector("#dialled-body");
  const genBtn = root.querySelector("#dialled-generate");
  const copyBtn = root.querySelector("#dialled-copy");

  root.querySelector("#dialled-fab").addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });
  root.querySelector("#dialled-close").addEventListener("click", () => (panel.hidden = true));
  root.querySelector("#dialled-settings").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
  });

  root.querySelectorAll(".dialled-tone").forEach((btn) =>
    btn.addEventListener("click", () => {
      root.querySelectorAll(".dialled-tone").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      currentTone = btn.dataset.tone;
    })
  );

  root.querySelectorAll(".dialled-type").forEach((btn) =>
    btn.addEventListener("click", () => {
      root.querySelectorAll(".dialled-type").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      currentType = btn.dataset.mtype;
    })
  );

  genBtn.addEventListener("click", generate);

  copyBtn.addEventListener("click", async () => {
    const ta = body.querySelector("textarea");
    const text = ta ? ta.value : (variants[activeVariant] || "");
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  });

  const VARIANT_LABELS = ["Role hook", "Detail hook", "Bold"];

  function renderVariants() {
    const text = variants[activeVariant] || "";
    const isConn = currentType === "connection";
    body.innerHTML = `
      <div class="dialled-variants" role="tablist" aria-label="Message variants">
        ${variants.map((_, i) =>
          `<button class="dialled-variant${i === activeVariant ? " on" : ""}" data-v="${i}">${VARIANT_LABELS[i] || "Alt " + (i + 1)}</button>`
        ).join("")}
      </div>
      <textarea class="dialled-msg" rows="7" aria-label="Generated message">${escapeHtml(text)}</textarea>
      <p class="dialled-hint"><span id="dialled-count"></span>Edit it here before you send — small tweaks make it yours.</p>`;

    const ta = body.querySelector("textarea");
    const count = body.querySelector("#dialled-count");

    const updateCount = () => {
      // keep edits to the active variant so tab-switching doesn't lose them
      variants[activeVariant] = ta.value;
      if (!isConn) { count.textContent = ""; return; }
      const n = ta.value.length;
      count.innerHTML = `<b style="color:${n > 300 ? "#ffb3c1" : "#7ee0a3"}">${n}/300 chars</b> · `;
    };
    ta.addEventListener("input", updateCount);
    updateCount();

    body.querySelectorAll(".dialled-variant").forEach((btn) =>
      btn.addEventListener("click", () => {
        activeVariant = parseInt(btn.dataset.v, 10);
        renderVariants();
      })
    );
  }

  async function generate() {
    if (!isProfilePage()) {
      body.innerHTML = `<p class="dialled-hint">Open someone's LinkedIn profile to draft a message — then the button lights up.</p>`;
      return;
    }

    let profile = scrapeProfile();

    if (!profile.name) {
      body.innerHTML = `<p class="dialled-err">Couldn't read this profile — try scrolling the page once so LinkedIn loads it, then generate again.</p>`;
      return;
    }

    genBtn.disabled = true;
    copyBtn.hidden = true;

    // If the page looks sparse, nudge LinkedIn's lazy-loading with a quick
    // scroll down and back, then re-scrape.
    if (profile._signal < 200) {
      genBtn.textContent = "Loading the profile…";
      body.innerHTML = `<div class="dialled-loading"><span class="ringload"></span> Profile looks half-loaded — scrolling to wake it up…</div>`;
      const y = window.scrollY;
      window.scrollTo({ top: document.body.scrollHeight * 0.7 });
      await new Promise((r) => setTimeout(r, 1200));
      window.scrollTo({ top: y });
      await new Promise((r) => setTimeout(r, 300));
      profile = scrapeProfile();
    }

    genBtn.textContent = "Listening to the profile…";
    const readBits = [
      profile.headline && "headline",
      profile.about && "about",
      profile.experience.length && "experience",
      profile.recentActivity.length && "activity"
    ].filter(Boolean);
    const readNote = readBits.length
      ? `Read: ${readBits.join(", ")}.`
      : `Could only read the name — the draft will be thin. Scroll the page fully and regenerate for a better one.`;
    body.innerHTML = `<div class="dialled-loading"><span class="ringload"></span> Drafting a message for <b>${escapeHtml(profile.name)}</b>…</div>
      <p class="dialled-hint">${escapeHtml(readNote)}</p>`;

    chrome.runtime.sendMessage(
      { type: "GENERATE_MESSAGE", profile, tone: currentTone, msgType: currentType },
      (res) => {
        genBtn.disabled = false;
        genBtn.textContent = "Regenerate";

        if (!res || !res.ok) {
          const err = res ? res.error : "No response from the extension.";
          if (err === "NO_KEY") {
            body.innerHTML = `<p class="dialled-err">No API key set yet. Add your Anthropic API key in <b>Settings</b> (link below) and try again.</p>`;
          } else if (err === "BAD_KEY") {
            body.innerHTML = `<p class="dialled-err">That API key was rejected. Check it in <b>Settings</b>.</p>`;
          } else {
            body.innerHTML = `<p class="dialled-err">Something went wrong: ${escapeHtml(err)}</p>`;
          }
          return;
        }

        variants = res.variants;
        activeVariant = 0;
        renderVariants();
        copyBtn.hidden = false;
      }
    );
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- page-state gating (enable generate only on profiles) ----------

  function updatePageState() {
    const onProfile = isProfilePage();
    genBtn.disabled = !onProfile;
    genBtn.title = onProfile ? "" : "Open a LinkedIn profile to draft a message";
    // Only reset the body when no drafts are showing, so we don't wipe results.
    if (!variants.length) {
      body.innerHTML = onProfile
        ? `<p class="dialled-hint">Pick a tone, then generate. The message is drafted from what's visible on this profile.</p>`
        : `<p class="dialled-hint">You're on LinkedIn — open someone's profile (a <b>/in/</b> page) and the <b>Generate</b> button lights up.</p>`;
    }
  }

  // LinkedIn navigates client-side (SPA): the URL changes without a reload.
  // Watch history + popstate so the panel re-gates without a full refresh.
  let lastPath = location.pathname;
  function onNavigate() {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    // New page → previous drafts are stale.
    variants = [];
    activeVariant = 0;
    copyBtn.hidden = true;
    genBtn.textContent = "Generate 3 drafts";
    updatePageState();
  }

  for (const m of ["pushState", "replaceState"]) {
    const orig = history[m];
    history[m] = function (...args) {
      const r = orig.apply(this, args);
      onNavigate();
      return r;
    };
  }
  window.addEventListener("popstate", onNavigate);
  // Fallback for navigations that don't go through history (belt & braces).
  setInterval(onNavigate, 1000);

  updatePageState();
})();
