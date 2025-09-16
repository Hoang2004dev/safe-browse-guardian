//=================================== db.ts
import { LOCAL_DB_KEY, MAX_LOGS } from "./constants";
import { normalizeDomain } from "./urlUtils";

export const LocalDB = {
  async init() {
    const data = await chrome.storage.local.get(LOCAL_DB_KEY);
    if (!data[LOCAL_DB_KEY]) {
      await chrome.storage.local.set({
        [LOCAL_DB_KEY]: {
          blacklist: [],
          warningLogs: [],
          sandboxEnabled: true,
          blockedCount: 0,
          threatCount: 0,
          extensionEnabled: true,
          cache: {},
        },
      });
    }
  },

  async get() {
    const data = await chrome.storage.local.get(LOCAL_DB_KEY);
    const db = data[LOCAL_DB_KEY] || {};

    return (
      data[LOCAL_DB_KEY] || {
        blacklist: [],
        warningLogs: [],
        sandboxEnabled: true,
        blockedCount: 0,
        threatCount: 0,
        extensionEnabled: db.extensionEnabled !== false,
      }
    );
  },

  async set(db: any) {
    await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
  },

  async setCacheResult(domain: string, safe: boolean, timestamp: number) {
  const db = await this.get();
  if (!db.cache) {
    db.cache = {};
  }
  db.cache[domain] = { safe, timestamp };
  await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
},

async getCacheResult(domain: string): Promise<{ safe: boolean; timestamp: number } | null> {
  const db = await this.get();
  if (!db.cache) {
    return null;
  }
  return db.cache[domain] || null;
},

  async addToList(listName: string, value: string) {
    const domain = normalizeDomain(value);
    const db = await this.get();
    if (!db[listName].includes(domain)) {
      db[listName].push(domain);
      if (listName === "warningLogs" && db[listName].length > MAX_LOGS) {
        db[listName] = db[listName].slice(-MAX_LOGS);
      }
      await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
    }
  },

  async incrementThreatCount() {
    const db = await this.get();
    db.threatCount = (db.threatCount || 0) + 1;
    await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
  },

  async removeFromList(listName: string, value: string) {
    const db = await this.get();
    const domain = normalizeDomain(value);
    db[listName] = db[listName].filter(
      (item: string) => normalizeDomain(item) !== domain
    );
    await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
  },

  async clearList(listName: string) {
    const db = await this.get();
    db[listName] = [];
    await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
  },

  async toggleSandbox(enabled: boolean) {
    const db = await this.get();
    db.sandboxEnabled = enabled;
    await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
  },

  async setExtensionEnabled(enabled: boolean) {
    const db = await this.get();
    db.extensionEnabled = enabled;
    await chrome.storage.local.set({ [LOCAL_DB_KEY]: db });
  },
};
