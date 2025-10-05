export function initExtractContentListener() {
  console.log("[extractContent] Listener initialized");

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "EXTRACT_CONTENT") {
      try {
        const text = document.body?.innerText || "";
        sendResponse({ success: true, content: text });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message || "Không thể lấy nội dung trang." });
      }
      return true;
    }
  });
}
