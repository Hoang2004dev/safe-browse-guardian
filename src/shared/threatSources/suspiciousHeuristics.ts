export function isSuspicious(url: string): boolean {
  const patterns = [
    /login[-.]?(facebook|google|paypal|apple|bank)/i,
    /verify[-.]?(account|info)/i,
    /free[-.]?(gift|voucher|promo|offer)/i,
    /update[-.]?(account|payment)/i,
    /@.*\./,
    /\d{1,3}(\.\d{1,3}){3}(:\d+)?/i,
    /\.xyz|\.top|\.ru|\.win|\.click$/i,
    /[\w-]{20,}\.com/,
  ];
  return patterns.some((re) => re.test(url));
}
