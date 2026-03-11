# Phase 14 — useTableEngine Hook + ConfiguredTable + Demo

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire all engine modules into the orchestration hook `useTableEngine`, build the `ConfiguredTable` React component, and create a working BOM demo that proves the full engine pipeline end-to-end.

**Architecture:** `useTableEngine` orchestrates: config validation → DAG execution (via TanStack Query) → derived value computation → row-level source enrichment → column building. `ConfiguredTable` is a thin wrapper that forwards results to the existing `DataGrid`. The demo shows a tree-mode BOM table with a secondary supplier source.

**Tech Stack:** React, TypeScript, TanStack Query v5 (`useQuery` / `useInfiniteQuery`), existing `useInfiniteData` hook, shadcn `Alert`, existing `DataGrid`

**Depends on:** Phase 10 (types + DataGrid extensions), Phase 11 (dag-resolver + jsonata-evaluator), Phase 12 (api-executor), Phase 13 (column-builder)

**Spec:** `docs/superpowers/specs/2026-03-12-table-engine-design.md`

---

## Chunk 1: Config Validator

### Task 1: `src/lib/table-engine/config-validator.ts`

**Files:**
- Create: `src/lib/table-engine/config-validator.ts`
- Create: `src/lib/table-engine/config-validator.test.ts`

Config validation is extracted into its own file so it can be called once at hook-mount time and also independently tested without needing React.

- [ ] **Step 1: Write failing tests**

Create `src/lib/table-engine/config-validator.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { validateConfig } from "./config-validator"
import { ConfigError } from "./types"
import type { TableConfig } from "./types"

const baseConfig: TableConfig = {
  id: "test",
  mode: "flat",
  dataSources: [{ id: "bom", url: "/api/bom" }],
  columns: [{ field: "name", header: "Name" }],
}

describe("validateConfig", () => {
  it("passes for a valid minimal config", () => {
    expect(() => validateConfig(baseConfig)).not.toThrow()
  })

  it("throws ConfigError when id is missing", () => {
    const config = { ...baseConfig, id: "" }
    expect(() => validateConfig(config)).toThrow(ConfigError)
    expect(() => validateConfig(config)).toThrow(/id/)
  })

  it("throws ConfigError when dataSources is empty", () => {
    const config = { ...baseConfig, dataSources: [] }
    expect(() => validateConfig(config)).toThrow(ConfigError)
    expect(() => validateConfig(config)).toThrow(/dataSources/)
  })

  it("throws ConfigError when columns is empty", () => {
    const config = { ...baseConfig, columns: [] }
    expect(() => validateConfig(config)).toThrow(ConfigError)
    expect(() => validateConfig(config)).toThrow(/columns/)
  })

  it("throws ConfigError when a column references an unknown dataSource", () => {
    const config: TableConfig = {
      ...baseConfig,
      columns: [
        { field: "name", header: "Name", dataSource: "nonexistent" },
      ],
    }
    expect(() => validateConfig(config)).toThrow(ConfigError)
    expect(() => validateConfig(config)).toThrow(/nonexistent/)
  })

  it("throws ConfigError when a rowLevel source has no cacheKey", () => {
    const config: TableConfig = {
      ...baseConfig,
      dataSources: [{ id: "bom", url: "/api/bom", rowLevel: true }],
    }
    expect(() => validateConfig(config)).toThrow(ConfigError)
    expect(() => validateConfig(config)).toThrow(/cacheKey/)
  })

  it("throws ConfigError on circular dependency via buildWaves", () => {
    const config: TableConfig = {
      ...baseConfig,
      dataSources: [
        { id: "a", url: "/a", dependsOn: ["b"] },
        { id: "b", url: "/b", dependsOn: ["a"] },
      ],
    }
    expect(() => validateConfig(config)).toThrow(ConfigError)
    expect(() => validateConfig(config)).toThrow(/circular/i)
  })

  it("throws ConfigError when mode is 'tree' but no subRowsField and no tree-related source", () => {
    // This is just a warning scenario — tree mode works without subRowsField
    // as DataGrid defaults to row.children. Validation should PASS.
    const config: TableConfig = { ...baseConfig, mode: "tree" }
    expect(() => validateConfig(config)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/lib/table-engine/config-validator.test.ts
```

