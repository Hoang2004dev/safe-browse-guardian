// content/messageListener.ts
import { showWarningPopup } from "../popup/popup";
import { showScanResultPopup } from "../popup/popupScan";

export function initMessageListener() {
  chrome.runtime.onMessage.addListener((msg) => {
    
    if (msg.type === "SHOW_WARNING") {
      showWarningPopup(
        msg.message,
        msg.url,
        () => { window.location.href = msg.url; },
        async () => {
          await chrome.runtime.sendMessage({ type: "ADD_TO_BLACKLIST", url: msg.url });
        },
        msg.level || "warning"
      );
    }

    if (msg.type === "SHOW_SCAN_RESULT_POPUP") {
      showScanResultPopup(
        msg.title,
        msg.description,
        msg.patternType,
        () => {
          console.log("User closed scan warning popup");
        }
      );
    }
  });
}
