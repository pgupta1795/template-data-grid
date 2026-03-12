import type { GridRow } from '@/components/data-grid/types/grid-types'
import type { SortState } from '@/components/data-grid/types/sort-types'
import type { FilterState } from '@/components/data-grid/types/filter-types'

const STATUS_OPTIONS = ['active', 'draft', 'obsolete', 'review'] as const
const ALL_TAGS = ['mechanical', 'electrical', 'software', 'fastener', 'assembly', 'raw-material']
const DESCRIPTIONS = [
  'Stainless Steel Bracket',
  'Aluminum Housing Cover',
  'PCB Control Board',
  'Rubber O-Ring Seal',
  'Titanium Fastener Set',
  'Copper Wire Harness',
  'Injection-Molded Frame',
  'Precision Gear Assembly',
  'LED Driver Module',
  'Carbon Fiber Panel',
  'Hydraulic Valve',
  'Sensor Array Unit',
  'Motor Controller',
  'Thermal Interface Pad',
  'Connector Housing',
]

const INTERNAL_CODE_SNIPPETS = [
  'BOM-2024-001',
  'REV-B-FINAL',
  'MFG-SPEC-v2.3',
  'PART-XR-7891',
  'SN-{serial}',
  'SKU-A-4421-B',
]

function randomItem<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length]
}

function randomSubset(arr: string[], seed: number, min = 1, max = 3): string[] {
  const count = min + (seed % (max - min + 1))
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    const item = arr[(seed + i * 7) % arr.length]
    if (!result.includes(item)) result.push(item)
  }
  return result
}

function generateRow(index: number, depth = 0): GridRow {
  const seed = index * 31 + depth * 97
  const status = randomItem(STATUS_OPTIONS, seed)
  const tags = randomSubset(ALL_TAGS, seed)
  const createdAt = new Date(2023, (seed % 12), 1 + (seed % 28))

  return {
    id: `row-${index}-d${depth}`,
    partNumber: `PN-${String(index).padStart(5, '0')}`,
    description: randomItem(DESCRIPTIONS, seed),
    quantity: 1 + (seed % 99),
    unitPrice: parseFloat((0.5 + (seed % 9999) / 100).toFixed(2)),
    status,
    tags,
    createdAt,
    isActive: seed % 3 !== 0,
    internalCode: randomItem(INTERNAL_CODE_SNIPPETS, seed),
  }
}

function generateChildren(parentIndex: number, depth: number): GridRow[] {
  const childCount = 2 + (parentIndex % 4) // 2–5 children
  return Array.from({ length: childCount }, (_, i) =>
    generateRow(parentIndex * 100 + i + 1, depth + 1)
  )
}

export function generateMockBomData(count: number): GridRow[] {
  return Array.from({ length: count }, (_, i) => {
    const row = generateRow(i)
    // 10% of rows have children
    if (i % 10 === 0) {
      row.children = generateChildren(i, 0)
      row._hasChildren = true
    }
    return row
  })
}

/** Generate only root-level nodes (no children pre-loaded) for lazy tree demo */
export function generateMockRootNodes(count: number): GridRow[] {
  return Array.from({ length: count }, (_, i) => {
    const row = generateRow(i)
    // Signal that children CAN be fetched (lazy), but don't pre-load them
    row._hasChildren = true
    row.children = []
    return row
  })
}

/** Simulate async child fetch for lazy tree demo */
export function generateMockChildren(
  parentId: string,
  count: number,
): GridRow[] {
  const seed = parentId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return Array.from({ length: count }, (_, i) => {
    const row = generateRow(seed * 100 + i + 1, 1)
    row.id = `${parentId}-child-${i}`
    // ~30% of children also have lazy children
    if (i % 3 === 0) {
      row._hasChildren = true
      row.children = []
    }
    return row
  })
}

