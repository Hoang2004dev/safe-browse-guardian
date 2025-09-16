//=================================== observer.ts
import { waitForBody, getHostname } from "./dom";
import { safeSendMessage } from "../shared/utils/safeSendMessage";

interface BlacklistResponse {
  blacklist: string[];
}

export async function setupIframeObserver(): Promise<void> {
  await waitForBody();
  let lastCheck = 0;

  const observer = new MutationObserver(async () => {
    const now = Date.now();
    if (now - lastCheck < 100) return;
    lastCheck = now;

    try {
      // Đảm bảo safeSendMessage trả về đúng kiểu BlacklistResponse
      const res = await safeSendMessage<BlacklistResponse>({ type: "GET_BLACKLIST" }).catch((err) => {
        console.error("❌ Failed to get blacklist:", err);
        return null;
      });

      if (!res) return;

      const blacklist = res?.blacklist ?? [];

      document.querySelectorAll("iframe").forEach(async (iframe) => {
        const src = iframe.src || "";
        const host = getHostname(src);
        const blocked = blacklist.some((b) => host === b || host.endsWith("." + b));
        
        if (blocked) {
          await safeSendMessage({ type: "LOG", message: `🚫 Blocked iframe: ${src}` }).catch((err) =>
            console.error("❌ Failed to log blocked iframe:", err)
          );
          iframe.remove();
        }
      });
    } catch (err) {
      console.error("❌ Error while checking iframes:", err);
    }
  });

  try {
    // Theo dõi sự thay đổi của body DOM
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (err) {
    console.error("❌ Failed to start iframe observer:", err);
  }
}