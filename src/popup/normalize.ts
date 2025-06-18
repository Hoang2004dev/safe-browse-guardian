//=================================== normalize.ts
export async function normalizeDomain(domain: string): Promise<string> {
  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return domain.toLowerCase();
  }
}
