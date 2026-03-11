# Table Engine — Design Spec

**Date:** 2026-03-12
**Status:** Approved
**Phase:** 10 (post Phase 9)

---

## Overview

A declarative, config-driven table engine that sits on top of the existing `DataGrid` component. Developers define a single `TableConfig` object (JSON-serializable TypeScript) to produce a fully-featured grid with multi-source API fetching, JSONata data transforms, DAG-based API dependency resolution, and per-column feature control — with zero changes to the existing grid rendering logic.

---

## Goals

- Developers create tables by writing a config object, not wiring up hooks manually.
- Support all existing `DataGrid` modes: `flat`, `paginated`, `infinite`, `tree`.
- Support mixed parallel + sequential API chains via a DAG resolver.
- Use JSONata for response transforms, derived column values, and dynamic URL/param construction.
- All per-column feature toggles (visibility, sorting, filtering, editing, resizing, ordering, pinning) controllable from config.
- Maximally reuse existing types, column factories, hooks, and the `DataGrid` component.
- Use TanStack Query for caching, background refetch, and pagination/infinite strategies.
- Use shadcn components for error states within the engine layer.

## Non-Goals

- No runtime UI config builder — configs are developer-authored TypeScript files.
- No sandboxing of JSONata expressions — configs are trusted developer code.
- No changes to grid rendering components (`DataGrid`, `DataGridRow`, `DataGridCell`, etc.) or existing feature hooks.
- The one minimal extension is adding `initialColumnVisibility` to `DataGridProps` to support `visible: false` columns — this is a data prop, not a rendering change.

---

## Module Location

```
src/lib/table-engine/
├── types.ts                # All config + runtime TypeScript types
├── dag-resolver.ts         # Topological sort + parallel wave executor
├── jsonata-evaluator.ts    # JSONata wrapper with context binding
├── api-executor.ts         # Fetch runner (retry, abort, deduplication)
├── column-builder.ts       # Maps ColumnConfig[] → GridColumnDef[]
├── use-table-engine.ts     # React hook — orchestrates DAG + query + column build
└── configured-table.tsx    # <ConfiguredTable config={...} /> component
```

No barrel `index.ts`. Consumers import directly per project convention.

---

## Config Schema

### `TableConfig`

```ts
import type { GridMode, GridFeaturesConfig } from "@/types/grid-types"
import type { ColumnType, ColumnMeta } from "@/types/column-types"

interface TableConfig {
  id: string
  mode: GridMode                        // 'flat' | 'paginated' | 'infinite' | 'tree'
  dataSources: DataSourceConfig[]
  columns: ColumnConfig[]
  features?: TableFeaturesConfig        // superset of GridFeaturesConfig
  options?: {
    pageSize?: number
    rowHeight?: number
    subRowsField?: string               // field name on row containing children (tree mode); plain string, not JSONata
  }
}
```

### `DataSourceConfig`

```ts
interface DataSourceConfig {
  id: string
  url: string                           // plain URL or JSONata expression using $sources.<id>
  method?: "GET" | "POST"              // default: GET
  headers?: Record<string, string>
  params?: Record<string, string>       // values can be JSONata expressions
  body?: Record<string, unknown>        // can reference $sources.<id> via JSONata
  dependsOn?: string[]                  // other DataSourceConfig ids — drives the DAG
  transform?: string                    // JSONata: shape response → rows[]
  rowLevel?: boolean                    // if true: called once per unique cacheKey value
  cacheKey?: string                     // JSONata on row: string value used to deduplicate row-level calls
  retryOnNetworkError?: boolean         // default: true (1 retry)
}
```

### `ColumnConfig`

