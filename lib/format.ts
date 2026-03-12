export function formatDateDDMMYYYY(input: string | Date | null | undefined): string {
  if (!input) return '—'

  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return '—'

  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getUTCFullYear())
  return `${dd}-${mm}-${yyyy}`
}

const CLP_FORMATTER = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function formatCurrencyCLP(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value
  return CLP_FORMATTER.format(Number.isFinite(n as number) ? (n as number) : 0)
}
