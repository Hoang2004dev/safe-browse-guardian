//=================================== safeBrowsing.ts
import { SAFE_BROWSING_URL } from "./constants";

export function isSuspicious(url: string): boolean {
  const patterns = [
    /login[-.]?(facebook|google|paypal|apple|bank)/i,
    /verify[-.]?(account|info)/i,
    /free[-.]?(gift|voucher|promo|offer)/i,
    /update[-.]?(account|payment)/i,
    /@.*\./,
    /\d{1,3}(\.\d{1,3}){3}(:\d+)?/i,
    /\.xyz|\.top|\.ru|\.win|\.click$/i,
    /[\w-]{20,}\.com/,
  ];
  return patterns.some((re) => re.test(url));
}

export async function isUrlSafe(url: string): Promise<boolean> {
  const body = {
    client: { clientId: "safebrowse-guardian", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(SAFE_BROWSING_URL, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();
    return !data.matches && !isSuspicious(url);
  } catch {
    return !isSuspicious(url);
  }
}