```ts
interface ColumnConfig {
  field: string                         // maps to accessorKey on GridColumnDef
  header: string

  // Type — maps to existing ColumnType, drives factory selection in column-builder
  type?: ColumnType                     // 'string'|'number'|'date'|'select'|'multi-value'|'boolean'|'code'|'custom'

  // Visibility & Layout
  visible?: boolean                     // default: true; false = hidden in initial columnVisibility state
  width?: number
  minWidth?: number
  maxWidth?: number
  pinned?: "left" | "right" | false

  // Per-column feature toggles
  // Each maps to the corresponding TanStack Table column-level flag via factory ...rest spread
  sortable?: boolean                    // → enableSorting; default: inherits features.sorting.enabled
  filterable?: boolean                  // → enableColumnFilter; default: inherits features.filtering.enabled
  resizable?: boolean                   // → enableResizing; default: inherits features.columnResizing.enabled
  orderable?: boolean                   // default: true; false = column excluded from DnD ordering UI
  copyable?: boolean

  // Editing control — supports tree-depth rules
  // Stored in TableColumnMeta.editableFn for runtime evaluation (see Types section)
  editable?: boolean | DepthRule

  // Data binding from secondary sources
  dataSource?: string                   // id of a DataSourceConfig
  joinOn?: {
    rowField: string                    // field on the primary row
    sourceField: string                 // field on secondary source record
  }

  // Derived value — evaluated by the engine during data resolution (before TanStack Table renders)
  // Result is stored directly on the row object at key `field`, so accessorKey reads a plain value
  valueExpr?: string                    // JSONata; context: $row = current row object

  // Direct meta pass-through to existing ColumnMeta
  meta?: Partial<ColumnMeta>
}

// Tree-mode depth control for editable
type DepthRule =
  | { depths: number[] }               // editable only at these exact depths
  | { minDepth: number }               // editable at depth >= minDepth
  | { maxDepth: number }               // editable at depth <= maxDepth
```

### `TableFeaturesConfig`

Extends `GridFeaturesConfig` with three new engine-only toggles not present in the existing type. These fields are consumed exclusively by the engine (`column-builder.ts` reads them to set per-column flags); they are **stripped before forwarding `features` to `DataGrid`** because `useDataGrid` does not read them and they must not cause unknown-prop issues.

```ts
// GridFeaturesConfig already includes: sorting, filtering, editing, selection,
// pagination, virtualization, grouping, loading, columnPinning, rowPinning, addRow.
// The following three are NEW and engine-only — stripped before passing to DataGrid:
interface TableFeaturesConfig extends GridFeaturesConfig {
  columnOrdering?: { enabled?: boolean }   // NEW: global DnD column reorder toggle
  columnResizing?: { enabled?: boolean }   // NEW: global column resize toggle
  columnVisibility?: { enabled?: boolean } // NEW: show/hide columns via toolbar
}
```

`ConfiguredTable` destructures the engine-only keys out before spreading `features` onto `DataGrid`:
```ts
const { columnOrdering, columnResizing, columnVisibility, ...gridFeatures } = config.features ?? {}
// gridFeatures is passed to DataGrid; engine keys consumed by column-builder only
```

### `TableColumnMeta`

Extends `ColumnMeta` to carry the runtime editability function used by `DepthRule`. This is engine-internal and not exposed to the `DataGrid` as a raw function — it is resolved to a boolean at render time by the engine's editing wrapper.

```ts
// Defined in src/lib/table-engine/types.ts
interface TableColumnMeta extends ColumnMeta {
  editableFn?: (row: GridRow, depth: number) => boolean
}
```

When `editable` is a `DepthRule`, `column-builder.ts` stores a resolver function in `meta.editableFn` and sets `meta.editable = false` (the base flag). The engine's column builder wraps the column's `cell` render (or uses the existing `renderEditor` meta slot) to check `editableFn` at render time using the row's depth from TanStack Table's `row.depth`.

---

## Architecture

### DAG Resolver (`dag-resolver.ts`)

- Accepts `DataSourceConfig[]`.
- Builds an adjacency list from `dependsOn` arrays.
- Detects circular dependencies **at hook-mount time** (before any fetch) using depth-first search; throws a descriptive `ConfigError` with the cycle path.
- Topologically sorts using **Kahn's algorithm** into ordered waves.
- Executor runs each wave with `Promise.all` (parallel within wave, sequential across waves).
- Each source receives a `$sources` context map of all previously resolved source data, available in JSONata URL/param/body expressions as `$sources.<id>`.

```
Wave 0: [bom, inventory]           → parallel fetch, no deps
Wave 1: [suppliers, pricing]       → parallel fetch, each receives $sources.bom + $sources.inventory
Wave 2: [enriched-bom]             → receives all prior $sources
```

Returns `Record<string, unknown>` — a map of `sourceId → transformed response data`.

### JSONata Evaluator (`jsonata-evaluator.ts`)

Thin wrapper around the `jsonata` npm package. Three evaluation modes:

| Mode | Context variables | Used for |
|---|---|---|
| `source` | `$sources` = map of all resolved source data | url, params, body, transform |
| `row` | `$row` = current row object | valueExpr derived columns |
| `depth` | `$row`, `$depth` = tree node depth | DepthRule editableFn |

**Important — async evaluation:** `jsonata`'s `expression.evaluate()` returns a `Promise`. All evaluation calls are therefore `async`. This is handled as follows:

