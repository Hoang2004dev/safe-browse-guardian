//=================background/handles/checkUrlHandler.ts
import { getThreatReport } from "../../shared/threatSources/aggregator";
import { resolveFinalUrl } from "../urlUtils";
import { LocalDB } from "../db";

let urlCheckCache: { [key: string]: boolean } = {};
let processingQueue: Set<string> = new Set();

function getBaseDomain(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.hostname;
}

export async function handleCheckUrl(originalUrl: string) {
  
  const db = await LocalDB.get();
  const finalUrl = await resolveFinalUrl(originalUrl);
  const baseDomain = getBaseDomain(finalUrl);

  if (db.extensionEnabled === false) {
    return {
      safe: true,
      finalUrl: originalUrl,
      issues: [],
      detail: { disabled: true }
    };
  }

  if (urlCheckCache[baseDomain] !== undefined) {
    console.log("Cache hit for", baseDomain);
    return {
      safe: urlCheckCache[baseDomain],
      finalUrl: originalUrl,
      issues: [],
      detail: { cached: true },
    };
  }

  if (processingQueue.has(baseDomain)) {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (!processingQueue.has(baseDomain)) {
          clearInterval(interval);
          resolve(handleCheckUrl(originalUrl));
        }
      }, 50);
    });
  }
  
  processingQueue.add(baseDomain);

  try {
    const cachedResult = await LocalDB.getCacheResult(baseDomain);
    if (cachedResult !== null) {
      urlCheckCache[baseDomain] = cachedResult.safe;
      processingQueue.delete(baseDomain);
      return {
        safe: cachedResult.safe,
        finalUrl,
        issues: [],
        detail: { cached: true },
      };
    }

    const report = await getThreatReport(baseDomain);

    urlCheckCache[baseDomain] = report.safe;
    await LocalDB.setCacheResult(baseDomain, report.safe, Date.now());

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
  finally {
    processingQueue.delete(baseDomain);
  }
}
