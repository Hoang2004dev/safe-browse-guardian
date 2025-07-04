//=======================abuseIPDB.ts
import { API_KEYS } from "../constants/apiKeys";
import { ENDPOINTS } from "../constants/endpoints";
import type { AbuseIPDBResult } from "../types/threatTypes";

export async function checkAbuseIPDB(url: string): Promise<AbuseIPDBResult> {
  try {
    const hostname = new URL(url).hostname;
    const res = await fetch(`${ENDPOINTS.ABUSEIPDB_CHECK}?ipAddress=${hostname}`, {
      headers: {
        Key: API_KEYS.ABUSEIPDB,
        Accept: "application/json"
      }
    });

    const data = await res.json();
    const score = data?.data?.abuseConfidenceScore ?? 0;
    const reports = data?.data?.totalReports ?? 0;

    return {
      abuseScore: score,
      totalReports: reports,
      source: "AbuseIPDB"
    };
  } catch {
    return {
      abuseScore: 0,
      totalReports: 0,
      source: "AbuseIPDB"
    };
  }
}