- **`transform` and `url`/`params`/`body`** — evaluated inside the DAG executor's async wave loop. No sync constraint.
- **`valueExpr` derived columns** — evaluated during the data resolution phase inside `useTableEngine`, **before** constructing column defs. Results are stored directly on each row object at the column's `field` key. By the time TanStack Table calls `accessorKey`, it reads a plain pre-computed value — no async in `accessorFn`.
- **`editableFn`** — `DepthRule` is a pure boolean check (no JSONata); evaluated synchronously at render time.

Errors include the expression string and bound context for easy debugging.

### API Executor (`api-executor.ts`)

Plain `fetch` wrapper — no additional dependencies:

- Configurable per-source headers.
- 1 automatic retry on network errors for sources where `retryOnNetworkError !== false` (not retried on 4xx/5xx).
- `AbortController` signal passed through — React cleanup cancels in-flight requests.
- Returns `{ data: unknown; error: Error | null }` — never throws.
- Row-level source deduplication: calls with the same `cacheKey` value share one in-flight promise via a `Map<string, Promise>` keyed on the evaluated `cacheKey`. The map is scoped to a single engine invocation (cleared on refetch).
- Row-level source failures: the affected column value is set to `null` on the row; the error is collected and surfaced via `TableEngineResult.rowSourceErrors` (see Hook section). Other columns/rows are unaffected.

### Column Builder (`column-builder.ts`)

Maps `ColumnConfig[]` → `GridColumnDef[]`:

1. Selects the correct existing factory (`stringColumn`, `numberColumn`, `dateColumn`, `selectColumn`, `multiValueColumn`, `booleanColumn`, `codeColumn`) based on `type`.
2. Merges `ColumnConfig` fields into factory options. All existing factories accept `...rest` which spreads onto the returned `GridColumnDef`, so `enableSorting`, `enableColumnFilter`, `enableResizing` are passed through the factory call.
3. `orderable: false` — stored in `meta` as a custom flag (`meta.orderable = false`). The DataGridHeader's column drag handle reads this flag to suppress the drag affordance for locked columns. No TanStack Table API needed.
4. `visible: false` — the builder collects all hidden column `field` values into an `initialColumnVisibility` map `{ [field]: false }` returned alongside the column defs. `ConfiguredTable` passes this to `DataGrid` via the new `initialColumnVisibility` prop.
5. `valueExpr` columns — `accessorKey` is set to `field`. The engine pre-populates `row[field]` with the derived value during data resolution, so `accessorKey` reads a plain value.
6. `dataSource` + `joinOn` — the column's `accessorFn` performs a lookup into the secondary source results map (passed as a closure from the hook): `row => sourceMap[row[joinOn.rowField]]?.[joinOn.sourceField] ?? null`.
7. `DepthRule` for `editable` — `meta.editable = false`; `meta.editableFn = (row, depth) => boolean` resolver stored as `TableColumnMeta`. The engine's editing integration checks `editableFn` when present before delegating to the grid's normal edit path.

### `DataGrid` Extension — `initialColumnVisibility` prop

Two minimal, non-breaking additions to wire initial column visibility from config:

**1. `src/components/data-grid/data-grid.tsx` — `DataGridProps`:**
```ts
initialColumnVisibility?: Record<string, boolean>
```

