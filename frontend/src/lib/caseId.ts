/** Deterministic case file ID from analysis UUID */
export function formatCaseId(id: string): string {
  const hex = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `VA-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}

/** Provisional intake reference before analysis is filed */
export function generateIntakeCaseRef(): string {
  const token = Math.random().toString(36).slice(2, 6).toUpperCase()
  const year = new Date().getFullYear()
  return `VA-PEND-${year}-${token}`
}
