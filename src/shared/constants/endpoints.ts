// shared/constants/endpoints.ts
import { API_KEYS } from "./apiKeys";

export const ENDPOINTS = {
  GOOGLE_SAFE_BROWSING: `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEYS.GOOGLE_SAFE_BROWSING}`,
  ABUSEIPDB_CHECK: "https://api.abuseipdb.com/api/v2/check",
  PHISHTANK_CHECK: "https://checkurl.phishtank.com/checkurl/",
  URLSCAN_SEARCH: "https://urlscan.io/api/v1/search/?q=domain:",
  URLSCAN_RESULT: (uuid: string) => `https://urlscan.io/api/v1/result/${uuid}/`,
};
