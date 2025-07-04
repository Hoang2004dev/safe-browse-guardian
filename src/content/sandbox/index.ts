import { waitForBody } from "../dom";
import { analyzeDomBehavior } from "./analyzer";
import type { SandboxReport } from "./types";

export async function analyzeUrlInSandbox(url: string): Promise<SandboxReport> {
  await waitForBody();

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position: absolute; left: -9999px; width: 1px; height: 1px;";
    iframe.sandbox = "";
    document.body.appendChild(iframe);

    const report: SandboxReport = {
      attemptedRedirect: false,
      nestedDangerousIframe: false,
      externalScript: false,
      details: [],
    };

    iframe.onload = () => {
      try {
        const href = iframe.contentWindow?.location.href || "";
        if (href !== url && /^https?:\/\//.test(href)) {
          report.attemptedRedirect = true;
          report.details.push(`Tự động chuyển hướng tới: ${href}`);
        }
      } catch (e) {
        report.details.push(`Không thể truy cập URL (redirect): ${(e as Error).message}`);
      }
    };

    analyzeDomBehavior(iframe, url, report);

    setTimeout(() => {
      iframe.remove();
      chrome.runtime.sendMessage({
        type: "LOG",
        message: `🔍 Sandbox analysis for ${url}: ${JSON.stringify(report)}`,
      });
      resolve(report);
    }, 1000);

    iframe.src = url;
  });
}
