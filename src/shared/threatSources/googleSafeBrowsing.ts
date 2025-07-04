//=======================googleSafeBrowsing.ts
import { ENDPOINTS } from "../constants/endpoints";
import type { GoogleSBResult } from "../types/threatTypes";

export async function checkGoogleSafeBrowsing(url: string): Promise<GoogleSBResult> {
  const body = {
    client: { clientId: "safebrowse-guardian", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION"
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }]
    }
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(ENDPOINTS.GOOGLE_SAFE_BROWSING, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    return { safe: !data.matches };
  } catch {
    return { safe: true };
  }
}