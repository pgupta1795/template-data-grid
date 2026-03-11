# Phase 2 — Core Rendering (Flat Mode)
**Goal:** Build the visual shell — DataGrid, DataGridHeader, DataGridRow, DataGridCell — rendering a flat table with static data. No features yet (no sorting, filtering, editing). Establish the full visual language from the design spec.

**Depends on:** Phase 1 complete

---

## Step 1 — DataGrid Context

### `src/components/data-grid/data-grid-context.tsx`
Create a React context that shares the `useDataGrid` hook return value across all sub-components. This avoids prop drilling entirely.

```ts
const DataGridContext = createContext<DataGridContextValue | null>(null)
export const useDataGridContext = () => { /* throws if used outside provider */ }
```

---

## Step 2 — useDataGrid Hook (minimal — flat mode only)

### `src/hooks/use-data-grid.ts`
Wire up TanStack Table for flat mode. No features yet — just the table instance and basic state.

Returns:
- `table` — TanStack Table instance
- `isLoading` — boolean (always false in flat mode)
- `density` / `setDensity`
- `globalFilter` / `setGlobalFilter`
- `tableContainerRef` — ref for scroll container

Config accepted:
- `data`, `columns`, `mode: 'flat'`, `density`, `features` (stubbed — not yet wired)

---

## Step 3 — DataGridEmpty

### `src/components/data-grid/data-grid-empty.tsx`
Empty state shown when table has zero rows and `isLoading` is false.

Visual:
- Centered in table body space
- `Database` icon (lucide, 32px, `text-muted-foreground/40`)
- "No data" heading: `text-sm font-medium text-muted-foreground`
- Optional sub-text: "Try adjusting your filters" (shown when `hasActiveFilters`)
- Accepts `slots.empty` override — if provided, render that instead

---

## Step 4 — DataGridCell

### `src/components/data-grid/data-grid-cell.tsx`
Renders a single cell. Reads column `meta.type` and `meta.render` to decide rendering.

**Rendering priority:**
1. `meta.render(value, row)` — custom renderer (highest priority)
2. Type-based renderer:
   - `string` — text, optional copy button on hover
   - `number` — right-aligned, `font-mono`, formatted
   - `date` — `Calendar` icon + formatted date, `bg-orange-500/5` tint
   - `multi-value` — array of `Badge` chips, truncates at `meta.maxVisible`
   - `select` — single colored `Badge`
   - `boolean` — badge/checkbox/icon based on `meta.renderAs` (default badge: ✓ Yes / – No)
   - `code` — `font-mono bg-muted/40 rounded px-1.5 py-0.5`, copy button always visible
   - fallback — `String(value)`

**Cell wrapper styles (all applied here):**
```
px-[var(--cell-px)] py-[var(--cell-py)]
border-r border-border/30 last:border-r-0
border-b border-border/50
text-[length:var(--font-size)]
transition-colors duration-100
```

**Hover state:** `group-hover/row:bg-muted/30` — uses Tailwind group on `<tr>`

Accepts: `cell` (TanStack Table Cell), `className`, forward ref

---

## Step 5 — DataGridRow

### `src/components/data-grid/data-grid-row.tsx`
Renders a `<tr>` for one row. Uses `group/row` Tailwind group for hover coordination.

**Variants handled:**
- Standard flat row
- Selected row: `bg-primary/6 border-l-2 border-l-primary`
- Tree row: renders expand toggle before first cell (Phase 5 adds tree mode — placeholder here)
- Group row: delegated to `features/grouping/group-row.tsx` (Phase 3)

**Row styles:**
```
group/row bg-background
hover:bg-muted/30
data-[selected=true]:bg-primary/6
transition-colors duration-100
```

Height controlled by `--row-height` CSS variable.

Accepts: `row` (TanStack Table Row), `virtualRow` (optional, for virtualized offset), `className`

---

## Step 6 — DataGridHeader + SortIndicator stub

### `src/components/data-grid/data-grid-header.tsx`
Renders `<thead>` — header group rows + main header row + (optional) filter row placeholder.

**Header group row** (when column groups exist):
- `bg-muted/40 border-b border-border`
- Group label: `text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground`
- Centered, spans child columns via `colSpan`

**Main header row:**
- `bg-muted/40 border-b-2 border-border`
- Height: density-driven

