// popup/storage.ts

export interface LocalDBSchema {
  blacklist: string[];
  warningLogs: string[];
  sandboxEnabled: boolean;
  blockedCount?: number;
  threatCount?: number;
  extensionEnabled?: boolean;
}

export async function getDB(): Promise<LocalDBSchema> {
  return new Promise((resolve) => {
    chrome.storage.local.get("localDB", (data) => {
      const db = data.localDB || {
        blacklist: [],
        warningLogs: [],
        sandboxEnabled: true,
        blockedCount: 0,
        threatCount: 0,
        extensionEnabled: true,
      };

      if (typeof db.extensionEnabled !== "boolean") db.extensionEnabled = true;

      resolve(db);
    });
  });
}

export async function setDB(db: LocalDBSchema): Promise<void> {
  return chrome.storage.local.set({ localDB: db });
}
