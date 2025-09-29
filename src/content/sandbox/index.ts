import { waitForBody } from "../dom";
import { analyzeDomBehavior } from "./analyzer";
import type { SandboxReport } from "./types";
import { safeSendMessage } from "../../shared/utils/safeSendMessage";

export async function analyzeUrlInSandbox(url: string): Promise<SandboxReport> {
  await waitForBody();

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position: absolute; left: -9999px; width: 1px; height: 1px;";
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
        const getDomain = (u: string) => {
          try {
            return new URL(u).hostname;
          } catch {
            return "";
          }
        };
        if (
          href !== url &&
          /^https?:\/\//.test(href) &&
          getDomain(href) !== getDomain(url)
        ) {
          report.attemptedRedirect = true;
          report.details.push(`Tự động chuyển hướng tới: ${href}`);
        }
      } catch (e) {
        // Chỉ ghi lỗi nếu khác domain
        const getDomain = (u: string) => {
          try {
            return new URL(u).hostname;
          } catch {
            return "";
          }
        };
        if (getDomain(url) !== window.location.hostname) {
          report.details.push(
            `Không thể truy cập nội dung iframe: ${(e as Error).message}`
          );
        }
        // Nếu cùng domain, KHÔNG ghi lỗi vào report
      }
    };

    analyzeDomBehavior(iframe, url, report);

    setTimeout(async () => {
      iframe.remove();

      await safeSendMessage({
        type: "LOG",
        message: `🔍 Sandbox analysis for ${url}: ${JSON.stringify(report)}`,
      });

      resolve(report);
    }, 1000);

    if (/^https?:\/\//.test(url)) {
      iframe.src = url;
    } else {
      report.details.push(`URL không hợp lệ hoặc bị CSP chặn: ${url}`);
      resolve(report);
    }
  });
}
