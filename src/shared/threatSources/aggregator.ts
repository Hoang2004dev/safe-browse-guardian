//=======================aggregator.ts
import { checkGoogleSafeBrowsing } from "./googleSafeBrowsing";
import { checkPhishTank } from "./phishTank";
import { checkURLScan } from "./urlScan";
import { checkAbuseIPDB } from "./abuseIPDB";
import { isSuspicious } from "./suspiciousHeuristics";
import { checkExclusiveScan } from "./exclusiveScan";
import { ThreatStatus } from "../utils/threatStatus";

import type { ThreatReport } from "../types/threatTypes";

export async function getThreatReport(url: string): Promise<ThreatReport> {
  console.log("Inside getThreatReport for URL:", url); 
  const trustLinkApi = await checkExclusiveScan(url);
  const issues: string[] = [];
  console.log(trustLinkApi)
  console.log("Issues array before processing:", issues);
  switch (trustLinkApi.threat) {
    case ThreatStatus.SAFE:
      issues.push(`Trust Link: ${trustLinkApi.reason}`);
      return {
        url,
        safe: true,
        issues,
        detail: {
          google: { safe: true },
          phish: { phishing: false, source: "PhishTank" },
          urlscan: { suspicious: false, source: "URLScan.io" },
          abuse: { abuseScore: 0, totalReports: 0, source: "AbuseIPDB" },
          trustLinkApi,
        },
      };

    case ThreatStatus.SPOOFING:
      issues.push(`Suspicious Link: ${trustLinkApi.reason}`);
      return {
        url,
        safe: false,
        issues,
        detail: {
          google: { safe: true },
          phish: { phishing: false, source: "PhishTank" },
          urlscan: { suspicious: false, source: "URLScan.io" },
          abuse: { abuseScore: 0, totalReports: 0, source: "AbuseIPDB" },
          trustLinkApi,
        },
      };

    case ThreatStatus.NOT_FOUND:
      issues.push("Domain not found in trusted links.");
      break;

    case ThreatStatus.ERROR:
      issues.push("Trust link check unavailable.");
      break;

    default:
      issues.push("Unknown trust link status.");
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

  const safe = issues.length === 0 || 
               google.safe || 
               !phish.phishing || 
               !urlscan.suspicious || 
               abuse.abuseScore <= 50;
               
  return {
    url,
    safe,
    issues,
    detail: { google, phish, urlscan, abuse, trustLinkApi },
  };
}
