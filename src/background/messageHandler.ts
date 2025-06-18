//=================================== messageHandle.ts
import { isUrlSafe } from "./safeBrowsing";
import { resolveFinalUrl } from "./urlUtils";
import { LocalDB } from "./db";

export function registerMessageHandlers() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CHECK_URL") {
      resolveFinalUrl(message.url).then((finalUrl) => {
        LocalDB.get().then((db) => {
          isUrlSafe(finalUrl).then((safe) => {
            if (!safe) LocalDB.addToList("warningLogs", finalUrl);
            sendResponse({ safe, finalUrl });
          });
        });
      });
      return true;
    }

    if (message.type === "LOG") {
      console.log(message.message);
    }

    if (message.type === "ADD_TO_BLACKLIST") {
      LocalDB.addToList("blacklist", message.url).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.type === "GET_BLACKLIST") {
      LocalDB.get().then((db) => {
        sendResponse({ blacklist: db.blacklist });
      });
      return true;
    }
  });
}
