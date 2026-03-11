# Phase 1 — Foundation
**Goal:** Install all dependencies, establish the type system, utilities, and column factories. No rendering yet — this phase produces the type-safe building blocks every other phase depends on.

---

## Dependencies to Install

```bash
npm install @tanstack/react-table @tanstack/react-query @tanstack/react-virtual
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install lucide-react
npm install date-fns
npm install zod
npm install match-sorter
```

Remove unused:
```bash
npm uninstall @phosphor-icons/react
```

Install shadcn components needed:
```bash
npx shadcn@latest add badge button calendar checkbox dialog dropdown-menu input label popover select separator slider switch table textarea toggle-group tooltip
```

---

## Step 1 — Type System

### `src/types/grid-types.ts`
Define:
- `GridRow` — base row interface with `id: string` + index signature
- `GridMode` — `'flat' | 'paginated' | 'infinite' | 'tree'`
- `GridDensity` — `'compact' | 'normal' | 'comfortable'`
- `GridFeaturesConfig` — full features config interface with all feature sub-configs
- `MutationContext` — `{ rowId, columnId, previousValue }`
- `PaginationState` — `{ pageIndex, pageSize }`
- `InfiniteDataResult<T>` — shape of infinite query response

### `src/types/column-types.ts`
Define:
- `ColumnType` — `'string' | 'number' | 'date' | 'multi-value' | 'select' | 'boolean' | 'code' | 'custom'`
- `SelectOption` — `{ label: string; value: string; color?: string }`
- `ColumnMeta` — extensible interface (see spec §11 for module augmentation pattern)
- `GridColumnDef<TData>` — `ColumnDef<TData> & { meta?: ColumnMeta }`

### `src/types/filter-types.ts`
Define:
- `FilterMode` — `'client' | 'server'`
- `FilterState` — `{ columnId: string; value: unknown; operator?: FilterOperator }`
- `FilterOperator` — `'contains' | 'startsWith' | 'equals' | 'between' | 'in'`
- `FacetData` — `Map<unknown, number>` (value → count)

### `src/types/sort-types.ts`
Define:
- `SortMode` — `'client' | 'server'`
- `SortState` — `{ columnId: string; direction: 'asc' | 'desc' }`

### `src/types/slot-types.ts`
Define:
- `GridSlots` — all replaceable UI region props (see spec §4)
- Each slot typed with its corresponding props interface

### `src/types/editor-types.ts`
Define:
- `EditorProps<T>` — `{ value: T; onChange: (v: T) => void; onSave: () => void; onCancel: () => void; row: GridRow; columnId: string }`

### `src/types/index.ts`
Barrel export all types.

---

## Step 2 — Utilities

### `src/utils/formatters.ts`
- `formatNumber(value, format: 'currency'|'percent'|'decimal', locale?)` — uses `Intl.NumberFormat`
- `formatDate(value, format: string)` — uses `date-fns/format`
- `formatCurrency(value, currency?, locale?)` — shorthand
- `parseNumber(value: string): number | null`

### `src/utils/csv-export.ts`
- `exportToCsv(rows: GridRow[], columns: GridColumnDef[], filename: string): void`
- Handles: header row from column headers, cell value extraction, proper CSV escaping, blob download

### `src/utils/grid-utils.ts`
Central aggregator for reusable grid logic used across features. Prevents logic duplication between features.

```ts
// Cell value extraction
export function getCellDisplayValue(value: unknown, type: ColumnType): string
// → coerces any column type to a plain string for CSV export, search, aria-labels

// Deep row accessor — safely reads nested path like 'address.city'
export function getNestedValue(obj: unknown, path: string): unknown

// Column header text extraction (handles string and function headers)
export function getColumnHeaderText(column: Column<GridRow>): string

// Null/undefined check
export function isNullish(value: unknown): value is null | undefined

// Array coercion for multi-value columns
export function toArray<T>(value: T | T[] | null | undefined): T[]

// Generate stable skeleton widths from a seed (prevents skeleton flicker)
export function getSkeletonWidth(type: ColumnType, colIndex: number): string
// → returns e.g. '65%' based on type + index, deterministic

// Class name merging (re-exports cn from shadcn utils)
export { cn } from '@/lib/utils'

// Filter state helpers
export function hasActiveFilters(columnFilters: ColumnFiltersState, globalFilter: string): boolean
export function clearAllFilters(table: Table<GridRow>): void
// → calls table.resetColumnFilters() + table.resetGlobalFilter()
```

### `src/utils/mock-data.ts`
- `generateMockBomData(count: number): GridRow[]` — generates PLM/BOM-style rows
  - Fields: `id`, `partNumber`, `description`, `quantity`, `unitPrice`, `status`, `tags`, `createdAt`, `children`
  - 10% of rows have 2–5 children (for tree mode)
  - Status options: `'active' | 'draft' | 'obsolete' | 'review'`
  - Tags: random subset of `['mechanical', 'electrical', 'software', 'fastener', 'assembly', 'raw-material']`
- `simulateMutation<T>(value: T, delay?: number): Promise<T>` — returns value after delay, throws 10% of the time

---

## Step 3 — Fuzzy Filter

