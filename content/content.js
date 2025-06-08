/* content.js */
async function waitForBody() {
  return new Promise((resolve) => {
    if (document.body) return resolve();
    const observer = new MutationObserver(() => {
      if (document.body) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  });
}

function extractRedirectParam(url) {
  const parsed = new URL(url);
  for (const [_, value] of parsed.searchParams.entries()) {
    try {
      const decoded = decodeURIComponent(value);
      if (/^https?:\/\//.test(decoded)) return decoded;
    } catch {}
  }
  return null;
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function showWarningPopup(msg, url, onContinue, onBlock) {
  if (document.querySelector(".safebrowse-overlay")) return; // Prevent multiple popups

  const overlay = document.createElement("div");
  overlay.className = "safebrowse-overlay";
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 9999; display: flex;
    justify-content: center; align-items: center;
  `;

  const popup = document.createElement("div");
  popup.style.cssText = `
    background: white; padding: 20px; border-radius: 8px;
    max-width: 400px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;

  const msgEl = document.createElement("p");
  msgEl.style.cssText = "margin: 0 0 15px; color: #d32f2f;";
  msgEl.textContent = msg.split("<br>")[0]; // Avoid HTML injection

  const detailsEl = document.createElement("p");
  detailsEl.style.cssText = "margin: 0 0 15px; color: #666; font-size: 0.9em;";
  detailsEl.textContent = msg.split("<br>")[1]?.replace("<small>", "").replace("</small>", "") || "";

  const urlEl = document.createElement("p");
  urlEl.style.cssText = "margin: 0 0 15px; word-break: break-all;";
  urlEl.textContent = url; // Avoid HTML injection

  const continueBtn = document.createElement("button");
  continueBtn.id = "continueBtn";
  continueBtn.style.cssText = "padding: 8px 16px; margin: 5px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;";
  continueBtn.textContent = "Tiếp tục";

  const blockBtn = document.createElement("button");
  blockBtn.id = "blockBtn";
  blockBtn.style.cssText = "padding: 8px 16px; margin: 5px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;";
  blockBtn.textContent = "Thêm vào Blacklist";

  const cancelBtn = document.createElement("button");
  cancelBtn.id = "cancelBtn";
  cancelBtn.style.cssText = "padding: 8px 16px; margin: 5px; background: #9e9e9e; color: white; border: none; border-radius: 4px; cursor: pointer;";
  cancelBtn.textContent = "Hủy";

  popup.appendChild(msgEl);
  if (detailsEl.textContent) popup.appendChild(detailsEl);
  popup.appendChild(urlEl);
  popup.appendChild(continueBtn);
  popup.appendChild(blockBtn);
  popup.appendChild(cancelBtn);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  continueBtn.addEventListener("click", () => {
    overlay.remove();
    onContinue();
  });

  blockBtn.addEventListener("click", () => {
    overlay.remove();
    onBlock();
  });

  cancelBtn.addEventListener("click", () => {
    overlay.remove();
  });
}

async function setupIframeObserver() {
  await waitForBody();
  let lastCheck = 0;
  const observer = new MutationObserver((mutations) => {
    const now = Date.now();
    if (now - lastCheck < 100) return; // Debounce: check every 100ms
    lastCheck = now;
    chrome.runtime.sendMessage({ type: "GET_BLACKLIST" }, ({ blacklist }) => {
      document.querySelectorAll("iframe").forEach((f) => {
        const src = f.src || "";
        const iframeHost = getHostname(src);
        const blocked = blacklist.some(
          (b) => iframeHost === b || iframeHost.endsWith("." + b)
        );
        if (blocked) {
          chrome.runtime.sendMessage({
            type: "LOG",
            message: `🚫 Blocked iframe: ${src}`,
          });
          f.remove();
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Sandboxed iframe analysis for suspicious URLs
async function analyzeUrlInSandbox(url) {
  await waitForBody();
  return new Promise((resolve) => {
    const sandboxFrame = document.createElement("iframe");
    sandboxFrame.style.cssText = "position: absolute; left: -9999px; width: 1px; height: 1px;";
    sandboxFrame.sandbox = ""; // Strict sandbox, no permissions
    document.body.appendChild(sandboxFrame);

    let suspiciousBehavior = {
      attemptedRedirect: false,
      nestedDangerousIframe: false,
      externalScript: false,
      details: []
    };

    sandboxFrame.onload = () => {
      try {
        const contentWindow = sandboxFrame.contentWindow;
        if (contentWindow.location.href !== url && /^https?:\/\//.test(contentWindow.location.href)) {
          suspiciousBehavior.attemptedRedirect = true;
          suspiciousBehavior.details.push(`Redirect attempt to: ${contentWindow.location.href}`);
        }
      } catch (e) {
        suspiciousBehavior.details.push(`Access blocked (possible redirect): ${e.message}`);
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === "IFRAME") {
            const src = node.src || "";
            const host = getHostname(src);
            const isSuspicious = /[\w-]{20,}\.com|\.xyz|\.top|\.ru|\.win|\.click$/i.test(src);
            if (isSuspicious) {
              suspiciousBehavior.nestedDangerousIframe = true;
              suspiciousBehavior.details.push(`Dangerous nested iframe: ${src}`);
            }
          } else if (node.tagName === "SCRIPT" && node.src) {
            const host = getHostname(node.src);
            const isExternal = host && host !== getHostname(url);
            if (isExternal) {
              suspiciousBehavior.externalScript = true;
              suspiciousBehavior.details.push(`External script loaded: ${node.src}`);
            }
          }
        });
      });
    });

    try {
      const contentDoc = sandboxFrame.contentDocument;
      observer.observe(contentDoc, { childList: true, subtree: true });
    } catch (e) {
      suspiciousBehavior.details.push(`Setup failed: ${e.message}`);
    }

    setTimeout(() => {
      observer.disconnect();
      sandboxFrame.remove();
      chrome.runtime.sendMessage({
        type: "LOG",
        message: `🔍 Sandbox analysis for ${url}: ${JSON.stringify(suspiciousBehavior)}`,
      });
      resolve(suspiciousBehavior);
    }, 1000); // Reduced timeout for performance

    sandboxFrame.src = url;
  });
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("a");
  if (!target?.href) return;

  event.preventDefault();
  const originalUrl = target.href;
  const extracted = extractRedirectParam(originalUrl);
  const finalUrlToCheck = extracted || originalUrl;

  try {
    chrome.runtime.sendMessage(
      { type: "CHECK_URL", url: finalUrlToCheck },
      async (response) => {
        if (chrome.runtime.lastError) {
          console.warn("⚠️ Lỗi gửi message:", chrome.runtime.lastError.message);
          showWarningPopup("⚠️ Lỗi: Không thể kiểm tra URL. Tiếp tục?", finalUrlToCheck,
            () => { window.location.href = finalUrlToCheck; },
            () => {
              chrome.runtime.sendMessage(
                { type: "ADD_TO_BLACKLIST", url: finalUrlToCheck },
                (res) => {
                  if (res?.success) console.log(`✅ Added ${finalUrlToCheck} to blacklist`);
                }
              );
            }
          );
          return;
        }

        const finalUrl = response.finalUrl || finalUrlToCheck;
        const originalHost = getHostname(originalUrl);
        const finalHost = getHostname(finalUrl);

        chrome.storage.local.get("localDB", async ({ localDB }) => {
          const sandboxEnabled = localDB?.sandboxEnabled ?? true;
          let isOverallSafe = response.safe;
          let sandboxResult = null;

          if (sandboxEnabled && !isOverallSafe) { // Only sandbox if not already safe
            sandboxResult = await analyzeUrlInSandbox(finalUrl);
            const isSandboxSafe = !(
              sandboxResult.attemptedRedirect ||
              sandboxResult.nestedDangerousIframe ||
              sandboxResult.externalScript
            );
            isOverallSafe = response.safe && isSandboxSafe;
          }

          if (isOverallSafe && originalHost === finalHost) {
            if (/^https?:\/\//i.test(finalUrl)) {
              window.location.href = finalUrl;
            } else {
              console.warn("⛔ Không redirect vì URL không hợp lệ:", finalUrl);
            }
          } else {
            let msg = isOverallSafe
              ? "🔁 Link này sẽ chuyển hướng đến:"
              : "⚠️ Cảnh báo: Link này có thể nguy hiểm!";
            if (sandboxEnabled && sandboxResult?.details?.length > 0) {
              msg += "<br>Phát hiện hành vi đáng ngờ: " + sandboxResult.details.join(", ");
            }
            showWarningPopup(
              msg,
              finalUrl,
              () => { window.location.href = finalUrl; },
              () => {
                chrome.runtime.sendMessage(
                  { type: "ADD_TO_BLACKLIST", url: finalUrl },
                  (res) => {
                    if (res?.success) console.log(`✅ Added ${finalUrl} to blacklist`);
                  }
                );
              }
            );
          }
        });
      }
    );
  } catch (err) {
    console.error("❌ Không thể gửi message:", err);
    showWarningPopup("⚠️ Lỗi: Không thể kiểm tra URL. Tiếp tục?", finalUrlToCheck,
      () => { window.location.href = finalUrlToCheck; },
      () => {
        chrome.runtime.sendMessage(
          { type: "ADD_TO_BLACKLIST", url: finalUrlToCheck },
          (res) => {
            if (res?.success) console.log(`✅ Added ${finalUrlToCheck} to blacklist`);
          }
        );
      }
    );
  }
});

setupIframeObserver();