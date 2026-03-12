# Phase 13 — Column Builder

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `column-builder.ts` — the pure mapping layer that converts `ColumnConfig[]` into `GridColumnDef[]` by calling the correct existing column factory for each column type and applying all per-column feature flags, depth rules, join logic, and visibility settings.

**Architecture:** Pure function `buildColumns(columns, features, sourceMap)` — no React, no hooks, no side effects. All extensibility hooks (factory registry pattern) are defined here, making it trivial to add new column types in future. The function is fully unit-tested with real column factory outputs.

**Tech Stack:** TypeScript, existing column factories (`stringColumn`, `numberColumn`, etc.), existing types

**Depends on:** Phase 10 (types), Phase 11 (evaluateDepthRule)

**Spec:** `docs/superpowers/specs/2026-03-12-table-engine-design.md`

---

## Chunk 1: Column Builder

### Task 1: `src/lib/table-engine/column-builder.ts`

**Files:**

- Create: `src/lib/table-engine/column-builder.ts`

- [ ] **Step 1: Write `src/lib/table-engine/column-builder.ts`**

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

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/table-engine/column-builder.ts
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
- [ ] `npx tsc --noEmit` passes