### `src/features/filtering/fuzzy-filter.ts`
- `fuzzyFilter(row, columnId, filterValue, addMeta)` — TanStack Table FilterFn
- Uses `match-sorter`'s ranking algorithm internally
- Stores ranking score in `row.columnFiltersMeta` for sort-by-rank support
- Export as both the FilterFn and a standalone `fuzzyMatch(str, query): boolean`

---

## Step 4 — Column Factories

Each factory returns a `GridColumnDef` with sensible defaults. All accept an options object and spread extra TanStack Table ColumnDef props through.

### `src/columns/string-column.tsx`
```ts
stringColumn(options: {
  accessorKey: string
  header: string
  editable?: boolean
  copyable?: boolean
  width?: number
  minWidth?: number
  meta?: Partial<ColumnMeta>
  // ...spread ColumnDef overrides
}): GridColumnDef
```
- Sets `meta.type = 'string'`
- Default `size: 200`, `minSize: 80`
- Filter fn: `'includesString'` (client) or passthrough (server)
- Cell: renders string value, optional copy button on hover

### `src/columns/number-column.tsx`
```ts
numberColumn(options: {
  accessorKey: string
  header: string
  editable?: boolean
  format?: 'currency' | 'percent' | 'decimal'
  currency?: string
  locale?: string
  width?: number
  meta?: Partial<ColumnMeta>
}): GridColumnDef
```
- Sets `meta.type = 'number'`
- Default `size: 120`, `enableSorting: true`
- Cell: right-aligned, `font-mono`, formatted value

### `src/columns/date-column.tsx`
```ts
dateColumn(options: {
  accessorKey: string
  header: string
  editable?: boolean
  dateFormat?: string    // default: 'MMM d, yyyy'
  width?: number
  meta?: Partial<ColumnMeta>
}): GridColumnDef
```
- Sets `meta.type = 'date'`
- Default `size: 160`
- Cell: Calendar icon + formatted date, subtle `bg-orange-500/5` tint

### `src/columns/multi-value-column.tsx`
```ts
multiValueColumn(options: {
  accessorKey: string
  header: string
  editable?: boolean
  options?: SelectOption[]
  maxVisible?: number    // default 3, rest shown as "+N"
  width?: number
  meta?: Partial<ColumnMeta>
}): GridColumnDef
```
- Sets `meta.type = 'multi-value'`
- Default `size: 240`
- Cell: renders array as Badge chips, truncates with "+N more"

### `src/columns/select-column.tsx`
```ts
selectColumn(options: {
  accessorKey: string
  header: string
  editable?: boolean
  options: SelectOption[]
  width?: number
  meta?: Partial<ColumnMeta>
}): GridColumnDef
```
- Sets `meta.type = 'select'`
- Default `size: 140`
- Cell: colored Badge based on option's `color` field

### `src/columns/boolean-column.tsx`
```ts
booleanColumn(options: {
  accessorKey: string
  header: string
  editable?: boolean
  trueLabel?: string    // default: 'Yes'
  falseLabel?: string   // default: 'No'
  renderAs?: 'badge' | 'checkbox' | 'icon'   // default: 'badge'
  width?: number
  meta?: Partial<ColumnMeta>
}): GridColumnDef
```
- Sets `meta.type = 'boolean'`
- Default `size: 100`, `enableSorting: true`
- Cell renderings:
  - `badge`: `<Badge variant="outline">Yes</Badge>` (green tint) / `<Badge variant="outline">No</Badge>` (muted)
  - `checkbox`: read-only `<Checkbox checked={value} disabled />` (pointer-events-none for non-editable)
  - `icon`: `<Check className="text-emerald-500" />` / `<X className="text-muted-foreground" />`
- Filter: checkbox toggle UI (true / false / all)
- Editor: single toggle `<Switch>` (shadcn)

### `src/columns/code-column.tsx`
```ts
codeColumn(options: {
  accessorKey: string
  header: string
  editable?: boolean
  language?: string    // for future syntax highlight hint, default: 'text'
  copyable?: boolean   // default: true (code is almost always copyable)
  maxLines?: number    // truncate display after N lines, default: 1
  width?: number
  meta?: Partial<ColumnMeta>
}): GridColumnDef
```
- Sets `meta.type = 'code'`
- Default `size: 220`
- Cell: `font-mono text-[12px] bg-muted/40 rounded px-1.5 py-0.5` inline code block
  - For multi-line values: shows first `maxLines` lines, truncates with `...` and tooltip showing full value
  - Copy button always visible (not hover-only, since code often needs copying)
- Filter: text input filter (same as string)
- Editor: `<textarea>` in a monospace font (not single-line input)

### `src/columns/index.ts`
Barrel export all factories.

---

## Completion Criteria

- [ ] All packages installed, `npm run typecheck` passes
- [ ] All type files created with no `any` types
- [ ] `ColumnType` includes all 8 types: `string | number | date | multi-value | select | boolean | code | custom`
- [ ] Column factories return correctly typed `GridColumnDef` — all 7 factories work
- [ ] `booleanColumn` renders badge/checkbox/icon variants correctly
- [ ] `codeColumn` renders with monospace style and copy button
- [ ] `generateMockBomData(10000)` runs in < 100ms (include boolean + code fields in mock data)
- [ ] `exportToCsv` produces valid CSV output
- [ ] `fuzzyFilter` passes basic matching tests (manual check)
- [ ] `grid-utils.ts` exports all utility functions with correct types
- [ ] `clearAllFilters` correctly resets column and global filters
