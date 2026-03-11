# Phase 13 — Column Builder

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `column-builder.ts` — the pure mapping layer that converts `ColumnConfig[]` into `GridColumnDef[]` by calling the correct existing column factory for each column type and applying all per-column feature flags, depth rules, join logic, and visibility settings.

**Architecture:** Pure function `buildColumns(columns, features, sourceMap)` — no React, no hooks, no side effects. All extensibility hooks (factory registry pattern) are defined here, making it trivial to add new column types in future. The function is fully unit-tested with real column factory outputs.

**Tech Stack:** TypeScript, existing column factories (`stringColumn`, `numberColumn`, etc.), existing types, Vitest

**Depends on:** Phase 10 (types), Phase 11 (evaluateDepthRule)

**Spec:** `docs/superpowers/specs/2026-03-12-table-engine-design.md`

---

## Chunk 1: Column Builder

### Task 1: `src/lib/table-engine/column-builder.ts`

**Files:**
- Create: `src/lib/table-engine/column-builder.ts`
- Create: `src/lib/table-engine/column-builder.test.ts`

- [ ] **Step 1: Write failing tests first**

Create `src/lib/table-engine/column-builder.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { buildColumns } from "./column-builder"
import type { ColumnConfig, TableFeaturesConfig } from "./types"

const baseFeatures: TableFeaturesConfig = {
  sorting: { enabled: true },
  filtering: { enabled: true },
  columnResizing: { enabled: true },
  columnOrdering: { enabled: true },
}

// ─── Factory selection ────────────────────────────────────────────────────────

describe("buildColumns — factory selection", () => {
  it("uses stringColumn for type 'string' (default)", () => {
    const { columns } = buildColumns(
      [{ field: "name", header: "Name", type: "string" }],
      baseFeatures,
      {}
    )
    expect(columns[0].meta?.type).toBe("string")
    expect(columns[0].accessorKey ?? (columns[0] as { accessorKey?: string }).accessorKey).toBe("name")
  })

  it("uses numberColumn for type 'number'", () => {
    const { columns } = buildColumns(
      [{ field: "qty", header: "Qty", type: "number" }],
      baseFeatures,
      {}
    )
    expect(columns[0].meta?.type).toBe("number")
  })

  it("uses dateColumn for type 'date'", () => {
    const { columns } = buildColumns(
      [{ field: "createdAt", header: "Created", type: "date" }],
      baseFeatures,
      {}
    )
    expect(columns[0].meta?.type).toBe("date")
  })

  it("uses booleanColumn for type 'boolean'", () => {
    const { columns } = buildColumns(
      [{ field: "active", header: "Active", type: "boolean" }],
      baseFeatures,
      {}
    )
    expect(columns[0].meta?.type).toBe("boolean")
  })

  it("uses codeColumn for type 'code'", () => {
    const { columns } = buildColumns(
      [{ field: "snippet", header: "Code", type: "code" }],
      baseFeatures,
      {}
    )
    expect(columns[0].meta?.type).toBe("code")
  })

  it("defaults to stringColumn when type is undefined", () => {
    const { columns } = buildColumns(
      [{ field: "notes", header: "Notes" }],
      baseFeatures,
      {}
    )
    expect(columns[0].meta?.type).toBe("string")
  })
})

// ─── Visibility ───────────────────────────────────────────────────────────────

describe("buildColumns — visibility", () => {
  it("columns with visible:false go into initialColumnVisibility as false", () => {
    const { columns, initialColumnVisibility } = buildColumns(
      [
        { field: "name", header: "Name", visible: true },
        { field: "secret", header: "Secret", visible: false },
      ],
      baseFeatures,
      {}
    )
    expect(initialColumnVisibility).toEqual({ secret: false })
    expect(columns).toHaveLength(2)
  })

  it("visible:true does not add to initialColumnVisibility", () => {
    const { initialColumnVisibility } = buildColumns(
      [{ field: "name", header: "Name", visible: true }],
      baseFeatures,
      {}
    )
    expect(initialColumnVisibility).toEqual({})
  })

  it("undefined visible does not add to initialColumnVisibility", () => {
    const { initialColumnVisibility } = buildColumns(
      [{ field: "name", header: "Name" }],
      baseFeatures,
      {}
    )
    expect(initialColumnVisibility).toEqual({})
  })
})

// ─── Per-column feature flags ─────────────────────────────────────────────────

describe("buildColumns — feature flags", () => {
  it("sortable:false sets enableSorting:false on the column def", () => {
    const { columns } = buildColumns(
      [{ field: "name", header: "Name", sortable: false }],
      baseFeatures,
      {}
    )
    expect(columns[0].enableSorting).toBe(false)
  })

  it("filterable:false sets enableColumnFilter:false", () => {
    const { columns } = buildColumns(
      [{ field: "name", header: "Name", filterable: false }],
      baseFeatures,
      {}
    )
    expect(columns[0].enableColumnFilter).toBe(false)
  })

  it("resizable:false sets enableResizing:false", () => {
    const { columns } = buildColumns(
      [{ field: "name", header: "Name", resizable: false }],
      baseFeatures,
      {}
    )
    expect(columns[0].enableResizing).toBe(false)
  })

  it("orderable:false stores meta.orderable = false", () => {
    const { columns } = buildColumns(
      [{ field: "id", header: "ID", orderable: false }],
      baseFeatures,
      {}
    )
    expect((columns[0].meta as Record<string, unknown>)?.orderable).toBe(false)
  })

  it("copyable:true passes through to meta", () => {
    const { columns } = buildColumns(
      [{ field: "code", header: "Code", type: "string", copyable: true }],
      baseFeatures,
      {}
    )
    expect(columns[0].meta?.copyable).toBe(true)
  })

  it("editable:true passes through to meta", () => {
    const { columns } = buildColumns(
      [{ field: "name", header: "Name", editable: true }],
      baseFeatures,
      {}
    )
    expect(columns[0].meta?.editable).toBe(true)
  })
})

// ─── DepthRule ────────────────────────────────────────────────────────────────

describe("buildColumns — DepthRule editable", () => {
  it("DepthRule stores editableFn on meta and sets editable:false", () => {
    const { columns } = buildColumns(
      [{ field: "desc", header: "Desc", editable: { minDepth: 1 } }],
      baseFeatures,
      {}
    )
    const meta = columns[0].meta as Record<string, unknown>
    expect(meta.editable).toBe(false)
    expect(typeof meta.editableFn).toBe("function")
  })

  it("editableFn correctly evaluates minDepth rule", () => {
    const { columns } = buildColumns(
      [{ field: "desc", header: "Desc", editable: { minDepth: 2 } }],
      baseFeatures,
      {}
    )
    const meta = columns[0].meta as Record<string, unknown>
    const fn = meta.editableFn as (row: unknown, depth: number) => boolean
    expect(fn({}, 1)).toBe(false)
    expect(fn({}, 2)).toBe(true)
    expect(fn({}, 3)).toBe(true)
  })

  it("editableFn correctly evaluates depths rule", () => {
    const { columns } = buildColumns(
      [{ field: "desc", header: "Desc", editable: { depths: [0, 2] } }],
      baseFeatures,
      {}
    )
    const meta = columns[0].meta as Record<string, unknown>
    const fn = meta.editableFn as (row: unknown, depth: number) => boolean
    expect(fn({}, 0)).toBe(true)
    expect(fn({}, 1)).toBe(false)
    expect(fn({}, 2)).toBe(true)
  })
})

// ─── Width / size ─────────────────────────────────────────────────────────────

describe("buildColumns — width", () => {
  it("passes width as size to the factory", () => {
    const { columns } = buildColumns(
      [{ field: "name", header: "Name", width: 350 }],
      baseFeatures,
      {}
    )
    expect(columns[0].size).toBe(350)
  })

  it("passes minWidth as minSize", () => {
    const { columns } = buildColumns(
      [{ field: "name", header: "Name", minWidth: 60 }],
      baseFeatures,
      {}
    )
    expect(columns[0].minSize).toBe(60)
  })
})

// ─── Secondary source join (accessorFn) ───────────────────────────────────────
// joinOn shape: { rowField (FK on row), sourceKey (PK on source for matching), sourceField (value to display) }

describe("buildColumns — dataSource + joinOn", () => {
  it("accessorFn returns joined display value from sourceMap", () => {
    const sourceMap = {
      suppliers: [
        { id: "s1", name: "Acme" },
        { id: "s2", name: "Globex" },
      ],
    }

    const { columns } = buildColumns(
      [
        {
          field: "supplierName",
          header: "Supplier",
          type: "string",
          dataSource: "suppliers",
          // rowField: FK on row | sourceKey: PK on source record | sourceField: value to display
          joinOn: { rowField: "supplierId", sourceKey: "id", sourceField: "name" },
        },
      ],
      baseFeatures,
      sourceMap
    )

    const col = columns[0]
    // accessorFn is set (not accessorKey) for joined columns
    expect(typeof col.accessorFn).toBe("function")

    // row.supplierId = "s2" → find supplier where id = "s2" → return supplier.name = "Globex"
    const row = { id: "r1", supplierId: "s2" }
    const value = (col.accessorFn as (row: unknown) => unknown)(row)
    expect(value).toBe("Globex")
  })

  it("accessorFn returns null when no matching source record", () => {
    const sourceMap = { suppliers: [{ id: "s1", name: "Acme" }] }

    const { columns } = buildColumns(
      [
        {
          field: "supplierName",
          header: "Supplier",
          dataSource: "suppliers",
          joinOn: { rowField: "supplierId", sourceKey: "id", sourceField: "name" },
        },
      ],
      baseFeatures,
      sourceMap
    )

    const row = { id: "r1", supplierId: "unknown" }
    const value = (columns[0].accessorFn as (row: unknown) => unknown)(row)
    expect(value).toBeNull()
  })

  it("accessorFn returns null when sourceMap has no entry for the source", () => {
    const { columns } = buildColumns(
      [
        {
          field: "supplierName",
          header: "Supplier",
          dataSource: "suppliers",
          joinOn: { rowField: "supplierId", sourceKey: "id", sourceField: "name" },
        },
      ],
      baseFeatures,
      {} // empty sourceMap
    )

    const value = (columns[0].accessorFn as (row: unknown) => unknown)({ supplierId: "s1" })
    expect(value).toBeNull()
  })
})

// ─── valueExpr columns ────────────────────────────────────────────────────────

describe("buildColumns — valueExpr", () => {
  it("valueExpr column uses accessorKey pointing to pre-computed field", () => {
    // valueExpr columns don't use accessorFn — the engine pre-populates row[field]
    // so the column just reads it via accessorKey
    const { columns } = buildColumns(
      [{ field: "totalCost", header: "Total", type: "number", valueExpr: "$row.qty * $row.price" }],
      baseFeatures,
      {}
    )
    // Should have accessorKey set to the field name (engine pre-populates the value)
    const col = columns[0] as { accessorKey?: string }
    expect(col.accessorKey).toBe("totalCost")
  })
})

// ─── Meta pass-through ────────────────────────────────────────────────────────

describe("buildColumns — meta pass-through", () => {
  it("merges extra meta fields onto the column", () => {
    const { columns } = buildColumns(
      [
        {
          field: "price",
          header: "Price",
          type: "number",
          meta: { format: "currency", currency: "USD" },
        },
      ],
      baseFeatures,
      {}
    )
    expect(columns[0].meta?.format).toBe("currency")
    expect(columns[0].meta?.currency).toBe("USD")
  })
})

// ─── Multiple columns ─────────────────────────────────────────────────────────

describe("buildColumns — multiple columns", () => {
  it("builds all columns preserving order", () => {
    const configs: ColumnConfig[] = [
      { field: "a", header: "A", type: "string" },
      { field: "b", header: "B", type: "number" },
      { field: "c", header: "C", type: "date" },
    ]
    const { columns } = buildColumns(configs, baseFeatures, {})
    expect(columns).toHaveLength(3)
    expect(columns[0].meta?.type).toBe("string")
    expect(columns[1].meta?.type).toBe("number")
    expect(columns[2].meta?.type).toBe("date")
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/lib/table-engine/column-builder.test.ts
```

