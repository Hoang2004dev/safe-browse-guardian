//=================================== sandbox.ts
import { waitForBody } from "./dom";
import { getHostname } from "./dom";

export async function analyzeUrlInSandbox(url: string): Promise<any> {
  await waitForBody();

  return new Promise((resolve) => {
    const sandboxFrame = document.createElement("iframe");
    sandboxFrame.style.cssText =
      "position: absolute; left: -9999px; width: 1px; height: 1px;";
    sandboxFrame.sandbox = "";
    document.body.appendChild(sandboxFrame);

    const suspiciousBehavior = {
      attemptedRedirect: false,
      nestedDangerousIframe: false,
      externalScript: false,
      details: [] as string[],
    };

    sandboxFrame.onload = () => {
      try {
        const href = sandboxFrame.contentWindow?.location.href || "";
        if (href !== url && /^https?:\/\//.test(href)) {
          suspiciousBehavior.attemptedRedirect = true;
          suspiciousBehavior.details.push(`Redirect attempt to: ${href}`);
        }
      } catch (e) {
        const err = e as Error;
        suspiciousBehavior.details.push(`Access blocked: ${err.message}`);
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node: any) => {
          if (node.tagName === "IFRAME") {
            const src = node.src || "";
            if (/\.(xyz|top|ru|win|click)$/.test(src)) {
              suspiciousBehavior.nestedDangerousIframe = true;
              suspiciousBehavior.details.push(`Dangerous iframe: ${src}`);
            }
          } else if (node.tagName === "SCRIPT" && node.src) {
            const isExternal = getHostname(node.src) !== getHostname(url);
            if (isExternal) {
              suspiciousBehavior.externalScript = true;
              suspiciousBehavior.details.push(`External script: ${node.src}`);
            }
          }
        });
      }
    });

    try {
      observer.observe(sandboxFrame.contentDocument!, {
        childList: true,
        subtree: true,
      });
    } catch (e) {
      const err = e as Error;
      suspiciousBehavior.details.push(`Access blocked: ${err.message}`);
    }

    setTimeout(() => {
      observer.disconnect();
      sandboxFrame.remove();
      chrome.runtime.sendMessage({
        type: "LOG",
        message: `🔍 Sandbox analysis for ${url}: ${JSON.stringify(
          suspiciousBehavior
        )}`,
      });
      resolve(suspiciousBehavior);
    }, 1000);

    sandboxFrame.src = url;
  });
}
