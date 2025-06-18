//=================================== storage.ts
export async function getDB() {
  return new Promise<any>((resolve) => {
    chrome.storage.local.get("localDB", (data) => {
      resolve(
        data.localDB || {
          blacklist: [],
          warningLogs: [],
          sandboxEnabled: true,
        }
      );
    });
  });
}

export async function setDB(db: any) {
  return chrome.storage.local.set({ localDB: db });
}
