const FIELDS = ["apiKey", "senderName", "senderRole", "senderCompany", "pitch", "model", "maxWords"];

const DEFAULTS = {
  apiKey: "",
  senderName: "",
  senderRole: "",
  senderCompany: "",
  pitch: "",
  model: "claude-haiku-4-5-20251001",
  maxWords: 80
};

document.addEventListener("DOMContentLoaded", async () => {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  for (const f of FIELDS) {
    document.getElementById(f).value = stored[f];
  }
});

document.getElementById("save").addEventListener("click", async () => {
  const data = {};
  for (const f of FIELDS) {
    data[f] = document.getElementById(f).value.trim();
  }
  data.maxWords = Math.min(200, Math.max(30, parseInt(data.maxWords, 10) || 80));
  await chrome.storage.sync.set(data);
  const status = document.getElementById("status");
  status.classList.add("show");
  setTimeout(() => status.classList.remove("show"), 1800);
});
