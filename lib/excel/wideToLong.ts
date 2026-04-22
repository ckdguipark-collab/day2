import type { RawDDDRow } from './parseExcel'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "Jan 2024" → "2024-01" 매핑
export const MONTH_MAP: Record<string, string> = {}
export const MONTH_LABELS: string[] = []

for (let year = 2024; year <= 2025; year++) {
  for (let i = 0; i < 12; i++) {
    const label = `${MONTHS[i]} ${year}`
    MONTH_MAP[label] = `${year}-${String(i + 1).padStart(2, '0')}`
    MONTH_LABELS.push(label)
  }
}

export interface LongDDDRow {
  brick_code: string
  year_month: string
  product_brand: string
  ingredient_market: string
  product_type: string
  manufacturer: string | null
  our_product: string | null
  pack: string
  ddd_qty: number
}

export function wideToLong(rawRows: RawDDDRow[]): LongDDDRow[] {
  const result: LongDDDRow[] = []
  for (const row of rawRows) {
    for (const [monthLabel, yearMonth] of Object.entries(MONTH_MAP)) {
      const qty = row.months[monthLabel] ?? 0
      if (qty === 0) continue
      result.push({
        brick_code: row.brick_code,
        year_month: yearMonth,
        product_brand: row.product_brand,
        ingredient_market: row.ingredient_market,
        product_type: row.product_type,
        manufacturer: row.manufacturer,
        our_product: row.our_product,
        pack: row.pack,
        ddd_qty: qty,
      })
    }
  }
  return result
}
