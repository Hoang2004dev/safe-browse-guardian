//=================================== messageHandle.ts
import { handleCheckUrl } from "./handlers/checkUrlHandler";
import { LocalDB } from "./db";
import { updateDynamicRules } from "./rules";
import { normalizeDomain } from "./urlUtils";

export function registerMessageHandlers() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handleMessage = async () => {
      try{
        const db = await LocalDB.get();
        const isPaused = db.extensionEnabled === false;

        if (isPaused && message.type !== 'TOGGLE_PAUSE' && message.type !== "GET_STATE") {
          // Nếu extension đang pause, chỉ trả về lỗi hoặc từ chối các hành động khác
          sendResponse({ error: "Extension is paused, cannot process request." });
          return;
        }
      switch (message.type) {
        case "CHECK_URL":
          const result = await handleCheckUrl(message.url);
          const dbb = await LocalDB.get();
          const newCount = (dbb.checkedCount ?? 0) + 1;
          dbb.checkedCount = newCount;
          await LocalDB.set(dbb);
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
        
        case "REFRESH_DB": {
          const db = await LocalDB.get();
          await updateDynamicRules(db.blacklist.map(normalizeDomain));
          sendResponse({ success: true, count: db.blacklist.length });
          break;
        }

        case "GET_STATE": {
          const db = await LocalDB.get();
          sendResponse({ extensionEnabled: db.extensionEnabled });
          break;
        }

        case "TOGGLE_PAUSE": {
          const db = await LocalDB.get();
          const newState = !db.extensionEnabled;
          await LocalDB.setExtensionEnabled(newState);
          sendResponse({ success: true, extensionEnabled: newState });

          chrome.tabs.query({}, (tabs) => {
          for (const tab of tabs) {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: "STATE_CHANGED",
                extensionEnabled: newState,
              }).catch(() => {
                // Tab này không có content script → bỏ qua
              });
            }
          }
        });
            
          console.log("Before:", db.extensionEnabled, "→ After:", newState);
          break;
        }
        
        case "LOG":
          console.log(message.message);
          break;

        default:
          console.warn("Unrecognized message type:", message.type);
      }
    }
    catch (err: any) {
        console.error("❌ Error in message handler:", err);
        sendResponse({ error: err?.message || "Unknown error" });
      }
    };
    
    handleMessage();
    return true; 
  });
}
