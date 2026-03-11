# Phase 3 — Sorting, Filtering, Column Features
**Goal:** Wire up sorting (client + server), filtering (client + server, fuzzy, faceting, filter row, column filter popovers), column resizing, and column visibility toggle.

**Depends on:** Phase 2 complete

---

## Step 1 — Sorting Feature

### `src/features/sorting/use-sorting.ts`
Hook that manages TanStack Table sorting state.

Responsibilities:
- Accepts `mode: 'client' | 'server'` and `onSortChange` callback
- Returns `sortingState`, `setSortingState`, `isSorted(columnId)`
- When `mode === 'server'`: converts internal sorting state to `SortState[]` and calls `onSortChange` (debounced 200ms)
- When `mode === 'client'`: TanStack Table handles sorting internally

TanStack Table config:
```ts
{
  manualSorting: mode === 'server',
  onSortingChange: setSortingState,
  enableMultiSort: true,        // Shift+click for secondary sort
  sortDescFirst: false,
}
```

### `src/features/sorting/sort-indicator.tsx` (upgrade from stub)
- `direction: 'asc' | 'desc' | false`
- `ArrowUpDown` when false (muted, size 12)
- `ArrowUp` when asc (primary color, size 12)
- `ArrowDown` when desc (primary color, size 12)
- CSS `transition-all duration-150` on the icon
- Shows sort priority number badge when multi-sort active (e.g. `1`, `2`)

### Wire into `DataGridHeader`
- `<th>` becomes `onClick={() => column.toggleSorting()}` when `column.getCanSort()`
- `cursor-pointer` on sortable headers
- `SortIndicator` replaces stub

---

## Step 2 — Column Resize

### `src/hooks/use-column-resize.ts`
Wraps TanStack Table column resizing.

```ts
{
  columnResizeMode: 'onChange',   // live resize (not 'onEnd')
  enableColumnResizing: true,
  columnResizeDirection: 'ltr',
}
```

Returns: `getResizeHandler(column)` — mouse/touch event handler for resize drag

### Wire into `DataGridHeader`
- Resize handle `<div>` at right edge of `<th>`
- `onMouseDown={getResizeHandler(header.column)}`
- Visual: `w-1 h-full absolute right-0 top-0 cursor-col-resize`
- Hover: `bg-primary/40` widens to `w-[3px]`
- While resizing: `bg-primary` + `user-select-none` on table

---

## Step 3 — Column Visibility

### Wired into `useDataGrid`
TanStack Table has built-in column visibility via `columnVisibility` state.

Add to hook return:
- `columnVisibility` state
- `toggleColumnVisibility(columnId)`
- `visibleColumns` — ordered list of currently visible columns

Column visibility toggle UI lives in the toolbar (Phase 7) — here we just wire the state.

---

## Step 4 — Filtering Feature

### `src/features/filtering/use-filtering.ts`
Manages all filter state.

Responsibilities:
- `mode: 'client' | 'server'`
- `columnFilters` state (array of `{ id, value }`)
- `globalFilter` state (string, for fuzzy search)
- When server mode: calls `onFilterChange` with normalized `FilterState[]` (debounced 300ms)
- Registers `fuzzyFilter` as a custom filter function on TanStack Table

TanStack Table config:
```ts
{
  manualFiltering: mode === 'server',
  filterFns: { fuzzy: fuzzyFilter },
  globalFilterFn: 'fuzzy',
  onColumnFiltersChange: setColumnFilters,
  onGlobalFilterChange: setGlobalFilter,
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  getFacetedMinMaxValues: getFacetedMinMaxValues(),
}
```

### `src/features/filtering/facet-badge.tsx`
Small badge showing active filter count.
- `ListFilter` icon, `text-primary` when active
- Badge: `text-[10px] bg-primary text-primary-foreground rounded-full px-1`
- Shown in column header when column has active filter

### `src/features/filtering/column-filter-popover.tsx`
Popover triggered by `ListFilter` icon in column header.

