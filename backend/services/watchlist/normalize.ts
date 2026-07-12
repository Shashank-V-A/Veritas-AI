/** Normalize claim text for watchlist matching. */
export function normalizeClaimText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

/** True when two normalized claims are similar enough to count as a hit. */
export function claimsMatch(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  if (a.length < 12 || b.length < 12) return false
  if (a.includes(b) || b.includes(a)) return true
  const wordsA = new Set(a.split(' ').filter((w) => w.length > 3))
  const wordsB = b.split(' ').filter((w) => w.length > 3)
  if (wordsA.size === 0 || wordsB.length === 0) return false
  const overlap = wordsB.filter((w) => wordsA.has(w)).length
  const ratio = overlap / Math.min(wordsA.size, wordsB.length)
  return ratio >= 0.65
}