- [ ] **Step 3: Write `src/lib/table-engine/config-validator.ts`**

```ts
import { buildWaves } from "./dag-resolver"
import { ConfigError } from "./types"
import type { TableConfig } from "./types"

/**
 * Validates a TableConfig at hook-mount time (before any fetch).
 * Throws ConfigError with a descriptive message on the first problem found.
 * This keeps all validation in one place and makes errors easy to find.
 */
export function validateConfig(config: TableConfig): void {
  if (!config.id?.trim()) {
    throw new ConfigError("TableConfig.id is required and must be a non-empty string.")
  }

  if (!config.dataSources || config.dataSources.length === 0) {
    throw new ConfigError(
      `TableConfig "${config.id}": dataSources must contain at least one entry.`
    )
  }

  if (!config.columns || config.columns.length === 0) {
    throw new ConfigError(
      `TableConfig "${config.id}": columns must contain at least one entry.`
    )
  }

  // Validate rowLevel sources have a cacheKey
  const sourceIds = new Set(config.dataSources.map((s) => s.id))
  for (const source of config.dataSources) {
    if (source.rowLevel && !source.cacheKey) {
      throw new ConfigError(
        `DataSource "${source.id}" has rowLevel:true but no cacheKey. ` +
          `Provide a JSONata cacheKey expression (e.g. "$string(supplierId)") to deduplicate row-level calls.`
      )
    }
  }

  // Validate column dataSource references point to known sources
  for (const col of config.columns) {
    if (col.dataSource && !sourceIds.has(col.dataSource)) {
      throw new ConfigError(
        `Column "${col.field}" references unknown dataSource "${col.dataSource}". ` +
          `Available source ids: ${[...sourceIds].join(", ")}`
      )
    }
  }

  // Validate DAG (circular deps, unknown dep ids) — buildWaves throws ConfigError
  buildWaves(config.dataSources)
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/lib/table-engine/config-validator.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/table-engine/config-validator.ts src/lib/table-engine/config-validator.test.ts
git commit -m "feat(table-engine): add config validator with structural and DAG checks"
```

---

## Chunk 2: `useTableEngine` Hook

### Task 2: `src/lib/table-engine/use-table-engine.ts`

**Files:**
- Create: `src/lib/table-engine/use-table-engine.ts`

This is the orchestration layer. It composes all engine modules and integrates with TanStack Query. Integration testing is done via the demo in Task 4 (browser verification).

- [ ] **Step 1: Write `src/lib/table-engine/use-table-engine.ts`**

