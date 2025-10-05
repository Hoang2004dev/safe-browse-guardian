import { ENDPOINTS } from "../constants/endpoints";
import { ThreatStatus } from "../utils/threatStatus";
import { SuspiciousScan } from "shared/types/threatTypes";

function getBaseDomain(url: string): string {
  let cleanUrl = url.replace(/^https?:\/\//, '');

  cleanUrl = cleanUrl.replace(/^www\./, '');

  const baseDomain = cleanUrl.split('/')[0];
  
  return baseDomain;
}

export async function checkSuspiciousScan(url: string): Promise<SuspiciousScan> {
  try {
    const response = await fetch(ENDPOINTS.SUSPICIOUS_CHECK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    console.log("Received response:", data);

    if (Array.isArray(data) && data.length > 0) {
      const match = data.find((entry) => {
        if (!entry || typeof entry !== "object") return false;

        // checkResult là "Malicious" và status là "Active"
        return (
        //   entry.checkResult?.toLowerCase() === "malicious" &&
          entry.status?.toLowerCase() === "active"
        );
      });

      if (match) {
        return {
          threat: ThreatStatus.SPOOFING,
          reason: `Đã phát hiện liên kết lừa đảo. Độ chính xác: ${match.confidenceScore}%`,
          source: "SuspiciousLinksAPI",
        };
      }

      return {
        threat: ThreatStatus.SAFE,
        reason: "URL found but not marked malicious.",
        source: "SuspiciousLinksAPI",
      };
    }

    // Nếu không có kết quả trả về
    return {
      threat: ThreatStatus.NOT_FOUND,
      reason: "No suspicious record found for this URL.",
      source: "SuspiciousLinksAPI",
    };

  } catch (error) {
    console.error("[SuspiciousLinksAPI] Error:", error);
    return {
      threat: ThreatStatus.ERROR,
      reason: "API error or unavailable",
      source: "SuspiciousLinksAPI",
    };
  }
}