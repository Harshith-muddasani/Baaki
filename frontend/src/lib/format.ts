/** Amounts are always minor units (paise) on the wire - only format to decimal at the UI boundary, per CLAUDE.md §3.3. */
export function formatMoney(minorUnits: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(minorUnits / 100)
}

/** Inverse of formatMoney: rupees (as typed by a user) -> paise for the API. */
export function rupeesToMinorUnits(rupees: number): number {
  return Math.round(rupees * 100)
}