```ts
import { useInfiniteData } from "@/hooks/use-infinite-data"
import type { GridRow } from "@/types/grid-types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import React from "react"
import { fetchSource, type FetchResult } from "./api-executor"
import { buildColumns } from "./column-builder"
import { validateConfig } from "./config-validator"
import { buildWaves, executeWaves } from "./dag-resolver"
import { evaluateRowExpr } from "./jsonata-evaluator"
import type {
  DataSourceConfig,
  SourceMap,
  TableConfig,
  TableEngineResult,
} from "./types"

// Re-export FetchResult for convenience
export type { FetchResult }

// ─── Source Executor ──────────────────────────────────────────────────────────

/**
 * Creates the executeFn for executeWaves — handles building the final URL/body
 * from prior $sources context and calling fetchSource.
 */
function createSourceExecutor(
  sources: DataSourceConfig[],
  signal?: AbortSignal
) {
  const sourceMap = new Map(sources.map((s) => [s.id, s]))

  return async (id: string, resolvedSources: SourceMap): Promise<unknown> => {
    const source = sourceMap.get(id)
    if (!source) throw new Error(`Unknown source id: ${id}`)

    const result = await fetchSource(source, resolvedSources, signal)
    if (result.error) throw result.error
    return result.data
  }
}

// ─── Derived Value Computation ────────────────────────────────────────────────

/**
 * For all columns with valueExpr, evaluate the JSONata expression against each
 * row and write the result directly onto the row object at row[field].
 * Done in parallel across all rows for a given column.
 */
async function computeDerivedValues<TData extends GridRow>(
  rows: TData[],
  columns: TableConfig["columns"]
): Promise<TData[]> {
  const derivedCols = columns.filter((c) => c.valueExpr)
  if (derivedCols.length === 0) return rows

  // Process all derived columns for all rows in parallel
  const enrichedRows = await Promise.all(
    rows.map(async (row) => {
      const enriched = { ...row }
      await Promise.all(
        derivedCols.map(async (col) => {
          try {
            const value = await evaluateRowExpr(col.valueExpr!, {
              row: row as Record<string, unknown>,
            })
            ;(enriched as Record<string, unknown>)[col.field] = value
          } catch {
            // Derived value failure: leave field undefined rather than crashing
            ;(enriched as Record<string, unknown>)[col.field] = null
          }
        })
      )
      return enriched
    })
  )

  return enrichedRows
}

// ─── Primary Data Resolution ──────────────────────────────────────────────────

/**
 * Resolves all non-rowLevel sources via the DAG executor.
 * Returns the full SourceMap and the primary rows array.
 * The "primary source" is the first non-rowLevel DataSourceConfig.
 */
async function resolvePrimaryData<TData extends GridRow>(
  config: TableConfig,
  signal?: AbortSignal
): Promise<{ sourceMap: SourceMap; rows: TData[] }> {
  const nonRowLevelSources = config.dataSources.filter((s) => !s.rowLevel)
  const waves = buildWaves(nonRowLevelSources)
  const executor = createSourceExecutor(nonRowLevelSources, signal)
  const sourceMap = await executeWaves(waves, executor, signal)

  // Primary source = first non-rowLevel source (by config order)
  const primarySourceId = nonRowLevelSources[0]?.id
  const rawRows = primarySourceId ? sourceMap[primarySourceId] : []
  const rows = Array.isArray(rawRows) ? (rawRows as TData[]) : []

  return { sourceMap, rows }
}

// ─── Row-Level Source Enrichment ──────────────────────────────────────────────

/**
 * For all rowLevel DataSourceConfigs, fetch enrichment data for each row
 * using cacheKey-based deduplication, then merge results into rows.
 * Errors from individual row fetches are collected, not re-thrown.
 */
async function enrichRowsWithRowLevelSources<TData extends GridRow>(
  rows: TData[],
  config: TableConfig,
  resolvedSources: SourceMap,
  signal?: AbortSignal
): Promise<{
  rows: TData[]
  rowSourceErrors: TableEngineResult<TData>["rowSourceErrors"]
}> {
  const rowLevelSources = config.dataSources.filter((s) => s.rowLevel)
  if (rowLevelSources.length === 0) {
    return { rows, rowSourceErrors: [] }
  }

  const { fetchRowLevelSource } = await import("./api-executor")
  const rowSourceErrors: TableEngineResult<TData>["rowSourceErrors"] = []

  // Process each row-level source
  for (const source of rowLevelSources) {
    const dedupeMap = new Map<string, Promise<{ data: unknown; error: Error | null }>>()

    // Find columns that bind to this source
    const joinCols = config.columns.filter(
      (c) => c.dataSource === source.id && c.joinOn
    )
    if (joinCols.length === 0) continue

    // Fetch for all rows in parallel (deduplicated by cacheKey)
    const rowResults = await Promise.all(
      rows.map((row) =>
        fetchRowLevelSource(
          source,
          row as Record<string, unknown>,
          resolvedSources,
          dedupeMap,
          signal
        )
      )
    )

    // Merge results into rows
    rows = rows.map((row, idx) => {
      const { data, error } = rowResults[idx]
      if (error) {
        // Compute cacheKey for error reporting
        const cacheKey = source.cacheKey
          ? String((row as Record<string, unknown>)[source.cacheKey] ?? "")
          : String(idx)
        rowSourceErrors.push({ sourceId: source.id, cacheKey, error })
        return row
      }

      // Merge all join-column values onto the row
      const enriched = { ...row }
      if (data && Array.isArray(data)) {
        for (const col of joinCols) {
          if (!col.joinOn) continue
          // Match on sourceKey (PK), return sourceField (display value)
          const match = (data as Record<string, unknown>[]).find(
            (r) => r[col.joinOn!.sourceKey] === (row as Record<string, unknown>)[col.joinOn!.rowField]
          )
          ;(enriched as Record<string, unknown>)[col.field] = match
            ? match[col.joinOn.sourceField]
            : null
        }
      }
      return enriched
    })
  }

  return { rows, rowSourceErrors }
}

// ─── Full Resolution Pipeline ─────────────────────────────────────────────────

interface ResolvedData<TData extends GridRow> {
  rows: TData[]
  sourceMap: SourceMap
  rowSourceErrors: TableEngineResult<TData>["rowSourceErrors"]
}

async function resolveAll<TData extends GridRow>(
  config: TableConfig,
  signal?: AbortSignal
): Promise<ResolvedData<TData>> {
  const { sourceMap, rows: primaryRows } = await resolvePrimaryData<TData>(
    config,
    signal
  )

  const withDerived = await computeDerivedValues(primaryRows, config.columns)
  const { rows, rowSourceErrors } = await enrichRowsWithRowLevelSources(
    withDerived,
    config,
    sourceMap,
    signal
  )

  return { rows, sourceMap, rowSourceErrors }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Orchestrates config validation, DAG-based API fetching, derived value computation,
 * row-level enrichment, and column building for a given TableConfig.
 *
 * Returns everything DataGrid needs — pass the result to <ConfiguredTable /> or
 * spread it manually onto <DataGrid />.
 */
export function useTableEngine<TData extends GridRow>(
  config: TableConfig
): TableEngineResult<TData> {
  // Validate config once at mount — throws ConfigError before any render/query
  const validationError = React.useMemo(() => {
    try {
      validateConfig(config)
      return null
    } catch (err) {
      return err instanceof Error ? err : new Error(String(err))
    }
  }, [config.id]) // Only re-validate when id changes (config identity)

  const isFlat = config.mode === "flat"
  const isPaginated = config.mode === "paginated"
  const isInfinite = config.mode === "infinite"

  // ── Flat + Paginated: useQuery ──────────────────────────────────────────
  const flatQuery = useQuery({
    queryKey: [config.id, "engine", config.mode],
    queryFn: ({ signal }): Promise<ResolvedData<TData>> =>
      resolveAll<TData>(config, signal),
    enabled: !validationError && (isFlat || isPaginated),
    placeholderData: keepPreviousData,
  })

  // ── Infinite: useInfiniteData ───────────────────────────────────────────
  const infiniteQuery = useInfiniteData<TData>({
    queryKey: [config.id, "engine"],
    queryFn: async ({ pageParam, sort, filters }) => {
      // Inject page context into the primary source's params via a special $pageParam binding
      const paginatedConfig: TableConfig = {
        ...config,
        dataSources: config.dataSources.map((s, idx) =>
          idx === 0
            ? {
                ...s,
                params: {
                  ...s.params,
                  page: String(pageParam),
                  _sort: JSON.stringify(sort),
                  _filters: JSON.stringify(filters),
                },
              }
            : s
        ),
      }

      const { rows } = await resolveAll<TData>(paginatedConfig)
      return {
        rows,
        nextPage: rows.length >= (config.options?.pageSize ?? 50) ? pageParam + 1 : null,
        total: undefined,
      }
    },
    sortState: [],
    filterState: [],
    enabled: !validationError && isInfinite,
  })

  // ── Row-source errors — derived from query data (populated by resolveAll) ──
  const rowSourceErrors: TableEngineResult<TData>["rowSourceErrors"] =
    flatQuery.data?.rowSourceErrors ?? []

  // ── Column build (memoized) ─────────────────────────────────────────────
  const sourceMap: SourceMap = React.useMemo(() => {
    if (isInfinite) return {}
    return (flatQuery.data?.sourceMap) ?? {}
  }, [flatQuery.data, isInfinite])

  const { columns, initialColumnVisibility } = React.useMemo(
    () => buildColumns<TData>(config.columns, config.features, sourceMap),
    [config.columns, config.features, sourceMap]
  )

  // ── Derive final rows ────────────────────────────────────────────────────
  const data: TData[] = React.useMemo(() => {
    if (isInfinite) return infiniteQuery.rows as TData[]
    return flatQuery.data?.rows ?? []
  }, [isInfinite, infiniteQuery.rows, flatQuery.data])

  // ── Loading / error state ────────────────────────────────────────────────
  const isLoading = isInfinite ? infiniteQuery.isLoading : flatQuery.isLoading
  const isError = isInfinite
    ? infiniteQuery.isError
    : (validationError !== null || flatQuery.isError)
  const error: Error | null = isInfinite
    ? (infiniteQuery.error as Error | null)
    : (validationError ?? (flatQuery.error as Error | null))

  return {
    data,
    columns,
    initialColumnVisibility,
    isLoading,
    isError,
    error,
    refetch: isInfinite ? infiniteQuery.refetch : flatQuery.refetch,
    rowSourceErrors,
    // Infinite mode props
    ...(isInfinite
      ? {
          fetchNextPage: infiniteQuery.fetchNextPage,
          hasNextPage: infiniteQuery.hasNextPage,
          isFetchingNextPage: infiniteQuery.isFetchingNextPage,
          total: infiniteQuery.total,
        }
      : {}),
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/table-engine/use-table-engine.ts
git commit -m "feat(table-engine): add useTableEngine orchestration hook"
```

