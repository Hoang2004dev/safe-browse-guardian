import { ENDPOINTS } from "../constants/endpoints";
import type { ExclusiveScan } from "../types/threatTypes";
import { damerauLevenshtein } from '../utils/stringUtils';  // hàm bình thường
import { ThreatStatus } from "../utils/threatStatus";

// Hàm chuẩn hóa domain từ URL
function normalizeDomain(input: string): string {
  try {
    const hostname = new URL(input).hostname;
    return hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return input.trim().replace(/^www\./, "").toLowerCase();
  }
}

// Hàm kiểm tra ExclusiveScan
export async function checkExclusiveScan(url: string): Promise<ExclusiveScan> {
  try {
    // Gửi request đến API để kiểm tra URL
    const response = await fetch(ENDPOINTS.EXCLUSIVESCAN_CHECK, {
      method: 'GET',
      headers: {
        'accept': '*/*',
      }
    });

    const data = await response.json();
    console.log("Received response:", data);

    const inputDomain = normalizeDomain(url);

    // Nếu API trả về danh sách (array)
    if (Array.isArray(data)) {
      let closestMatch: string | null = null;
      let minDistance = Infinity;

      // Kiểm tra xem domain có nằm trong danh sách trusted không
      const isTrusted = data.some((entry: any) => {
        if (!entry || typeof entry !== "object") return false;

        const raw = entry.url ?? entry.domain;
        if (!raw) return false;

        const trustedDomain = normalizeDomain(raw);
        const { distance, similarity } = damerauLevenshtein(inputDomain, trustedDomain);

        console.log(`Comparing: ${inputDomain} vs ${trustedDomain}`);
        console.log(`Distance: ${distance}, Similarity: ${similarity}`);

        // Nếu khớp chính xác và trạng thái "Active"
        if (trustedDomain === inputDomain && entry.status === "Active") {
          return true;
        }

        // Cập nhật closestMatch nếu khoảng cách nhỏ hơn minDistance
        if (distance < minDistance) {
          closestMatch = trustedDomain;
          minDistance = distance;
        }

        return false;
      });

      // Nếu domain có trong trusted list
      if (isTrusted) {
        return {
          threat: ThreatStatus.SAFE, // An toàn
          reason: "Trusted link (matched in allowlist).",
          source: "MyCustomAPI",
        };
      }

      // Tính ngưỡng độ tương đồng (suspiciousThreshold)
      const suspiciousThreshold = inputDomain.length <= 7 ? 1 : 2;

      // Nếu có closestMatch và khoảng cách nhỏ hơn ngưỡng
      if (closestMatch && typeof closestMatch === "string" && minDistance <= suspiciousThreshold) {
        // Tính độ tương đồng
        const similarity = 1 - minDistance / Math.max(inputDomain.length, (closestMatch as string).length);

        console.log(`Closest match: ${closestMatch}, Similarity: ${similarity}`);
        
        if (similarity >= 0.8) {  // Độ tương đồng >= 90% là có thể là lừa đảo
          return {
            threat: ThreatStatus.SPOOFING, // Giả mạo (gần giống)
            reason: `Domain '${inputDomain}' looks similar to trusted domain '${closestMatch}'. Potential phishing attempt.`,
            source: "MyCustomAPI-FuzzyMatch",
          };
        }
      }

      // Nếu không tìm thấy domain trong trusted list
      return {
        threat: ThreatStatus.NOT_FOUND, // Không tồn tại trong trusted list
        reason: "Domain not found in trusted links.",
        source: "MyCustomAPI",
      };
    }

    // Nếu API trả về dữ liệu dạng object
    if (typeof data === "object" && "threat" in data && "reason" in data) {
      // Xử lý trường hợp trả về boolean threat
      const threatCode = data.threat === true ? "not_found" : data.threat === false ? "safe" : "error";
      return {
        threat: threatCode,
        reason: data.reason,
        source: "MyCustomAPI",
      };
    }

    // Trường hợp API trả về dữ liệu không hợp lệ
    return {
      threat: ThreatStatus.ERROR, // Lỗi/không xác định format
      reason: "Unexpected API response format.",
      source: "MyCustomAPI",
    };
  } catch (error) {
    console.error("[MyCustomAPI] Error:", error);
    return {
      threat: ThreatStatus.ERROR, // Lỗi API
      reason: "API error or unavailable",
      source: "MyCustomAPI",
    };
  }
}
