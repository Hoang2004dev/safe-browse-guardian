export function damerauLevenshtein(a: string, b: string): { distance: number, similarity: number } {
  const alen = a.length;
  const blen = b.length;

  const dist = Array.from({ length: alen + 1 }, () => new Array(blen + 1).fill(0));

  for (let i = 0; i <= alen; i++) dist[i][0] = i;
  for (let j = 0; j <= blen; j++) dist[0][j] = j;

  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,      // deletion
        dist[i][j - 1] + 1,      // insertion
        dist[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        dist[i][j] = Math.min(dist[i][j], dist[i - 2][j - 2] + cost);
      }
    }
  }

  const distance = dist[alen][blen];

  // Tính độ tương đồng (Tỉ lệ tương đồng dựa trên độ dài chuỗi và khoảng cách)
  const maxLength = Math.max(alen, blen);
  const similarity = maxLength === 0 ? 1 : (1 - distance / maxLength);

  // Nếu độ tương đồng >= 80%, có thể xem như gần tương đồng
  const threshold = 0.8;
  if (similarity >= threshold) {
    console.log("Chuỗi có độ tương đồng cao (>80%). Có thể xem là gần tương đồng.");
  }

  return { distance, similarity };
}