**2. `src/hooks/use-data-grid.ts` — `DataGridConfig`** (the hook's own props interface, distinct from `DataGridProps`):
```ts
initialColumnVisibility?: Record<string, boolean>
```

Inside `useDataGrid`, the existing `columnVisibility` state initializer (currently `{}`) changes to:
```ts
const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
  initialColumnVisibility ?? {}
)
```

`DataGrid` passes the prop through to `useDataGrid` as part of its config spread. These are the only two changes to existing files.

### `useTableEngine` Hook (`use-table-engine.ts`)

```ts
function useTableEngine<TData extends GridRow>(
  config: TableConfig
): TableEngineResult<TData>

interface TableEngineResult<TData extends GridRow> {
  data: TData[]
  columns: GridColumnDef<TData>[]
  initialColumnVisibility: Record<string, boolean>  // from column-builder
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
  rowSourceErrors: Array<{ sourceId: string; cacheKey: string; error: Error }>
  // Forwarded for infinite mode — matches useInfiniteData return shape
  fetchNextPage?: () => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  total?: number
}
```

Internally:

1. **Config validation** — at hook-mount time: detects circular deps, unknown `dataSource` column refs, missing required fields. Throws `ConfigError` with a descriptive message before any fetch.
2. **DAG execution** — the full DAG resolution (all waves) is a single async function `resolveAllSources(config, signal)`. This function is used as the `queryFn` for TanStack Query:
   - `flat` / `paginated` modes → `useQuery` with `placeholderData: keepPreviousData` (TanStack Query v5 pattern). `isError` and `error` come directly from `useQuery`'s return.
   - `infinite` mode → the existing `useInfiniteData` hook is reused. The `queryFn` passed to `useInfiniteData` runs the DAG resolution with the page param injected into the primary source's params via `$pageParam` JSONata context variable. Since `useInfiniteData` does not expose `isError`/`error`, `useTableEngine` also calls `useInfiniteQuery` internally with the same query key to read error state only — no duplicate network request since TanStack Query deduplicates by key. Alternatively, if the implementation complexity is undesirable, `useInfiniteData` can be lightly extended to return `isError` and `error` from its internal `useInfiniteQuery` call — this is the preferred path as it avoids a redundant hook call.
3. **Derived value computation** — after primary DAG resolves, iterate all rows and evaluate `valueExpr` expressions asynchronously (in parallel per `Promise.all`); results written onto row objects in-place.
4. **Row-level sources** — after primary rows are ready, collect unique `cacheKey` values per row-level source, execute batched fetches with deduplication, merge results into rows via `joinOn`.
5. **Row merging** — secondary source data joined into rows using `joinOn` field mapping via `accessorFn` closures (not mutation — rows stay immutable).
6. **Column build** — `useMemo` on `config.columns` + resolved secondary source map → `GridColumnDef[]` + `initialColumnVisibility`.
7. **Sort/filter refetch** — query key includes sort and filter state, so server-mode changes trigger automatic refetch.

### `ConfiguredTable` Component (`configured-table.tsx`)

```tsx
interface ConfiguredTableProps {
  config: TableConfig
  className?: string
}

function ConfiguredTable({ config, className }: ConfiguredTableProps) {
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
    total,
  } = useTableEngine(config)

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Failed to load table</AlertTitle>
        <AlertDescription>{error?.message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <DataGrid
      data={data}
      columns={columns}
      mode={config.mode}
      features={config.features}
      isLoading={isLoading}
      initialColumnVisibility={initialColumnVisibility}
      getSubRows={
        config.options?.subRowsField
          ? (row) => (row as GridRow)[config.options!.subRowsField!] as GridRow[] | undefined
          : undefined
      }
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      className={className}
    />
  )
}
```

Props forwarded explicitly (not spread) to avoid passing unknown props to `DataGrid`. Shadcn `Alert` used for error state — no loading state component needed as `DataGrid`'s existing skeleton handles it via `isLoading`.

---

## Reuse Summary

| Existing artifact | Reused as-is |
|---|---|
| `GridRow`, `GridColumnDef`, `ColumnMeta`, `ColumnType` | Imported directly; `TableColumnMeta` extends `ColumnMeta` |
| `GridFeaturesConfig`, `GridMode` | `TableFeaturesConfig extends GridFeaturesConfig` |
| `stringColumn`, `numberColumn`, `dateColumn`, etc. | Called inside `column-builder.ts` |
| `DataGrid` component | Rendered by `ConfiguredTable`; one new optional prop added |
| `useInfiniteData` hook | Reused for infinite mode |
| TanStack Query `useQuery` / `keepPreviousData` | v5 pattern: `placeholderData: keepPreviousData` |
| Shadcn `Alert`, `AlertTitle`, `AlertDescription` | Error state in `ConfiguredTable` |

---

## Example Config

```ts
// src/demo/bom-table-config.ts

const bomConfig: TableConfig = {
  id: "bom-table",
  mode: "tree",
  dataSources: [
    {
      id: "bom",
      url: "/api/bom",
      transform: "$.items",
    },
    {
      id: "suppliers",
      // $sources.bom is the transformed bom array; build URL using bom supplier IDs
      url: "\"/api/suppliers?ids=\" & $join($distinct($sources.bom.supplierId), \",\")",
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
    },
    {
      field: "description",
      header: "Description",
      type: "string",
      width: 280,
      editable: { minDepth: 1 },       // only leaf rows in tree
    },
    {
      field: "quantity",
      header: "Qty",
      type: "number",
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
      valueExpr: "$row.quantity * $row.unitPrice",  // pre-computed onto row before table renders
      editable: false,
      sortable: false,
    },
    {
      field: "supplierName",
      header: "Supplier",
      type: "string",
      dataSource: "suppliers",
      joinOn: { rowField: "supplierId", sourceField: "id" },
      filterable: true,
      editable: false,
    },
    {
      field: "internalCode",
      header: "Code",
      type: "code",
      visible: false,                   // hidden by default; user can show via toolbar
      copyable: true,
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
    columnPinning: { enabled: true },
    columnOrdering: { enabled: true },
    columnResizing: { enabled: true },
    columnVisibility: { enabled: true },
    loading: { enabled: true, skeletonRows: 8 },
    virtualization: { enabled: true },
  },
}
```

---

## New Dependencies

| Package | Purpose | Size |
|---|---|---|
| `jsonata` | JSONata expression evaluation | ~180KB |

All other dependencies (`@tanstack/react-query`, shadcn, TanStack Table) already present.

---

## File Naming

All new files follow kebab-case convention per project guidelines. No barrel `index.ts` created.

---

## Completion Criteria

- [ ] `TableConfig`, `DataSourceConfig`, `ColumnConfig`, `DepthRule`, `TableFeaturesConfig`, `TableColumnMeta` types defined; all reuse existing types
- [ ] `dag-resolver.ts`: circular dependency detection throws `ConfigError` at hook-mount time with cycle path
- [ ] `dag-resolver.ts`: Kahn's algorithm produces correct wave order
- [ ] `dag-resolver.ts`: sources in same wave execute in parallel via `Promise.all`
- [ ] `dag-resolver.ts`: each wave receives `$sources` map of all prior resolved data
- [ ] `jsonata-evaluator.ts`: evaluates expressions in `source`, `row`, `depth` modes
- [ ] `jsonata-evaluator.ts`: all evaluation is async (`evaluate()` returns Promise); callers await
- [ ] `api-executor.ts`: 1 retry on network error (not 4xx/5xx); configurable per source
- [ ] `api-executor.ts`: `AbortController` signal cancels in-flight requests on unmount
- [ ] `api-executor.ts`: row-level deduplication via `Map<cacheKey, Promise>`
- [ ] `api-executor.ts`: row-level source failure sets column value to `null`; error collected in `rowSourceErrors`
- [ ] `column-builder.ts`: maps each `ColumnType` to correct existing factory
- [ ] `column-builder.ts`: `enableSorting`, `enableColumnFilter`, `enableResizing` passed through factory `...rest`
- [ ] `column-builder.ts`: `orderable: false` stored as `meta.orderable = false` (no TanStack flag)
- [ ] `column-builder.ts`: `visible: false` columns collected into `initialColumnVisibility` map
- [ ] `column-builder.ts`: `DepthRule` produces `meta.editableFn`; `meta.editable` set to `false`
- [ ] `column-builder.ts`: `valueExpr` columns use plain `accessorKey`; engine pre-populates row field
- [ ] `column-builder.ts`: `dataSource + joinOn` columns use `accessorFn` with secondary source closure
- [ ] `use-table-engine.ts`: config validated at mount; circular refs and bad column `dataSource` refs throw `ConfigError`
- [ ] `use-table-engine.ts`: `useQuery` with `placeholderData: keepPreviousData` for flat/paginated modes (TanStack Query v5)
- [ ] `use-table-engine.ts`: existing `useInfiniteData` hook reused for infinite mode
- [ ] `use-table-engine.ts`: `valueExpr` derived values computed async before column defs built; stored on row objects
- [ ] `use-table-engine.ts`: row-level sources batched per unique `cacheKey`; errors in `rowSourceErrors`
- [ ] `use-table-engine.ts`: sort/filter state changes included in query key for server-mode refetch
- [ ] `DataGridProps` extended with optional `initialColumnVisibility?: Record<string, boolean>`
- [ ] `DataGridConfig` (use-data-grid.ts) extended with same prop; `columnVisibility` state initialized from it
- [ ] `configured-table.tsx` strips engine-only feature keys (`columnOrdering`, `columnResizing`, `columnVisibility`) before forwarding `features` to `DataGrid`
- [ ] `useInfiniteData` extended to return `isError` and `error` from its internal `useInfiniteQuery`; `useTableEngine` reads them for infinite mode error surfacing
- [ ] `configured-table.tsx`: renders `DataGrid` with explicitly forwarded props; shadcn `Alert` on error
- [ ] `configured-table.tsx`: `getSubRows` derived from `options.subRowsField` (plain string, not JSONata)
- [ ] Example BOM config in `src/demo/bom-table-config.ts` renders correctly in tree mode
- [ ] `npm run build` passes with no type errors
