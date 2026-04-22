import * as XLSX from 'xlsx'
import { getIngredientMarket, getProductType } from './parseIngredient'
import { MONTH_LABELS } from './wideToLong'

export interface RawDDDRow {
  brick_code: string
  product_brand: string
  ingredient_market: string
  product_type: string
  manufacturer: string | null
  our_product: string | null
  pack: string
  months: Record<string, number>
}

export interface BrickRow {
  brick_code: string
  hospital_name: string
  hospital_type: string | null
  division: string | null
  team: string | null
  manager_name: string | null
  employee_id: number | null
  customer_code: string | null
  brick_name_k: string | null
}

export interface ParseResult {
  rawRows: RawDDDRow[]
  brickRows: BrickRow[]
}

export interface PreviewSheet {
  name: string
  type: 'raw' | 'brick_master' | 'unknown'
  headers: string[]
  rows: Record<string, unknown>[]
}

// 헤더에서 컬럼 찾기 (다양한 표기 허용)
function findCol(headers: string[], ...keywords: string[]): string | undefined {
  const normalize = (s: string) => s.toLowerCase().replace(/[\s_\-()]/g, '')
  for (const kw of keywords) {
    const found = headers.find(h => normalize(h).includes(normalize(kw)))
    if (found !== undefined) return found
  }
}

function isMonthLabel(header: string): boolean {
  return MONTH_LABELS.includes(header)
}

function parseRawSheet(rows: Record<string, unknown>[]): RawDDDRow[] {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])
  const monthCols = headers.filter(isMonthLabel)
  if (!monthCols.length) return []

  const brickCol = findCol(headers, 'brickcode', 'brick_code', 'brickCode', 'Brick Code')
  const brandCol = findCol(headers, 'brandname', 'brand', 'productbrand', 'Product Brand', 'Brand Name')
  const packCol = findCol(headers, 'packmolecule', 'packstring', 'Pack Molecule', 'molecule', '성분')
  const mfgCol = findCol(headers, 'manufacturer', '제조사', 'company')
  const ourProductCol = findCol(headers, '제품')

  if (!brickCol || !brandCol) return []

  return rows
    .filter(row => row[brickCol] && row[brandCol])
    .map(row => {
      const rawPack = packCol ? String(row[packCol] ?? '').trim() : ''
      return {
        brick_code: String(row[brickCol]).trim(),
        product_brand: String(row[brandCol]).trim(),
        ingredient_market: rawPack ? getIngredientMarket(rawPack) : '',
        product_type: rawPack ? getProductType(rawPack) : 'Original',
        manufacturer: mfgCol ? (row[mfgCol] ? String(row[mfgCol]).trim() : null) : null,
        our_product: ourProductCol ? (row[ourProductCol] ? String(row[ourProductCol]).trim() : null) : null,
        pack: rawPack || '',
        months: Object.fromEntries(monthCols.map(col => [col, Number(row[col]) || 0])),
      }
    })
}

function parseBrickSheet(rows: Record<string, unknown>[]): BrickRow[] {
  if (!rows.length) return []
  const headers = Object.keys(rows[0])

  const brickCol = findCol(headers, 'brickcode', 'brick_code', 'Brick Code')
  const hospitalNameCol = findCol(headers, 'hospitalname', 'hospital_name', '병원명', 'Hospital Name')
  const hospitalTypeCol = findCol(headers, 'hospitaltype', 'hospital_type', '종합구분', 'Hospital Type')
  const divisionCol = findCol(headers, 'division', '사업부')
  const teamCol = findCol(headers, 'team', '팀')
  const managerCol = findCol(headers, 'managername', 'manager_name', '담당자', 'Manager')
  const empIdCol = findCol(headers, 'employeeid', 'employee_id', '사번', 'Employee')
  const custCodeCol = findCol(headers, 'customercode', 'customer_code', '거래처코드', 'Customer')
  const brickNameKCol = findCol(headers, 'bricknamek', 'brick_name', 'BrickName')

  if (!brickCol) return []

  return rows
    .filter(row => row[brickCol])
    .map(row => ({
      brick_code: String(row[brickCol]).trim(),
      hospital_name: hospitalNameCol ? String(row[hospitalNameCol] ?? '').trim() : '',
      hospital_type: hospitalTypeCol ? (row[hospitalTypeCol] ? String(row[hospitalTypeCol]).trim() : null) : null,
      division: divisionCol ? (row[divisionCol] ? String(row[divisionCol]).trim() : null) : null,
      team: teamCol ? (row[teamCol] ? String(row[teamCol]).trim() : null) : null,
      manager_name: managerCol ? (row[managerCol] ? String(row[managerCol]).trim() : null) : null,
      employee_id: empIdCol ? (row[empIdCol] ? Number(row[empIdCol]) || null : null) : null,
      customer_code: custCodeCol ? (row[custCodeCol] ? String(row[custCodeCol]).trim() : null) : null,
      brick_name_k: brickNameKCol ? (row[brickNameKCol] ? String(row[brickNameKCol]).trim() : null) : null,
    }))
}

function detectSheetType(rows: Record<string, unknown>[]): 'raw' | 'brick_master' | 'unknown' {
  if (!rows.length) return 'unknown'
  const headers = Object.keys(rows[0])
  if (headers.some(isMonthLabel)) return 'raw'
  const hasDivision = headers.some(h =>
    ['사업부', 'division', 'Division'].some(kw => h.includes(kw))
  )
  if (hasDivision) return 'brick_master'
  return 'unknown'
}

export function parseExcel(buffer: Buffer | ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  let rawRows: RawDDDRow[] = []
  let brickRows: BrickRow[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
    const type = detectSheetType(rows)

    if (type === 'raw' && !rawRows.length) {
      rawRows = parseRawSheet(rows)
    } else if (type === 'brick_master' && !brickRows.length) {
      brickRows = parseBrickSheet(rows)
    }
  }

  return { rawRows, brickRows }
}

// 클라이언트 측 미리보기용 (브라우저에서 호출)
export function getSheetPreviews(buffer: ArrayBuffer): PreviewSheet[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  return workbook.SheetNames.map(name => {
    const sheet = workbook.Sheets[name]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
    const type = detectSheetType(rows)
    return {
      name,
      type,
      headers: rows.length ? Object.keys(rows[0]) : [],
      rows: rows.slice(0, 5),
    }
  })
}
