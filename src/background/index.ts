//=================================== index.ts
import { LocalDB } from "./db";
import { normalizeDomain } from "./urlUtils";
import { updateDynamicRules } from "./rules";
import { registerMessageHandlers } from "./messageHandler";

let cachedBlacklist: string[] = [];

chrome.runtime.onInstalled.addListener(async () => {
  console.log("🛡️ SafeBrowse Guardian installed");
  await LocalDB.init();
  const db = await LocalDB.get();
  cachedBlacklist = db.blacklist.map(normalizeDomain);
  await updateDynamicRules(cachedBlacklist);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "local" && changes.localDB) {
    const db = changes.localDB.newValue || {};
    cachedBlacklist = db.blacklist?.map(normalizeDomain) || [];
    await updateDynamicRules(cachedBlacklist);
  }
});

chrome.webNavigation.onCommitted.addListener(
  (details) => {
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
