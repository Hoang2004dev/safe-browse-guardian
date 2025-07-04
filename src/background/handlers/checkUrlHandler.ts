//=================background/handles/checkUrlHandler.ts
import { getThreatReport } from "../../shared/threatSources/aggregator";
import { resolveFinalUrl } from "../urlUtils";
import { LocalDB } from "../db";

export async function handleCheckUrl(originalUrl: string) {
  const db = await LocalDB.get();
  if (db.extensionEnabled === false) {
    return {
      safe: true,
      finalUrl: originalUrl,
      issues: [],
      detail: { disabled: true }
    };
  }

  const finalUrl = await resolveFinalUrl(originalUrl);
  const report = await getThreatReport(finalUrl);

  if (!report.safe) {
    await LocalDB.addToList("warningLogs", finalUrl);
    await LocalDB.incrementThreatCount();
  }

  return {
    safe: report.safe,
    finalUrl,
    issues: report.issues,
    detail: report.detail,
  };
}
