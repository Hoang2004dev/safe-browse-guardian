import { getHostname } from "../dom";
import type { SandboxReport } from "./types";

export function analyzeDomBehavior(iframe: HTMLIFrameElement, url: string, report: SandboxReport) {
  try {
    const doc = iframe.contentDocument;
    if (!doc) {
      report.details.push("Không thể truy cập nội dung iframe.");
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node: any) => {
          if (node.tagName === "IFRAME") {
            const src = node.src || "";
            if (/\.(xyz|top|ru|win|click)$/i.test(src)) {
              report.nestedDangerousIframe = true;
              report.details.push(`Iframe đáng ngờ: ${src}`);
            }
          } else if (node.tagName === "SCRIPT" && node.src) {
            const isExternal = getHostname(node.src) !== getHostname(url);
            if (isExternal) {
              report.externalScript = true;
              report.details.push(`Script ngoài: ${node.src}`);
            }
          }
        });
      }
    });

    observer.observe(doc, { childList: true, subtree: true });

    // Cleanup sau 1 giây
    setTimeout(() => observer.disconnect(), 1000);
  } catch (e) {
    report.details.push(`Không thể quan sát DOM: ${(e as Error).message}`);
  }
}
