//=================================== content/index.ts
import { extractRedirectParam, getHostname } from "./dom";
import { showWarningPopup } from "./popup/popup";
import { analyzeUrlInSandbox } from "./sandbox/index";
import { setupIframeObserver } from "./observer";
import { formatThreatMessage } from "./messageFormatter";

let extensionEnabled = true;
let sandboxEnabled = true;

// Load initial state
chrome.storage.local.get("localDB", ({ localDB }) => {
  extensionEnabled = localDB?.extensionEnabled !== false;
  sandboxEnabled = localDB?.sandboxEnabled ?? true;
});

// Watch for changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.localDB) {
    const db = changes.localDB.newValue;
    extensionEnabled = db?.extensionEnabled !== false;
    sandboxEnabled = db?.sandboxEnabled ?? true;
  }
});

document.addEventListener("click", async (event) => {
  const anchor = (event.target as HTMLElement).closest("a");
  if (!anchor || !anchor.href) return;

  const originalUrl = anchor.href;
  const redirectUrl = extractRedirectParam(originalUrl);
  const finalUrl = redirectUrl || originalUrl;

  if (!extensionEnabled) return; // Extension OFF → skip handling

  event.preventDefault();

  try {
    chrome.runtime.sendMessage(
      { type: "CHECK_URL", url: finalUrl },
      async (res) => {
        const finalUrlResolved = res?.finalUrl || finalUrl;
        const originalHost = getHostname(originalUrl);
        const finalHost = getHostname(finalUrlResolved);
        const issues = res?.issues || [];
        const detail = res?.detail || {};

        let isSafe = res?.safe ?? true;
        let sandbox = null;

        if (sandboxEnabled && !isSafe) {
          sandbox = await analyzeUrlInSandbox(finalUrlResolved);
          isSafe =
            isSafe &&
            !sandbox.attemptedRedirect &&
            !sandbox.nestedDangerousIframe &&
            !sandbox.externalScript;
        }

        if (isSafe && originalHost === finalHost) {
          window.location.href = finalUrlResolved;
        } else {
          const msg = formatThreatMessage(isSafe, { issues, detail, sandbox });
          const level = !isSafe
            ? issues.length >= 2
              ? "critical"
              : "warning"
            : "info";

          showWarningPopup(
            msg,
            finalUrlResolved,
            () => (window.location.href = finalUrlResolved),
            () =>
              chrome.runtime.sendMessage(
                { type: "ADD_TO_BLACKLIST", url: finalUrlResolved },
                (res) => {
                  if (res?.success) console.log("✅ Added to blacklist");
                }
              ),
            level
          );
        }
      }
    );
  } catch (err) {
    console.error("❌ Lỗi:", err);
    showWarningPopup(
      "⚠️ Không thể kiểm tra URL. Tiếp tục?",
      finalUrl,
      () => (window.location.href = finalUrl),
      () =>
        chrome.runtime.sendMessage({ type: "ADD_TO_BLACKLIST", url: finalUrl }),
      "warning"
    );
  }
});

setupIframeObserver();
