// content/messageListener.ts
import { showWarningPopup } from "../popup/popup";

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
  });
}