Type-aware filter UI:
| Column type | Filter UI |
|-------------|-----------|
| string | Text input with `contains` / `startsWith` toggle |
| number | **Dual-thumb range slider** (shadcn Slider, min/max from facet) + optional text inputs for exact bounds |
| date | Date range picker (from/to using shadcn Calendar) |
| multi-value | Checkbox list of unique values with counts (from faceting) |
| select | Checkbox list of options with counts |
| boolean | Toggle group: `All` / `True` / `False` (3 states, shadcn ToggleGroup) |
| code | Text input (contains match, same as string) |

**Number slider details:**
- `min` and `max` derived from `column.getFacetedMinMaxValues()` — adapts to current data
- Dual-thumb `<Slider>` from shadcn (range variant)
- Below slider: `{min}` ─── `{max}` labels
- Text inputs above slider for keyboard-precise entry
- `"Clear"` resets to full range

**Boolean filter details:**
- Default: `All` (no filter)
- `True` → filters rows where value is truthy
- `False` → filters rows where value is falsy
- Uses shadcn `ToggleGroup` with 3 segments

All popovers:
- shadcn `Popover` + `PopoverContent`
- Width: `w-56` (number: `w-64` for slider)
- "Clear filter" button at bottom
- Shows facet counts in parentheses: `React (14)` ✓

### `src/features/filtering/filter-row.tsx`
Optional `<tr>` rendered directly below the main header row.

- Enabled via `features.filtering.filterRow: true`
- One `<td>` per column with a compact control; type determines control:
  - `string` / `code` → text `<Input>`
  - `number` → two compact `<Input>` (min / max) side by side
  - `date` → compact text input (accepts ISO date string, opens calendar on focus)
  - `select` / `multi-value` → compact `<Select>` or opens inline checkbox list
  - `boolean` → three-way mini toggle: `All` / `✓` / `✗`
- `bg-background border-b-2 border-border`
- Input: `h-7 text-xs border-0 bg-transparent focus:ring-1 focus:ring-primary/40`

---

## Step 5 — Wire Everything into useDataGrid

Update `src/hooks/use-data-grid.ts` to compose sorting + filtering + resize hooks:

```ts
const sortingHook = useSorting(features.sorting)
const filteringHook = useFiltering(features.filtering)
const resizeHook = useColumnResize()

const table = useReactTable({
  data,
  columns,
  ...sortingHook.tableConfig,
  ...filteringHook.tableConfig,
  ...resizeHook.tableConfig,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  ...
})
```

Add to hook return:
```ts
{
  ...existing,
  sortingState,
  filterState,
  globalFilter, setGlobalFilter,
  columnFilters, setColumnFilters,
  getResizeHandler,
}
```

---

## Step 6 — Column Filter State in Header

Wire `column-filter-popover.tsx` into `DataGridHeader`:
- `ListFilter` icon shows in header action group (hover)
- `FacetBadge` shows when column has active filter
- Click opens popover anchored to header cell

---

## Completion Criteria

- [ ] Clicking column header sorts asc → desc → none (cycling)
- [ ] Shift+click adds secondary sort column
- [ ] `SortIndicator` shows correct icon with smooth animation
- [ ] Multi-sort priority badges visible
- [ ] Column resize handle visible on hover, dragging resizes live
- [ ] Client-side global fuzzy search filters rows
- [ ] Column filter popover opens correctly for each column type
- [ ] String filter: `contains` and `startsWith` modes work
- [ ] Number filter: dual-thumb slider adjusts range, text inputs for precise entry
- [ ] Number filter: slider min/max driven from `getFacetedMinMaxValues`
- [ ] Select/multi-value filter: checkbox list with facet counts
- [ ] Boolean filter: All/True/False toggle group works correctly
- [ ] Code filter: text input (contains) works same as string filter
- [ ] `FacetBadge` appears when column has active filter
- [ ] Filter row renders when `features.filtering.filterRow: true`
- [ ] Server mode: `onSortChange` called with correct `SortState[]`
- [ ] Server mode: `onFilterChange` called with correct `FilterState[]` (debounced)
- [ ] Column visibility state toggleable (UI in Phase 7 toolbar)
- [ ] `npm run typecheck` passes
