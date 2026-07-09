/** Deterministic case file ID from analysis UUID */
export function formatCaseId(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `VA-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}
