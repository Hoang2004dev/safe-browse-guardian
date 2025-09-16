//=======================aggregator.ts
import { checkGoogleSafeBrowsing } from "./googleSafeBrowsing";
import { checkPhishTank } from "./phishTank";
import { checkURLScan } from "./urlScan";
import { checkAbuseIPDB } from "./abuseIPDB";
import { isSuspicious } from "./suspiciousHeuristics";
import { checkExclusiveScan } from "./exclusiveScan";

import type { ThreatReport } from "../types/threatTypes";

export async function getThreatReport(url: string): Promise<ThreatReport> {

  const trustLinkApi = await checkExclusiveScan(url);
  const issues: string[] = [];

  if (trustLinkApi.threat == false) {
    issues.push(`Trust Link: ${trustLinkApi.reason}`);
    return {
      url,
      safe: true,
      issues,
      detail: { 
        google: { safe: true },
        phish: { phishing: true, source: "PhishTank" },
        urlscan: { suspicious: true, source: "URLScan.io" },
        abuse: { abuseScore: 0, totalReports: 0, source: "AbuseIPDB" },
        trustLinkApi,
       },
    };
  }

  const [google, phish, urlscan, abuse,] = await Promise.all([
    checkGoogleSafeBrowsing(url),
    checkPhishTank(url),
    checkURLScan(url),
    checkAbuseIPDB(url),
  ]);

  if (!google.safe) issues.push("Google Safe Browsing");
  if (phish.phishing) issues.push("PhishTank");
  if (urlscan.suspicious) issues.push("URLScan.io");
  if (abuse.abuseScore > 50) issues.push("AbuseIPDB");
  if (isSuspicious(url)) issues.push("Heuristic Pattern");

  return {
    url,
    safe: issues.length === 0,
    issues,
    detail: { google, phish, urlscan, abuse, trustLinkApi },
  };
}
