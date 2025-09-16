import { ENDPOINTS } from "../constants/endpoints";
import type { ExclusiveScan } from "../types/threatTypes";

function getBaseDomain(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.hostname;
}

export async function checkExclusiveScan(url: string): Promise<ExclusiveScan> {
  try {
    const response = await fetch(ENDPOINTS.EXCLUSIVESCAN_CHECK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        //'Authorization': 'Bearer YOUR_API_KEY', // nếu cần
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    const baseDomain = getBaseDomain(url);
    const apiDomain = getBaseDomain(data.reason);

    if (baseDomain === apiDomain /*&& data.threat === false*/) {
      return {
        threat: false,
        reason: "No threat found in the domain.",
        source: "MyCustomAPI",
      };
    }
    
    return {
      threat: data.threat,
      reason: data.reason,
      source: "MyCustomAPI",
    };
    
  } catch (error) {
    console.error("MyCustomAPI error:", error);
    return {
      threat: null,
      reason: "API error or unavailable",
      source: "MyCustomAPI",
    };
  }
}