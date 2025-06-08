/* background.js */
const LOCAL_DB_KEY = "localDB";
const MAX_LOGS = 1000; // Limit warning logs to prevent storage overflow
const RULE_LIMIT = 5000; // Chrome's dynamic rule limit (approx)

const LocalDB = {
  async init() {
    const data = await chrome.storage.local.get(LOCAL_DB_KEY);
    if (!data[LOCAL_DB_KEY]) {
      await chrome.storage.local.set({
        [LOCAL_DB_KEY]: {
          blacklist: [],
          warningLogs: [],
          sandboxEnabled: true // Default sandbox enabled
        }
      });
    }
  },

  async get() {
    const data = await chrome.storage.local.get(LOCAL_DB_KEY);
    return data[LOCAL_DB_KEY] || { blacklist: [], warningLogs: [], sandboxEnabled: true };
  },

  async addToList(listName, value) {
    const domain = normalizeDomain(value);
    const db = await this.get();
    if (!db[listName].includes(domain)) {
      db[listName].push(domain);
      if (listName === "warningLogs" && db[listName].length > MAX_LOGS) {
        db[listName] = db[listName].slice(-MAX_LOGS); // Trim old logs
      }
      await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
    }
  },

  async removeFromList(listName, value) {
    const db = await this.get();
    const domain = normalizeDomain(value);
    db[listName] = db[listName].filter((item) => normalizeDomain(item) !== domain);
    await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
  },

  async clearList(listName) {
    const db = await this.get();
    db[listName] = [];
    await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
  },

  async toggleSandbox(enabled) {
    const db = await this.get();
    db.sandboxEnabled = enabled;
    await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
  }
};

function normalizeDomain(domain) {
  try {
    const hostname = new URL(domain.startsWith("http") ? domain : `https://${domain}`).hostname;
    const cleaned = hostname.replace(/^www\./, "").toLowerCase();
    console.log(`🔧 Normalizing domain: ${domain} → ${cleaned}`);
    return cleaned;
  } catch {
    console.warn("❌ Invalid domain during normalization:", domain);
    return domain.toLowerCase();
  }
}

function isDomainBlocked(hostname, blacklist) {
  const domain = normalizeDomain(hostname);
  return blacklist.some((blocked) => {
    const b = normalizeDomain(blocked);
    return domain === b || domain.endsWith("." + b);
  });
}

// 🧠 Safe Browsing heuristic
const API_KEY = "AIzaSyAntsO69aXrg3LLQZrRgvT8PGpngbtbyp0"; // TODO: Move to user-configured setting
const SAFE_BROWSING_URL = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;

function isSuspicious(url) {
  const suspiciousPatterns = [
    /login[-.]?(facebook|google|paypal|apple|bank)/i,
    /verify[-.]?(account|info)/i,
    /free[-.]?(gift|voucher|promo|offer)/i,
    /update[-.]?(account|payment)/i,
    /@.*\./,
    /\d{1,3}(\.\d{1,3}){3}(:\d+)?/i, // Refined: IPs with odd ports are suspicious
    /\.xyz|\.top|\.ru|\.win|\.click$/i,
    /[\w-]{20,}\.com/,
  ];
  return suspiciousPatterns.some((regex) => regex.test(url));
}

async function isUrlSafe(url) {
  const requestBody = {
    client: {
      clientId: "safebrowse-guardian",
      clientVersion: "1.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    const res = await fetch(SAFE_BROWSING_URL, {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    const isSafe = !data.matches;
    if (!isSafe) return false;
    return !isSuspicious(url); // Combine with heuristic if API says safe
  } catch (error) {
    console.error("Safe Browsing check failed:", error);
    return !isSuspicious(url); // Fallback to heuristic on error
  }
}

// ⚙️ Service Worker logic
let cachedBlacklist = [];

async function updateDynamicRules(blacklist) {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map(r => r.id);
  const newRules = blacklist.slice(0, RULE_LIMIT).map((domain, idx) => ({
    id: idx + 1,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ["main_frame", "script", "sub_frame", "image", "xmlhttprequest"]
    }
  }));

  if (blacklist.length > RULE_LIMIT) {
    console.warn(`⚠️ Blacklist exceeds ${RULE_LIMIT} rules; only first ${RULE_LIMIT} applied`);
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: newRules
  });
  console.log("📦 Declarative rules updated:", newRules.length);
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log("🛡️ SafeBrowse Guardian installed");
  await LocalDB.init();
  const db = await LocalDB.get();
  cachedBlacklist = db.blacklist.map(normalizeDomain);
  console.log("✅ Cached Blacklist:", cachedBlacklist);
  await updateDynamicRules(cachedBlacklist);
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "local" && changes.localDB) {
    const newDB = changes.localDB.newValue || {};
    cachedBlacklist = newDB.blacklist?.map(normalizeDomain) || [];
    console.log("🔄 Blacklist updated:", cachedBlacklist);
    await updateDynamicRules(cachedBlacklist);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_URL") {
    const originalUrl = message.url;
    resolveFinalUrl(originalUrl).then((finalUrl) => {
      LocalDB.get().then((db) => {
        isUrlSafe(finalUrl).then((safe) => {
          console.log("🔍 Checking:", originalUrl, "→", finalUrl);
          console.log("SafeBrowsing/Heuristic:", safe);
          if (!safe) {
            LocalDB.addToList("warningLogs", finalUrl);
          }
          sendResponse({ safe, finalUrl });
        });
      });
    });
    return true; // async
  } else if (message.type === "LOG") {
    console.log(message.message);
  } else if (message.type === "ADD_TO_BLACKLIST") {
    LocalDB.addToList("blacklist", message.url).then(() => {
      sendResponse({ success: true });
    });
    return true; // async
  } else if (message.type === "GET_BLACKLIST") {
    LocalDB.get().then((db) => {
      sendResponse({ blacklist: db.blacklist });
    });
    return true; // async
  }
});

async function resolveFinalUrl(inputUrl) {
  try {
    if (!/^https?:\/\//i.test(inputUrl)) return inputUrl;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    const response = await fetch(inputUrl, {
      method: "HEAD",
      redirect: "follow",
      mode: "cors",
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response.url || inputUrl;
  } catch (error) {
    console.warn("Redirect resolution failed:", error);
    return inputUrl;
  }
}

chrome.webNavigation.onCommitted.addListener((details) => {
  console.log("🌐 Page visited:", details.url);
}, { url: [{ schemes: ["http", "https"] }] });

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  const matched = info.rule;
  const url = info.request?.url;
  console.log(`🧠 Rule matched: [ID ${matched.ruleId}] for URL → ${url}`);
});