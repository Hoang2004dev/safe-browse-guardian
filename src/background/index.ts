//=================================== index.ts
import { LocalDB } from "./db";
import { normalizeDomain } from "./urlUtils";
import { updateDynamicRules } from "./rules";
import { registerMessageHandlers } from "./messageHandler";

let cachedBlacklist: string[] = [];
let isPaused: boolean = false;
let lastVisitedUrl: string = ""; 

chrome.runtime.onInstalled.addListener(async () => {
  console.log("🛡️ SafeBrowse Guardian installed");
  await LocalDB.init();
  const db = await LocalDB.get();
  cachedBlacklist = db.blacklist.map(normalizeDomain);
  isPaused = db.paused ?? false;
  await updateDynamicRules(cachedBlacklist);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "local" && changes.localDB) {
    const db = changes.localDB.newValue || {};
    cachedBlacklist = db.blacklist?.map(normalizeDomain) || [];
    isPaused = db.paused ?? false;
    await updateDynamicRules(cachedBlacklist);
  }
});

chrome.webNavigation.onCommitted.addListener(
  (details) => {
    if (isPaused) {
      console.log("Extension paused. Skipping URL processing.");
      return;
    }
    if (details.url === lastVisitedUrl) {
      console.log("🚫 Page reload detected. Skipping URL processing.");
      return;
    }
    lastVisitedUrl = details.url;
    console.log("🌐 Page visited:", details.url);
  },
  { url: [{ schemes: ["http", "https"] }] }
);

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  const matched = info.rule;
  const url = info.request?.url;
  console.log(`🧠 Rule matched: [ID ${matched.ruleId}] for URL → ${url}`);
});

registerMessageHandlers();
