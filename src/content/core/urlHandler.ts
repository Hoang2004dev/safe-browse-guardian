import { extractRedirectParam, getHostname } from "../dom";
import { showWarningPopup } from "../popup/popup";
import { analyzeUrlInSandbox } from "../sandbox/index";
import { formatThreatMessage } from "../messageFormatter";
import { safeSendMessage } from "../../shared/utils/safeSendMessage";

export class UrlHandler {
  private lastUrl = "";
  private enabled = true;

  constructor(
    private extensionEnabled: () => boolean,
    private sandboxEnabled: () => boolean
  ) {
    this.listenForClicks();
  }

  public enable() {
    this.enabled = true;
  }

  public disable() {
    this.enabled = false;
  }

  private listenForClicks() {
    document.addEventListener("click", async (event) => {
      if (!this.enabled) return;
      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor || !anchor.href) return;

      const originalUrl = anchor.href;
      if (originalUrl === this.lastUrl) return;
      this.lastUrl = originalUrl;

      const redirectUrl = extractRedirectParam(originalUrl);
      const finalUrl = redirectUrl || originalUrl;

      if (!/^https?:\/\//.test(finalUrl)) return;
      if (!this.extensionEnabled()) return;

      event.preventDefault();

      try {
        const res = await safeSendMessage<{
          finalUrl?: string;
          issues?: string[];
          detail?: any;
          safe?: boolean;
        }>({ type: "CHECK_URL", url: finalUrl });

        const finalUrlResolved = res?.finalUrl || finalUrl;
        const originalHost = getHostname(originalUrl);
        const finalHost = getHostname(finalUrlResolved);
        const issues = res?.issues || [];
        const detail = res?.detail || {};

        let isSafe = res?.safe ?? true;
        let sandbox: any = null;

        if (this.sandboxEnabled() && !isSafe) {
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
            async () => {
              await safeSendMessage({ type: "ADD_TO_BLACKLIST", url: finalUrlResolved });
            },
            level
          );
        }
      } catch (err) {
        console.error("❌ Error:", err);
        showWarningPopup(
          "⚠️ Không thể kiểm tra URL. Tiếp tục?",
          finalUrl,
          () => (window.location.href = finalUrl),
          async () => await safeSendMessage({ type: "ADD_TO_BLACKLIST", url: finalUrl }),
          "warning"
        );
      }
    });
  }
}