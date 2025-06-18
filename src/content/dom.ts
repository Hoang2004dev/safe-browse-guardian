//=================================== dom.ts
export async function waitForBody(): Promise<void> {
  return new Promise((resolve) => {
    if (document.body) return resolve();
    const observer = new MutationObserver(() => {
      if (document.body) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}

export function extractRedirectParam(url: string): string | null {
  const parsed = new URL(url);
  for (const [_, value] of parsed.searchParams.entries()) {
    try {
      const decoded = decodeURIComponent(value);
      if (/^https?:\/\//.test(decoded)) return decoded;
    } catch {}
  }
  return null;
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}
