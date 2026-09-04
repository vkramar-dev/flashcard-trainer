/** Formats an ISO timestamp as dd-MM-yyyy, as required by the set tiles. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "never"

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "unknown"

  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${day}-${month}-${date.getFullYear()}`
}
