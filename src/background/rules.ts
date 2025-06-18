//=================================== rules.ts
import { RULE_LIMIT } from "./constants";
import { normalizeDomain } from "./urlUtils";

/**
 * Cập nhật danh sách rule chặn dựa trên blacklist.
 * Sử dụng Declarative Net Request API của Chrome.
 */
export async function updateDynamicRules(blacklist: string[]): Promise<void> {
  // Lấy các rule hiện tại để xóa
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((r) => r.id);

  // Tạo danh sách rule mới
  const rules: chrome.declarativeNetRequest.Rule[] = blacklist
    .slice(0, RULE_LIMIT)
    .map((domain, idx) => ({
      id: idx + 1,
      priority: 1,
      action: {
        type: "block",
      },
      condition: {
        urlFilter: `||${normalizeDomain(domain)}`,
        resourceTypes: [
          "main_frame",
          "script",
          "sub_frame",
          "image",
          "xmlhttprequest",
        ],
      },
    }));

  // Nếu vượt quá giới hạn rule của Chrome
  if (blacklist.length > RULE_LIMIT) {
    console.warn(
      `⚠️ Blacklist vượt quá giới hạn ${RULE_LIMIT} rules. Chỉ ${RULE_LIMIT} domain đầu tiên sẽ được áp dụng.`
    );
  }

  // Cập nhật rule mới
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: rules,
  });

  console.log(`📦 Đã cập nhật ${rules.length} rules trong DNR.`);
}
