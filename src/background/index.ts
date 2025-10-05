import { LocalDB } from "./db";
import { normalizeDomain } from "./urlUtils";
import { updateDynamicRules } from "./rules";
import { registerMessageHandlers } from "./messageHandler";
import { handleCheckUrl } from "./handlers/checkUrlHandler";
import { showWarningPopup } from "../content/popup/popup";
import { showScanResultPopup } from "../content/popup/popupScan";

// Helper function to extract base domain from a URL
function getBaseDomain(url: string): string {
  let cleanUrl = url.replace(/^https?:\/\//, '');

  cleanUrl = cleanUrl.replace(/^www\./, '');

  const baseDomain = cleanUrl.split('/')[0];
  
  return baseDomain;
}

function isNewTabPage(url: string): boolean {
  const edgeNewTabPattern = /^https:\/\/ntp\.msn\.com/;
  return edgeNewTabPattern.test(url);
}

let cachedBlacklist: string[] = [];
let isPaused: boolean = false;
let lastVisitedUrls: { [tabId: number]: string | null } = {};

// Khởi tạo khi extension được cài đặt
chrome.runtime.onInstalled.addListener(async () => {
  try {
    console.log("🛡️ SafeBrowse Guardian installed");
    await LocalDB.init();
    const db = await LocalDB.get();
    cachedBlacklist = db.blacklist.map(normalizeDomain);
    isPaused = db.paused ?? false;
    await updateDynamicRules(cachedBlacklist);
  } catch (error) {
    console.error("Error during extension initialization:", error);
  }
});

// Xử lý thay đổi trong storage
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "local" && changes.localDB) {
    const db = changes.localDB.newValue || {};
    cachedBlacklist = Array.isArray(db.blacklist) ? db.blacklist.map(normalizeDomain) : [];
    isPaused = db.paused ?? false;
    await updateDynamicRules(cachedBlacklist);
  }
});

// Xử lý khi tab mới được tạo
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id !== undefined) {
    console.log(`🔧 Tab created with ID: ${tab.id}`); // Log tabId when tab is created
    lastVisitedUrls[tab.id] = null; // Đặt giá trị URL là null cho tab mới
    console.log(`lastVisitedUrls frist:`, lastVisitedUrls);
  }
});

// Lắng nghe sự kiện chuyển hướng và kiểm tra URL
chrome.webNavigation.onCompleted.addListener(
  async (details) => {
    console.log(`🔄 Navigation completed for tabId: ${details.tabId} with URL: ${details.url}`); // Log tabId and URL

    if (isPaused) {
      console.log("Extension paused. Skipping URL processing.");
      return;
    }

    if (isNewTabPage(details.url)) {
      console.log(`🔰 Tab ID ${details.tabId}: Edge new tab page detected, skipping URL processing.`);
      return;
    }

    // Kiểm tra nếu tab mới mà chưa có URL
    if (lastVisitedUrls[details.tabId] === null) {
      console.log(`🔰 Tab ID ${details.tabId} has no previous URL, setting current URL: ${details.url}`);
    }

    console.log(`lastVisitedUrls for tab ${details.tabId}:`, lastVisitedUrls[details.tabId]);
    console.log(`Current URL: ${details.url}`);

    // Kiểm tra xem đây có phải là trang reload hay không
    if (details.url === lastVisitedUrls[details.tabId]) {
      console.log(`🚫 Tab ID ${details.tabId}: Page reload detected. Skipping URL processing.`);
      return;
    }

    //lastVisitedUrls[details.tabId] = details.url;
    console.log(`lastVisitedUrls second:`, lastVisitedUrls);
    // Lấy base domain của URL
    const currentBaseDomain = getBaseDomain(details.url);
    const lastVisitedBaseDomain = getBaseDomain(lastVisitedUrls[details.tabId] ?? "");
    console.log(`Tab ID ${details.tabId}: Base domain changed: ${lastVisitedBaseDomain} → ${currentBaseDomain}`);

    // Kiểm tra nếu base domain thay đổi
    if (currentBaseDomain !== lastVisitedBaseDomain) {
      console.log(`🌍 Tab ID ${details.tabId}: Base domain changed: ${lastVisitedBaseDomain} → ${currentBaseDomain}`);

      const isBlocked = cachedBlacklist.some((blDomain) => currentBaseDomain === blDomain);
      if (isBlocked) {
        console.log(`🚫 Tab ID ${details.tabId}: Blocked URL (blacklist match): ${details.url}`);
        return;
      }

      try {
        console.log(`🔍 Tab ID ${details.tabId}: Calling handleCheckUrl for ${details.url}`);
        const checkResult = await handleCheckUrl(details.url, details.tabId);
        console.log(`Checked URL: ${details.url}, safe: ${checkResult.safe}`);

        if (checkResult.safe) {
          lastVisitedUrls[details.tabId] = currentBaseDomain; //details.url;
          return; // Nếu URL an toàn, không làm gì cả và tiếp tục điều hướng
        }

        // Gửi kết quả về content script của tab đó
        chrome.tabs.sendMessage(details.tabId, {
          type: "URL_CHECKED",
          url: details.url,
          safe: checkResult.safe,
          issues: checkResult.issues,
          detail: checkResult.detail,
        }).catch((error) => {
          console.error("Error sending message to content script:", error);
        });

      } catch (err) {
        console.error("Error checking URL in background:", err);
      }
      lastVisitedUrls[details.tabId] = details.url;
      console.log(`lastVisitedUrls updated:`, lastVisitedUrls);
    } else {
      // Cùng base domain, bỏ qua kiểm tra và tiếp tục điều hướng
      console.log(`🔄 Tab ID ${details.tabId}: Same base domain, skipping background check.`);
    }
  },
  { url: [{ schemes: ["http", "https"] }] }
);

// Lắng nghe rule matched debug để kiểm tra rule mạng
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  const matched = info.rule;
  const url = info.request?.url;
  console.log(`🧠 Rule matched: [ID ${matched.ruleId}] for URL → ${url}`);
});

registerMessageHandlers();

// Cập nhật các rules khi extension được bật hay tạm dừng
(async () => {
  if (isPaused) {
    await updateDynamicRules([]); // Xóa hết rule khi pause
  } else {
    await updateDynamicRules(cachedBlacklist);
  }
})();
