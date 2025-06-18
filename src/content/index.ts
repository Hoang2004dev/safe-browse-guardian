//=================================== index.ts
import { extractRedirectParam, getHostname } from "./dom";
import { showWarningPopup } from "./popup";
import { analyzeUrlInSandbox } from "./sandbox";
import { setupIframeObserver } from "./observer";

document.addEventListener("click", async (event) => {
  const target = (event.target as HTMLElement).closest("a");
  if (!target || !target.href) return;

  event.preventDefault();

  const originalUrl = target.href;
  const redirectUrl = extractRedirectParam(originalUrl);
  const finalUrl = redirectUrl || originalUrl;

  try {
    chrome.runtime.sendMessage({ type: "CHECK_URL", url: finalUrl }, async (res) => {
      const finalUrlResolved = res?.finalUrl || finalUrl;
      const originalHost = getHostname(originalUrl);
      const finalHost = getHostname(finalUrlResolved);

      chrome.storage.local.get("localDB", async ({ localDB }) => {
        const sandboxEnabled = localDB?.sandboxEnabled ?? true;
        let isSafe = res?.safe ?? true;
        let sandbox = null;

        if (sandboxEnabled && !isSafe) {
          sandbox = await analyzeUrlInSandbox(finalUrlResolved);
          isSafe = isSafe && !sandbox.attemptedRedirect && !sandbox.nestedDangerousIframe && !sandbox.externalScript;
        }

        if (isSafe && originalHost === finalHost) {
          window.location.href = finalUrlResolved;
        } else {
          let msg = isSafe
            ? "🔁 Link này sẽ chuyển hướng đến:"
            : "⚠️ Cảnh báo: Link này có thể nguy hiểm!";
          if (sandboxEnabled && sandbox?.details?.length > 0) {
            msg += "<br>Phát hiện hành vi đáng ngờ: " + sandbox.details.join(", ");
          }

          showWarningPopup(
            msg,
            finalUrlResolved,
            () => (window.location.href = finalUrlResolved),
            () =>
              chrome.runtime.sendMessage(
                { type: "ADD_TO_BLACKLIST", url: finalUrlResolved },
                (res) => {
                  if (res?.success) console.log(`✅ Added to blacklist`);
                }
              )
          );
        }
      });
    });
  } catch (err) {
    console.error("❌ Lỗi:", err);
    showWarningPopup("⚠️ Không thể kiểm tra URL. Tiếp tục?", finalUrl,
      () => (window.location.href = finalUrl),
      () => chrome.runtime.sendMessage({ type: "ADD_TO_BLACKLIST", url: finalUrl })
    );
  }
});

setupIframeObserver();
