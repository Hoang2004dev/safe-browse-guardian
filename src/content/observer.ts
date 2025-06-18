//=================================== observer.ts
import { waitForBody, getHostname } from "./dom";

export async function setupIframeObserver() {
  await waitForBody();
  let lastCheck = 0;

  const observer = new MutationObserver(() => {
    const now = Date.now();
    if (now - lastCheck < 100) return;
    lastCheck = now;

    chrome.runtime.sendMessage({ type: "GET_BLACKLIST" }, ({ blacklist }) => {
      document.querySelectorAll("iframe").forEach((iframe) => {
        const src = iframe.src || "";
        const host = getHostname(src);
        const blocked = blacklist.some((b: string) => host === b || host.endsWith("." + b));
        if (blocked) {
          chrome.runtime.sendMessage({ type: "LOG", message: `🚫 Blocked iframe: ${src}` });
          iframe.remove();
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
