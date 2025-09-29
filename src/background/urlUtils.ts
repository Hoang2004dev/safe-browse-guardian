//=================================== urlUtils.ts
export function normalizeDomain(domain: string): string {
  try {
    let cleanUrl = domain.replace(/^https?:\/\//, '');
    cleanUrl = cleanUrl.replace(/^www\./, '');
    const baseDomain = cleanUrl.split('/')[0];
    return baseDomain.toLowerCase();
  } catch {
    return domain.toLowerCase();
  }
}

export function isDomainBlocked(hostname: string, blacklist: string[]): boolean {
  const domain = normalizeDomain(hostname);
  return blacklist.some(blocked => {
    const b = normalizeDomain(blocked);
    return domain === b || domain.endsWith("." + b);
  });
}

export async function resolveFinalUrl(inputUrl: string): Promise<string> {
  try {
    if (!/^https?:\/\//i.test(inputUrl)) return inputUrl;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(inputUrl, {
      method: "HEAD",
      redirect: "follow",
      mode: "cors",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.url || inputUrl;
  } catch {
    return inputUrl;
  }
}