---

## Chunk 3: `ConfiguredTable` Component

### Task 3: `src/lib/table-engine/configured-table.tsx`

**Files:**
- Create: `src/lib/table-engine/configured-table.tsx`

- [ ] **Step 1: Write `src/lib/table-engine/configured-table.tsx`**

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DataGrid } from "@/components/data-grid/data-grid"
import type { GridRow } from "@/types/grid-types"
import { useTableEngine } from "./use-table-engine"
import type { TableConfig } from "./types"

export interface ConfiguredTableProps {
  config: TableConfig
  className?: string
}

/**
 * Declarative table component. Pass a TableConfig and get a fully-featured DataGrid.
 *
 * Handles:
 * - Multi-source API fetching with DAG-based dependency resolution
 * - JSONata data transforms and derived column values
 * - Per-column visibility, sorting, filtering, editing, resizing, and ordering control
 * - Flat, Paginated, Infinite, and Tree modes
 *
 * @example
 * <ConfiguredTable config={bomTableConfig} />
 */
export function ConfiguredTable({ config, className }: ConfiguredTableProps) {
  const {
    data,
    columns,
    initialColumnVisibility,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTableEngine<GridRow>(config)

  if (isError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Failed to load table</AlertTitle>
        <AlertDescription>
          {error?.message ?? "An unexpected error occurred."}
        </AlertDescription>
      </Alert>
    )
  }

  // Strip engine-only feature keys before passing to DataGrid.
  // DataGrid accepts GridFeaturesConfig; columnOrdering/Resizing/Visibility are engine-only.
  const {
    columnOrdering: _co,
    columnResizing: _cr,
    columnVisibility: _cv,
    ...gridFeatures
  } = config.features ?? {}

  return (
    <DataGrid
      data={data}
      columns={columns}
      mode={config.mode}
      features={gridFeatures}
      isLoading={isLoading}
      initialColumnVisibility={initialColumnVisibility}
      getSubRows={
        config.options?.subRowsField
          ? (row) =>
              (row as Record<string, unknown>)[
                config.options!.subRowsField!
              ] as GridRow[] | undefined
          : undefined
      }
      isFetchingNextPage={isFetchingNextPage}
      className={className}
    />
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors. If `Alert` / `AlertTitle` / `AlertDescription` don't exist yet in `src/components/ui/`, install them:

```bash
npx shadcn@latest add alert
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/table-engine/configured-table.tsx
git commit -m "feat(table-engine): add ConfiguredTable component"
```

---

## Chunk 4: Demo

### Task 4: BOM Demo with `ConfiguredTable`

**Files:**
- Create: `src/demo/bom-engine-config.ts`
- Modify: `src/demo/demo-page.tsx` (add a new tab for the engine demo)

The demo uses mock data functions already in `src/utils/mock-data.ts` but serves them through a simulated API to prove the full engine pipeline works end-to-end.

- [ ] **Step 1: Create mock API handlers**

Create `src/demo/mock-engine-api.ts`:

```ts
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

export async function fetchBomData(): Promise<{ items: BomRow[] }> {
  await delay(600 + Math.random() * 400)
  return { items: BOM_DATA }
}

export async function fetchSuppliers(ids: string[]): Promise<{ suppliers: SupplierRow[] }> {
  await delay(300 + Math.random() * 200)
  const filtered = ids.length > 0
    ? SUPPLIERS.filter((s) => ids.includes(s.id))
    : SUPPLIERS
  return { suppliers: filtered }
}
```

- [ ] **Step 2: Create `src/demo/bom-engine-config.ts`**

```ts
import type { TableConfig } from "@/lib/table-engine/types"

/**
 * Demo BOM table config using the table engine.
 * Demonstrates:
 * - Two API sources with a dependency (suppliers depends on bom)
 * - JSONata transform ($.items extracts the items array)
 * - Dynamic supplier URL built from bom data
 * - Derived column (totalCost = quantity * unitPrice, computed before render)
 * - Secondary source join (supplierName joined from suppliers source)
 * - Tree mode with subRowsField
 * - Per-column feature overrides (orderable:false, filterable:false, visible:false)
 * - DepthRule editable (description only editable at depth >= 1 / leaf rows)
 */
export const bomEngineConfig: TableConfig = {
  id: "bom-engine-demo",
  mode: "tree",
  dataSources: [
    {
      id: "bom",
      url: "/api/demo/bom",
      transform: "$.items",
    },
    {
      id: "suppliers",
      // Build URL using unique supplier IDs from bom rows
      url: '"/api/demo/suppliers?ids=" & $join($distinct($sources.bom.supplierId), ",")',
      dependsOn: ["bom"],
      transform: "$.suppliers",
    },
  ],
  columns: [
    {
      field: "partNumber",
      header: "Part #",
      type: "string",
      pinned: "left",
      orderable: false,
      resizable: false,
      copyable: true,
      editable: false,
    },
    {
      field: "description",
      header: "Description",
      type: "string",
      width: 260,
      editable: { minDepth: 1 }, // leaf rows only
    },
    {
      field: "quantity",
      header: "Qty",
      type: "number",
      width: 80,
      editable: true,
      filterable: false,
    },
    {
      field: "unitPrice",
      header: "Unit Price",
      type: "number",
      meta: { format: "currency" },
      editable: true,
    },
    {
      field: "totalCost",
      header: "Total Cost",
      type: "number",
      meta: { format: "currency" },
      valueExpr: "$row.quantity * $row.unitPrice",
      editable: false,
      sortable: false,
      filterable: false,
    },
    {
      field: "supplierName",
      header: "Supplier",
      type: "string",
      dataSource: "suppliers",
      joinOn: { rowField: "supplierId", sourceKey: "id", sourceField: "name" },
      filterable: true,
      editable: false,
    },
    {
      field: "status",
      header: "Status",
      type: "select",
      meta: {
        options: [
          { value: "active", label: "Active" },
          { value: "draft", label: "Draft" },
          { value: "obsolete", label: "Obsolete" },
          { value: "review", label: "Review" },
        ],
      },
      editable: true,
    },
    {
      field: "isActive",
      header: "Active",
      type: "boolean",
      meta: { renderAs: "badge" },
      editable: true,
      width: 90,
    },
    {
      field: "internalCode",
      header: "Code",
      type: "code",
      visible: false, // hidden by default
      copyable: true,
      editable: false,
    },
    {
      field: "createdAt",
      header: "Created",
      type: "date",
      editable: false,
    },
  ],
  options: {
    subRowsField: "children",
  },
  features: {
    sorting: { enabled: true },
    filtering: { enabled: true, filterRow: true },
    editing: { enabled: true },
    selection: { enabled: true, mode: "multi" },
    columnPinning: { enabled: true },
    columnOrdering: { enabled: true },
    columnResizing: { enabled: true },
    columnVisibility: { enabled: true },
    loading: { enabled: true, skeletonRows: 6 },
  },
}
```

- [ ] **Step 3: Wire up mock API intercepts in the demo**

The mock API functions use real URLs, so we need to intercept them in the demo environment. Add a simple request interceptor at the app level using the existing patterns.

Create `src/demo/mock-api-interceptor.ts`:

```ts
import { fetchBomData, fetchSuppliers } from "./mock-engine-api"

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
      const idsParam = new URL(url, "http://localhost").searchParams.get("ids") ?? ""
      const ids = idsParam ? idsParam.split(",") : []
      const data = await fetchSuppliers(ids)
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
    }

    return originalFetch(input, init)
  }
}
```

- [ ] **Step 4: Install mock interceptor in `src/main.tsx`**

Open `src/main.tsx` and add the interceptor call before `createRoot`. Add only in dev mode:

```ts
if (import.meta.env.DEV) {
  const { installMockApiInterceptor } = await import("./demo/mock-api-interceptor")
  installMockApiInterceptor()
}
```

Or synchronously if dynamic import is not preferred:

```ts
import { installMockApiInterceptor } from "./demo/mock-api-interceptor"
if (import.meta.env.DEV) {
  installMockApiInterceptor()
}
```

- [ ] **Step 5: Add Engine Demo tab to `demo-page.tsx`**

Open `src/demo/demo-page.tsx`. Import and add a new tab for the engine demo. Find the existing `<Tabs>` / `<TabsList>` block and add:

```tsx
import { ConfiguredTable } from "@/lib/table-engine/configured-table"
import { bomEngineConfig } from "./bom-engine-config"

// In TabsList, add:
<TabsTrigger value="engine">Engine (Config)</TabsTrigger>

// In the tab contents, add:
<TabsContent value="engine" className="h-[600px]">
  <ConfiguredTable config={bomEngineConfig} />
</TabsContent>
```

- [ ] **Step 6: Start dev server and verify manually**

```bash
npm run dev
```

Open the demo in a browser. Navigate to the "Engine (Config)" tab. Verify:

- [ ] Loading skeleton appears initially
- [ ] BOM tree table loads with Part #, Description, Qty, Unit Price, Total Cost, Supplier, Status, Active, Created columns
- [ ] "Code" column is hidden (visible:false)
- [ ] "Total Cost" column shows `quantity * unitPrice` correctly
- [ ] "Supplier" column shows supplier names (joined from secondary API)
- [ ] Expand tree rows — children appear
- [ ] Description is NOT editable at root level (depth 0), IS editable at depth 1 (children)
- [ ] "Part #" column has no drag handle (orderable:false)
- [ ] Sorting works on sortable columns
- [ ] Filter row appears

- [ ] **Step 7: Final typecheck and build**

```bash
npx tsc --noEmit
npm run build
```

Expected: both pass with no errors.

- [ ] **Step 8: Run all tests**

```bash
npx vitest run
```

Expected: all engine unit tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/demo/bom-engine-config.ts src/demo/mock-engine-api.ts src/demo/mock-api-interceptor.ts src/demo/demo-page.tsx src/main.tsx
git commit -m "feat(table-engine): add BOM engine demo with tree mode, derived values, and supplier join"
```

- [ ] **Step 10: Final commit for the full engine**

```bash
git add -A
git commit -m "feat: complete table engine — config-driven DataGrid with DAG API chaining and JSONata transforms"
```

---

## Completion Criteria for Phase 14

- [ ] `validateConfig` catches all structural errors before any fetch
- [ ] `useTableEngine` runs DAG in TanStack Query (`useQuery` for flat/paginated, `useInfiniteData` for infinite)
- [ ] `useTableEngine` evaluates `valueExpr` async before building columns
- [ ] `useTableEngine` enriches rows with row-level source data
- [ ] `ConfiguredTable` strips engine-only feature keys before passing to `DataGrid`
- [ ] `ConfiguredTable` renders `DataGrid` with `initialColumnVisibility` from column builder
- [ ] `ConfiguredTable` renders shadcn `Alert` on error
- [ ] `ConfiguredTable` passes `getSubRows` derived from `options.subRowsField`
- [ ] Demo: BOM tree table loads with 2 API sources chained via DAG
- [ ] Demo: `totalCost` derived value renders correctly (quantity × unitPrice)
- [ ] Demo: supplier names joined from secondary source
- [ ] Demo: `internalCode` column hidden by default
- [ ] Demo: description not editable at root (depth 0), editable at depth ≥ 1
- [ ] Demo: `partNumber` has no drag handle
- [ ] `npx vitest run` — all tests pass
- [ ] `npm run build` — no type errors
