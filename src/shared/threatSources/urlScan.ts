//=======================urlScan.ts
import { API_KEYS } from "../constants/apiKeys";
import { ENDPOINTS } from "../constants/endpoints";
import type { URLScanResult } from "../types/threatTypes";

export async function checkURLScan(url: string): Promise<URLScanResult> {
  try {
    const domain = new URL(url).hostname;
    const searchRes = await fetch(`${ENDPOINTS.URLSCAN_SEARCH}${domain}`, {
      headers: {
        "API-Key": API_KEYS.URLSCAN,
        Accept: "application/json"
      }
    });

    const searchData = await searchRes.json();
    const result = searchData?.results?.[0];
    const lastScanDate = result?.task?.time;

    const uuidMatch = result?.result?.match(/\/result\/([a-zA-Z0-9-]+)/);
    const uuid = uuidMatch?.[1];

    let suspicious = false;

    if (uuid) {
      const detailRes = await fetch(ENDPOINTS.URLSCAN_RESULT(uuid), {
        headers: {
          "API-Key": API_KEYS.URLSCAN,
          Accept: "application/json"
        }
      });
      const detail = await detailRes.json();
      suspicious = detail?.verdicts?.overall?.malicious === true;
    }

    return {
      suspicious,
      lastScanDate,
      source: "URLScan.io"
    };
  } catch {
    return {
      suspicious: false,
      source: "URLScan.io"
    };
  }
}