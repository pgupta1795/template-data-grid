import type { GridRow } from '../types/grid-types'

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
