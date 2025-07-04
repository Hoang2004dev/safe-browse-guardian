//=======================phishTank.ts
import { ENDPOINTS } from "../constants/endpoints";
import type { PhishTankResult } from "../types/threatTypes";

export async function checkPhishTank(url: string): Promise<PhishTankResult> {
  const formData = new FormData();
  formData.append("url", url);
  formData.append("format", "json");

  try {
    const res = await fetch(ENDPOINTS.PHISHTANK_CHECK, {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    const isPhishing = data.results?.in_database === true && data.results?.valid === true;
    return {
      phishing: isPhishing,
      source: "PhishTank"
    };
  } catch {
    return {
      phishing: false,
      source: "PhishTank"
    };
  }
}