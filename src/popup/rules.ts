//=================================== rules.ts
import { getDB } from "./storage";

export async function syncDynamicRulesFromLocalDB() {
  const db = await getDB();
  const blacklist = db.blacklist.map((d: string) => d.toLowerCase());
  const allRuleIds = Array.from({ length: 100 }, (_, i) => i + 1);

  if (blacklist.length === 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: allRuleIds,
    });
    return;
  }

  const rules = blacklist.map((domain: string, idx: number) => ({
    id: idx + 1,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ["main_frame", "script", "sub_frame", "image", "xmlhttprequest"],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: allRuleIds,
    addRules: rules,
  });
}