**Each header cell (`<th>`):**
```
px-[var(--cell-px)] h-[var(--header-height)]
text-[11px] font-semibold uppercase tracking-[0.08em]
text-muted-foreground select-none
border-r border-border/30 last:border-r-0
```

**Header cell content layout:**
```
[TypeIcon 12px] [Label] ──── [SortIcon] [FilterIcon] [ResizeHandle]
```
- `TypeIcon`: 12px, colored per `ColumnMeta.type`, always visible
- `SortIcon`: stub — `ArrowUpDown` muted (Phase 3 makes it interactive)
- `FilterIcon`: `ListFilter`, appears on hover (Phase 3 makes it interactive)
- `ResizeHandle`: 4px wide right edge, `hover:bg-primary/40 cursor-col-resize` (Phase 3 wires logic)

### `src/features/sorting/sort-indicator.tsx`
Stub component: renders `ArrowUpDown` (unsorted), `ArrowUp` (asc), `ArrowDown` (desc).
Accepts `direction: 'asc' | 'desc' | false`. Animated with `transition-transform`.

---

## Step 7 — DataGrid (compositor)

### `src/components/data-grid/data-grid.tsx`
The top-level component. Creates the `useDataGrid` hook instance and provides context.

```tsx
export function DataGrid<TData extends GridRow>(props: DataGridProps<TData>) {
  const grid = useDataGrid(props)
  return (
    <DataGridContext.Provider value={grid}>
      <div data-density={grid.density} className={cn('relative w-full', props.className)}>
        {/* toolbar placeholder — Phase 7 */}
        <div ref={grid.tableContainerRef} className="overflow-auto">
          <table className="w-full border-collapse text-sm">
            <DataGridHeader />
            <tbody>
              {isLoading ? <SkeletonRows /> /* Phase 7 */ : (
                rows.length === 0
                  ? <tr><td><DataGridEmpty /></td></tr>
                  : rows.map(row => <DataGridRow key={row.id} row={row} />)
              )}
            </tbody>
          </table>
        </div>
        {/* pagination placeholder — Phase 8 */}
      </div>
    </DataGridContext.Provider>
  )
}
```

### `src/components/data-grid/index.ts`
Barrel export `DataGrid`, `DataGridToolbar`, `DataGridHeader`, `DataGridRow`, `DataGridCell`.

---

## Step 8 — Demo Integration (flat mode only)

### `src/demo/demo-columns.ts`
Define 6 columns using factories:
```ts
export const demoBomColumns = [
  stringColumn({ accessorKey: 'partNumber', header: 'Part Number', copyable: true }),
  stringColumn({ accessorKey: 'description', header: 'Description', width: 280 }),
  numberColumn({ accessorKey: 'quantity', header: 'Qty' }),
  numberColumn({ accessorKey: 'unitPrice', header: 'Unit Price', format: 'currency' }),
  selectColumn({ accessorKey: 'status', header: 'Status', options: STATUS_OPTIONS }),
  multiValueColumn({ accessorKey: 'tags', header: 'Tags' }),
  booleanColumn({ accessorKey: 'isActive', header: 'Active', renderAs: 'badge' }),
  codeColumn({ accessorKey: 'internalCode', header: 'Code', copyable: true }),
  dateColumn({ accessorKey: 'createdAt', header: 'Created' }),
]
```

### `src/demo/demo-page.tsx`
Render `<DataGrid>` with `generateMockBomData(200)` (small count for Phase 2), mode `'flat'`.

### Update `src/App.tsx`
Import and render `<DemoPage />`.

---

## Completion Criteria

- [ ] Flat table renders with all 9 column types displaying correctly
- [ ] Column type icons appear with correct colors
- [ ] Row hover state works (`bg-muted/30`)
- [ ] Number cells are right-aligned with `font-mono`
- [ ] Date cells show Calendar icon + formatted date with orange tint
- [ ] Multi-value cells render Badge chips (truncated at 3)
- [ ] Select cells render colored Badge
- [ ] Boolean cells render badge (Yes/No), checkbox, or icon based on `renderAs`
- [ ] Code cells render with monospace style and always-visible copy button
- [ ] Header shows type icon + label + stub sort/filter icons
- [ ] Header group row renders correctly when column groups defined
- [ ] Empty state renders when data is empty array
- [ ] Density toggle works (compact/normal/comfortable changes row height/padding)
- [ ] Dark mode: all colors invert correctly via CSS variables
- [ ] `npm run typecheck` passes
- [ ] No console errors
