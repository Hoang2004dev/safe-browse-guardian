//=================================== messageHandle.ts
import { handleCheckUrl } from "./handlers/checkUrlHandler";
import { LocalDB } from "./db";

export function registerMessageHandlers() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      switch (message.type) {
        case "CHECK_URL":
          const result = await handleCheckUrl(message.url);
          sendResponse(result);
          break;

        case "ADD_TO_BLACKLIST":
          await LocalDB.addToList("blacklist", message.url);
          sendResponse({ success: true });
          break;

        case "GET_BLACKLIST":
          const db = await LocalDB.get();
          sendResponse({ blacklist: db.blacklist });
          break;

        case "TOGGLE_EXTENSION":
          await LocalDB.setExtensionEnabled(message.enabled);
          sendResponse({ success: true });
          break;

        case "LOG":
          console.log(message.message);
          break;

        default:
          console.warn("Unrecognized message type:", message.type);
      }
    })();

    return true; 
  });
}
