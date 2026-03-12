import type { GridRow } from "@/types/grid-types"

// Simulated delay
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface BomRow extends GridRow {
  id: string
  partNumber: string
  description: string
  quantity: number
  unitPrice: number
  supplierId: string
  status: "active" | "draft" | "obsolete" | "review"
  isActive: boolean
  internalCode: string
  createdAt: string
  children?: BomRow[]
}

export interface SupplierRow {
  id: string
  name: string
  country: string
}

const SUPPLIERS: SupplierRow[] = [
  { id: "s1", name: "Acme Corp", country: "US" },
  { id: "s2", name: "Globex Industries", country: "DE" },
  { id: "s3", name: "Initech", country: "UK" },
  { id: "s4", name: "Umbrella Ltd", country: "JP" },
]

const BOM_DATA: BomRow[] = [
  {
    id: "1",
    partNumber: "PN-001",
    description: "Main Assembly",
    quantity: 1,
    unitPrice: 500,
    supplierId: "s1",
    status: "active",
    isActive: true,
    internalCode: "INT-001",
    createdAt: "2024-01-15",
    children: [
      {
        id: "1-1",
        partNumber: "PN-002",
        description: "Sub Assembly A",
        quantity: 2,
        unitPrice: 120,
        supplierId: "s2",
        status: "active",
        isActive: true,
        internalCode: "INT-002",
        createdAt: "2024-01-16",
      },
      {
        id: "1-2",
        partNumber: "PN-003",
        description: "Sub Assembly B",
        quantity: 3,
        unitPrice: 85,
        supplierId: "s1",
        status: "review",
        isActive: false,
        internalCode: "INT-003",
        createdAt: "2024-02-01",
        children: [
          {
            id: "1-2-1",
            partNumber: "PN-003-1",
            description: "Sub Assembly B",
            quantity: 3,
            unitPrice: 85,
            supplierId: "s1",
            status: "review",
            isActive: false,
            internalCode: "INT-003",
            createdAt: "2024-02-01",
          },
          {
            id: "1-2-2",
            partNumber: "PN-003-2",
            description: "Sub Assembly B",
            quantity: 3,
            unitPrice: 85,
            supplierId: "s1",
            status: "review",
            isActive: false,
            internalCode: "INT-003",
            createdAt: "2024-02-01",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    partNumber: "PN-004",
    description: "Secondary Module",
    quantity: 4,
    unitPrice: 220,
    supplierId: "s3",
    status: "draft",
    isActive: false,
    internalCode: "INT-004",
    createdAt: "2024-03-10",
    children: [
      {
        id: "2-1",
        partNumber: "PN-005",
        description: "Component X",
        quantity: 10,
        unitPrice: 15,
        supplierId: "s4",
        status: "active",
        isActive: true,
        internalCode: "INT-005",
        createdAt: "2024-03-12",
      },
    ],
  },
  {
    id: "3",
    partNumber: "PN-006",
    description: "Standalone Part",
    quantity: 2,
    unitPrice: 340,
    supplierId: "s2",
    status: "active",
    isActive: true,
    internalCode: "INT-006",
    createdAt: "2024-04-05",
  },
]

async function fetchBomData(): Promise<{ items: BomRow[] }> {
  await delay(600 + Math.random() * 400)
  return { items: BOM_DATA }
}

async function fetchSuppliers(
  ids: string[]
): Promise<{ suppliers: SupplierRow[] }> {
  await delay(300 + Math.random() * 200)
  const filtered =
    ids.length > 0 ? SUPPLIERS.filter((s) => ids.includes(s.id)) : SUPPLIERS
  return { suppliers: filtered }
}

/**
 * Installs mock API handlers for the engine demo by monkey-patching fetch.
 * Only active in development. In production, replace with real API endpoints.
 */
export function installMockApiInterceptor(): void {
  const originalFetch = window.fetch

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString()

    if (url.startsWith("/api/demo/bom")) {
      const data = await fetchBomData()
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
    }

    if (url.startsWith("/api/demo/suppliers")) {
      const idsParam =
        new URL(url, "http://localhost").searchParams.get("ids") ?? ""
      const ids = idsParam ? idsParam.split(",") : []
      const data = await fetchSuppliers(ids)
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
    }

    return originalFetch(input, init)
  }
}
