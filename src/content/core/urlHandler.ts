import { extractRedirectParam } from "../dom";
import { showWarningPopup } from "../popup/popup";
import { formatThreatMessage } from "../messageFormatter";
import { safeSendMessage } from "../../shared/utils/safeSendMessage";
import type { SandboxReport } from "../sandbox/types";

function getBaseDomain(url: string): string {
  let cleanUrl = url.replace(/^https?:\/\//, '');

  cleanUrl = cleanUrl.replace(/^www\./, '');

  const baseDomain = cleanUrl.split('/')[0];
  
  return baseDomain;
}

export class UrlHandler {
  private enabled = true;
  private lastCheckedUrl = "";

  constructor(
    private extensionEnabled: () => boolean,
    private sandboxEnabled: () => boolean
  ) {
    this.listenForClicks();
    this.observeUrlChange();
  }

  public enable() {
    this.enabled = true;
  }

  public disable() {
    this.enabled = false;
  }

  private listenForClicks() {
    document.addEventListener("click", async (event) => {
      if (!this.enabled || !this.extensionEnabled()) return;

      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor || !anchor.href) return;

      const originalUrl = anchor.href;
      const redirectUrl = extractRedirectParam(originalUrl);
      const finalUrl = redirectUrl || originalUrl;

      if (!/^https?:\/\//.test(finalUrl)) return;

      // Phân tích nhanh trong content script (DOM + heuristic)
      const contentReport = await analyzeUrlWithContentScript(finalUrl);
      console.log("Content report:", contentReport);

      // Nếu content script phát hiện vấn đề, tiếp tục kiểm tra background
      if (contentReport.attemptedRedirect || contentReport.externalScript) {
        try {
          const bgResult = await this.checkUrlBackground(finalUrl);
          if (bgResult.safe) {
            console.log(`✅ URL là an toàn: ${finalUrl}`);
            return; // Không làm gì cả nếu URL an toàn
          }
          if (!bgResult.safe) {
            event.preventDefault();

            const msg = formatThreatMessage(false, {
              issues: bgResult.issues,
              detail: bgResult.detail,
              sandbox: contentReport,
            });

            const level = bgResult.issues.length >= 2 ? "critical" : "warning";

            showWarningPopup(
              msg,
              finalUrl,
              () => window.location.href = finalUrl,
              async () => {
                await safeSendMessage({ type: "ADD_TO_BLACKLIST", url: finalUrl });
              },
              level
            );
          }
        } catch (e) {
          console.error("❌ Error checking URL in background:", e);
        }
      }
    });
  }

  private observeUrlChange() {
    let lastUrl = window.location.href;

    const checkUrl = async () => {
      if (!this.enabled || !this.extensionEnabled()) return;
      if (window.location.href === lastUrl) return;

      lastUrl = window.location.href;

      try {
        const contentReport = await analyzeUrlWithContentScript(window.location.href);
        console.log("Content report:", contentReport);

        // Nếu content script phát hiện vấn đề, tiếp tục kiểm tra background
        if (contentReport.attemptedRedirect || contentReport.externalScript) {
          const bgResult = await this.checkUrlBackground(window.location.href);
          if (!bgResult.safe) {
            const msg = formatThreatMessage(false, {
              issues: bgResult.issues,
              detail: bgResult.detail,
              sandbox: null,
            });

            const level = bgResult.issues.length >= 2 ? "critical" : "warning";
            showWarningPopup(
              msg,
              window.location.href,
              () => window.location.reload(),
              async () => {
                await safeSendMessage({ type: "ADD_TO_BLACKLIST", url: window.location.href });
              },
              level
            );
          }
        }
      } catch (e) {
        console.error("❌ Error checking URL in background:", e);
      }
    };

    // Wrap pushState/replaceState để phát hiện SPA URL change
    const wrapHistoryMethod = (method: "pushState" | "replaceState") => {
      const orig = history[method];
      return function (this: History, ...args: Parameters<typeof orig>) {
        const result = orig.apply(this, args);
        window.dispatchEvent(new Event(method));
        return result;
      };
    };

    history.pushState = wrapHistoryMethod("pushState");
    history.replaceState = wrapHistoryMethod("replaceState");

    window.addEventListener("popstate", checkUrl);
    window.addEventListener("pushState", checkUrl);
    window.addEventListener("replaceState", checkUrl);

    // Kiểm tra định kỳ phòng SPA không dùng pushState
    setInterval(checkUrl, 2000);
  }

  private checkUrlBackground(url: string): Promise<{ safe: boolean; issues: string[]; detail: any }> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "CHECK_URL", url }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Chrome runtime error:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        console.log("Received background response:", response);
        if (!response) {
          reject(new Error("No response from background"));
          return;
        }
        resolve(response);
      });
    });
  }
}

// Sandbox phân tích nhanh nội dung DOM
export async function analyzeUrlWithContentScript(url: string): Promise<SandboxReport> {
  const report: SandboxReport = {
    attemptedRedirect: false,
    nestedDangerousIframe: false,
    externalScript: false,
    details: [],
  };

  try {
    const originalHostname = getBaseDomain(url);
    const currentHostname = getBaseDomain(window.location.href);
    const isSameDomain = originalHostname === currentHostname;

    if (!isSameDomain) {
      report.attemptedRedirect = true;
      report.details.push(`Redirected to different domain: ${currentHostname}`);
    }

    console.log("Sandbox Report - Issues: ", report.details);

    const iframes = document.querySelectorAll("iframe");
    if (iframes.length > 0) {
      report.nestedDangerousIframe = true;
      if (!isSameDomain) {
        report.details.push(`Found ${iframes.length} iframe(s) on the page.`);
      }
    }

    const scripts = Array.from(document.scripts).filter(
      (s) => s.src && !s.src.includes(currentHostname)
    );
    if (scripts.length > 0) {
      report.externalScript = true;
      if (!isSameDomain) {
        report.details.push(`Found ${scripts.length} external script(s).`);
      }
    }
  } catch (e) {
    report.details.push(`Analysis error: ${(e as Error).message}`);
  }

  console.log(`🔍 Sandbox analysis for ${url}:`, report);
  return report;
}