export function simulateMutation<T>(value: T, delay = 600): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) {
        reject(new Error('Simulated mutation failure'))
      } else {
        resolve(value)
      }
    }, delay)
  })
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 10k rows pre-generated once for stable "server" simulation
const ALL_MOCK_DATA: GridRow[] = Array.from({ length: 10000 }, (_, i) =>
  generateRow(i),
)

function applySort(rows: GridRow[], sort: SortState[]): GridRow[] {
  if (sort.length === 0) return rows
  return [...rows].sort((a, b) => {
    for (const { columnId, direction } of sort) {
      const av = a[columnId]
      const bv = b[columnId]
      if (av == null && bv == null) continue
      if (av == null) return 1
      if (bv == null) return -1
      let cmp = 0
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv
      } else if (av instanceof Date && bv instanceof Date) {
        cmp = av.getTime() - bv.getTime()
      } else {
        cmp = String(av).localeCompare(String(bv))
      }
      if (cmp !== 0) return direction === 'asc' ? cmp : -cmp
    }
    return 0
  })
}

function applyFilters(rows: GridRow[], filters: FilterState[]): GridRow[] {
  return rows.filter((row) =>
    filters.every(({ columnId, value }) => {
      const cell = row[columnId]
      if (value == null || value === '') return true
      if (Array.isArray(value)) {
        // Number range: [min, max]
        if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
          const num = Number(cell)
          return !isNaN(num) && num >= value[0] && num <= value[1]
        }
        // Multi-value / select: equality set membership
        return value.length === 0 || value.some(v => String(cell).toLowerCase() === String(v).toLowerCase())
      }
      if (typeof value === 'object' && value !== null && ('from' in value || 'to' in value)) {
        // Date range filter: { from?: string, to?: string }
        const dateFilter = value as { from?: string; to?: string }
        const cellDate = cell instanceof Date ? cell : new Date(String(cell ?? ''))
        if (isNaN(cellDate.getTime())) return true // can't parse, don't filter out
        if (dateFilter.from && cellDate < new Date(dateFilter.from)) return false
        if (dateFilter.to && cellDate > new Date(dateFilter.to)) return false
        return true
      }
      if (typeof value === 'object' && 'value' in value) {
        // string/code filter: { value, operator }
        const { value: str, operator } = value as {
          value: string
          operator: string
        }
        const cellStr = String(cell ?? '').toLowerCase()
        const searchStr = str.toLowerCase()
        if (operator === 'startsWith') return cellStr.startsWith(searchStr)
        return cellStr.includes(searchStr) // 'contains' or default
      }
      return String(cell ?? '')
        .toLowerCase()
        .includes(String(value).toLowerCase())
    }),
  )
}

export async function fetchBomPage(params: {
  pageIndex: number
  pageSize: number
  sort: SortState[]
  filters: FilterState[]
}): Promise<{ rows: GridRow[]; total: number }> {
  await delay(400 + Math.random() * 300)
  let rows = [...ALL_MOCK_DATA]
  if (params.filters.length > 0) rows = applyFilters(rows, params.filters)
  if (params.sort.length > 0) rows = applySort(rows, params.sort)
  const total = rows.length
  const start = params.pageIndex * params.pageSize
  return { rows: rows.slice(start, start + params.pageSize), total }
}

export async function fetchBomInfinitePage(params: {
  pageParam: number
  sort: SortState[]
  filters: FilterState[]
}): Promise<{ rows: GridRow[]; nextPage: number | null; total: number }> {
  await delay(300 + Math.random() * 200)
  const PAGE_SIZE = 50
  let rows = [...ALL_MOCK_DATA]
  if (params.filters.length > 0) rows = applyFilters(rows, params.filters)
  if (params.sort.length > 0) rows = applySort(rows, params.sort)
  const start = params.pageParam * PAGE_SIZE
  const pageRows = rows.slice(start, start + PAGE_SIZE)
  const nextPage =
    start + PAGE_SIZE < rows.length ? params.pageParam + 1 : null
  return { rows: pageRows, nextPage, total: rows.length }
}