Expected: module not found.

- [ ] **Step 3: Write `src/lib/table-engine/column-builder.ts`**

```ts
import { booleanColumn } from "@/columns/boolean-column"
import { codeColumn } from "@/columns/code-column"
import { dateColumn } from "@/columns/date-column"
import { multiValueColumn } from "@/columns/multi-value-column"
import { numberColumn } from "@/columns/number-column"
import { selectColumn } from "@/columns/select-column"
import { stringColumn } from "@/columns/string-column"
import type { GridColumnDef } from "@/types/column-types"
import type { GridRow } from "@/types/grid-types"
import { evaluateDepthRule } from "./jsonata-evaluator"
import type {
  ColumnBuildResult,
  ColumnConfig,
  DepthRule,
  SourceMap,
  TableColumnMeta,
  TableFeaturesConfig,
} from "./types"

// ─── Factory Registry ─────────────────────────────────────────────────────────
//
// To add a new column type, add an entry here.
// The factory function signature matches the existing column factory interface.
// Each factory accepts { accessorKey, header, ...rest } and returns GridColumnDef.

type FactoryOptions = {
  accessorKey: string
  header: string
  editable?: boolean
  copyable?: boolean
  width?: number
  minWidth?: number
  maxWidth?: number
  meta?: Record<string, unknown>
  [key: string]: unknown
}

type ColumnFactory = (options: FactoryOptions) => GridColumnDef

const FACTORY_REGISTRY: Record<string, ColumnFactory> = {
  string: stringColumn as ColumnFactory,
  number: numberColumn as ColumnFactory,
  date: dateColumn as ColumnFactory,
  "multi-value": multiValueColumn as ColumnFactory,
  select: selectColumn as ColumnFactory,
  boolean: booleanColumn as ColumnFactory,
  code: codeColumn as ColumnFactory,
}

function getFactory(type: string | undefined): ColumnFactory {
  return FACTORY_REGISTRY[type ?? "string"] ?? FACTORY_REGISTRY["string"]
}

// ─── Depth Rule Resolver ──────────────────────────────────────────────────────

function buildEditableFn(
  rule: DepthRule
): (row: GridRow, depth: number) => boolean {
  return (_row, depth) => evaluateDepthRule(rule, depth)
}

// ─── Secondary Source Join ────────────────────────────────────────────────────

/**
 * Build an index map from sourceKey value → source record for O(1) joins.
 * sourceKey is the PK field on the source record (e.g. "id").
 * sourceData is expected to be an array after transform is applied.
 */
function buildJoinIndex(
  sourceData: unknown,
  sourceKey: string
): Map<unknown, Record<string, unknown>> {
  if (!Array.isArray(sourceData)) return new Map()
  const index = new Map<unknown, Record<string, unknown>>()
  for (const record of sourceData) {
    if (record && typeof record === "object") {
      const key = (record as Record<string, unknown>)[sourceKey]
      index.set(key, record as Record<string, unknown>)
    }
  }
  return index
}

// ─── Main Build Function ──────────────────────────────────────────────────────

/**
 * Convert ColumnConfig[] into GridColumnDef[] using the existing column factories.
 *
 * Extensibility:
 * - Add a new ColumnType: register a factory in FACTORY_REGISTRY above.
 * - Add a new per-column flag: add the mapping in the flag application section below.
 *
 * @param columns - The ColumnConfig array from TableConfig.
 * @param features - TableFeaturesConfig for reading global enable/disable defaults.
 * @param sourceMap - The resolved SourceMap (from DAG executor) for join columns.
 * @returns columns (GridColumnDef[]) and initialColumnVisibility (hidden columns map).
 */
export function buildColumns<TData extends GridRow>(
  columns: ColumnConfig[],
  features: TableFeaturesConfig | undefined,
  sourceMap: SourceMap
): ColumnBuildResult<TData> {
  const initialColumnVisibility: Record<string, boolean> = {}
  const builtColumns: GridColumnDef<TData>[] = []

  // Global feature defaults (columns inherit these unless overridden per-column)
  const globalSortingEnabled = features?.sorting?.enabled ?? true
  const globalFilteringEnabled = features?.filtering?.enabled ?? true
  const globalResizingEnabled = features?.columnResizing?.enabled ?? true

  for (const colConfig of columns) {
    const {
      field,
      header,
      type,
      visible,
      width,
      minWidth,
      maxWidth,
      sortable,
      filterable,
      resizable,
      orderable,
      editable,
      copyable,
      dataSource,
      joinOn,
      valueExpr,
      meta: extraMeta,
      pinned,
    } = colConfig

    // ── Visibility ──────────────────────────────────────────────────────────
    if (visible === false) {
      initialColumnVisibility[field] = false
    }

    // ── Editable / DepthRule ────────────────────────────────────────────────
    let resolvedEditable: boolean = false
    let editableFn: TableColumnMeta["editableFn"] | undefined

    if (typeof editable === "boolean") {
      resolvedEditable = editable
    } else if (editable !== undefined) {
      // DepthRule: store resolver function; set editable:false as baseline
      resolvedEditable = false
      editableFn = buildEditableFn(editable)
    }

    // ── Build meta ──────────────────────────────────────────────────────────
    const meta: TableColumnMeta = {
      ...(extraMeta as Partial<TableColumnMeta>),
      editable: resolvedEditable,
      ...(editableFn ? { editableFn } : {}),
      ...(copyable !== undefined ? { copyable } : {}),
      ...(orderable === false ? { orderable: false } : {}),
      ...(pinned ? { pinned } : {}),
    }

    // ── Select factory and build base column def ────────────────────────────
    const factory = getFactory(type)
    const factoryOptions: FactoryOptions = {
      accessorKey: field,
      header,
      editable: resolvedEditable,
      copyable: copyable ?? false,
      ...(width ? { width } : {}),
      ...(minWidth ? { minWidth } : {}),
      ...(maxWidth ? { maxWidth } : {}),
      meta,
      ...(type === "select" && extraMeta?.options
        ? { options: extraMeta.options }
        : {}),
    }

    let colDef = factory(factoryOptions) as GridColumnDef<TData>

    // ── Apply per-column feature flag overrides ─────────────────────────────
    // These override TanStack Table's column-level flags.
    // Factories spread ...rest so we can also pass them there, but we apply
    // them explicitly post-factory to be clear about the override.

    if (sortable === false || (sortable === undefined && !globalSortingEnabled)) {
      colDef = { ...colDef, enableSorting: false }
    } else if (sortable === true) {
      colDef = { ...colDef, enableSorting: true }
    }

    if (filterable === false || (filterable === undefined && !globalFilteringEnabled)) {
      colDef = { ...colDef, enableColumnFilter: false }
    } else if (filterable === true) {
      colDef = { ...colDef, enableColumnFilter: true }
    }

    if (resizable === false || (resizable === undefined && !globalResizingEnabled)) {
      colDef = { ...colDef, enableResizing: false }
    } else if (resizable === true) {
      colDef = { ...colDef, enableResizing: true }
    }

    // ── Secondary source join (accessorFn) ─────────────────────────────────
    // joinOn.sourceKey = PK field on source for matching (builds index)
    // joinOn.sourceField = value field on matched source record to return
    if (dataSource && joinOn) {
      const rawSourceData = sourceMap[dataSource]
      // Index by sourceKey (the PK on the source record, e.g. "id")
      const joinIndex = buildJoinIndex(rawSourceData, joinOn.sourceKey)

      // Destructure to remove accessorKey so TanStack Table treats this as an id+accessorFn column
      const { accessorKey: _removed, ...colDefWithoutKey } = colDef as typeof colDef & { accessorKey?: string }
      colDef = {
        ...colDefWithoutKey,
        id: field,
        accessorFn: (row: TData) => {
          // Look up source record by row FK value
          const fkValue = (row as Record<string, unknown>)[joinOn.rowField]
          const record = joinIndex.get(fkValue)
          // Return the display value field (e.g. "name")
          return record ? (record[joinOn.sourceField] ?? null) : null
        },
      } as GridColumnDef<TData>
    }

    // ── valueExpr: use plain accessorKey (engine pre-populates row[field]) ──
    // No special handling needed — the factory already set accessorKey = field.
    // The engine writes the derived value to row[field] before TanStack Table sees it.

    builtColumns.push(colDef)
  }

  return { columns: builtColumns, initialColumnVisibility }
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/lib/table-engine/column-builder.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Run all engine tests**

```bash
npx vitest run src/lib/table-engine/
```

Expected: all tests across all modules pass.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/table-engine/column-builder.ts src/lib/table-engine/column-builder.test.ts
git commit -m "feat(table-engine): add column builder with factory registry, depth rules, and join support"
```

---

## Completion Criteria for Phase 13

- [ ] `buildColumns` selects the correct factory for each `ColumnType` (all 7 types tested)
- [ ] Defaults to `stringColumn` when `type` is undefined
- [ ] `visible: false` columns appear in `initialColumnVisibility` as `{ field: false }`
- [ ] `sortable/filterable/resizable: false` set corresponding TanStack flags to `false`
- [ ] `orderable: false` stored as `meta.orderable = false`
- [ ] `editable: boolean` passes through to `meta.editable`
- [ ] `editable: DepthRule` produces `meta.editableFn` and sets `meta.editable = false`
- [ ] `editableFn` correctly evaluates all three DepthRule variants
- [ ] `dataSource + joinOn` produces `accessorFn` that joins via O(1) index lookup
- [ ] `accessorFn` returns `null` gracefully when record not found or sourceMap empty
- [ ] `valueExpr` columns keep `accessorKey` set to `field` (engine pre-populates value)
- [ ] Extra `meta` fields pass through correctly (format, currency, etc.)
- [ ] All tests pass: `npx vitest run src/lib/table-engine/`
- [ ] `npx tsc --noEmit` passes
