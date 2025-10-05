// background/handlers/scanHandler.ts
import { ENDPOINTS } from "../../shared/constants/endpoints";
import { showScanResultPopup } from "../../content/popup/popupScan";

export class ScanHandler {

  constructor() { }

  async handleScanRequest(sendResponse: (res: any) => void) {
    console.log("[background] Scan request...");

    try {
      // 1. Lấy tab hiện tại
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        sendResponse({ success: false, error: "Không tìm thấy tab đang mở." });
        return;
      }

      // 2. Gửi message yêu cầu content script lấy nội dung trang
      const content: any = await chrome.tabs.sendMessage(tab.id, { type: "EXTRACT_CONTENT" });

      if (!content.success || !content.content) {
        sendResponse({ success: false, error: content.error || "Không lấy được nội dung trang." });
        return;
      }

      console.log("[background] Page content extracted:", content.content);
      const cleanedContent = content.content
        .replace(/[\n\r\t]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      console.log("[background] Cleaned content:", cleanedContent);

      // 3. Gửi nội dung đến API để quét
      const apiResponse = await fetch(ENDPOINTS.PARAGRAPH_CHECK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanedContent }),
      });

      if (!apiResponse.ok) {
        sendResponse({
          success: false,
          error: `API trả về lỗi: ${apiResponse.status} ${apiResponse.statusText}`,
        });
        return;
      }

      const result = await apiResponse.json();

      if (result.Safe === false) {
        await chrome.tabs.sendMessage(tab.id, {
          type: "SHOW_SCAN_RESULT_POPUP",
          title: result.Title,
          description: result.Description,
          patternType: result.PatternType,
        });
      }

      // 4. Trả kết quả về cho popup
      sendResponse({
        success: true,
        result,
      });
    } catch (err: any) {
      console.error("SCAN_REQUEST error:", err);
      sendResponse({ success: false, error: err.message || "Đã xảy ra lỗi không xác định." });
    }
  }
}
