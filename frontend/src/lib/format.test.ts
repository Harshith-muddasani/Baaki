import { describe, expect, it } from 'vitest'
import { formatMoney, rupeesToMinorUnits } from '@/lib/format'

describe('formatMoney', () => {
  it('formats whole rupees', () => {
    expect(formatMoney(10000)).toBe('₹100.00')
  })

  it('formats paise correctly, not just divides by 100 loosely', () => {
    expect(formatMoney(12345)).toBe('₹123.45')
  })

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('₹0.00')
  })

  it('supports a different currency code', () => {
    expect(formatMoney(10000, 'USD')).toBe('$100.00')
  })
})

describe('rupeesToMinorUnits', () => {
  it('converts whole rupees to paise', () => {
    expect(rupeesToMinorUnits(100)).toBe(10000)
  })

  it('converts fractional rupees to paise without float drift', () => {
    // 33.33 * 100 in raw floating point is 3332.9999999999995 - this must round, not truncate
    expect(rupeesToMinorUnits(33.33)).toBe(3333)
  })

  it('round-trips through formatMoney', () => {
    expect(formatMoney(rupeesToMinorUnits(499.5))).toBe('₹499.50')
  })
})
