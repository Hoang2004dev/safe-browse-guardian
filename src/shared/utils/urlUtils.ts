//=======================urlUtils.ts
export function normalizeDomain(domain: string): string {
  try {
    const hostname = new URL(domain.startsWith("http") ? domain : `https://${domain}`).hostname;
    return hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return domain.toLowerCase();
  }
}
