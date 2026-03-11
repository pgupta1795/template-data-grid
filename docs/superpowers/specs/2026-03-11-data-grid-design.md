# Data Grid — Design Specification
**Date:** 2026-03-11
**Status:** Approved
**Stack:** React 19, TypeScript, TanStack Table v8, TanStack Query v5, TanStack Virtual, shadcn/ui, TailwindCSS v4, lucide-react, @dnd-kit/core, @base-ui/react (primitives)

---

## 1. Overview

A production-grade, spreadsheet-style data grid component library for React. Designed for PLM/BOM applications requiring deep hierarchical data, wide column sets, and large datasets (100k+ rows). Inspired by Notion/Airtable — subtle, modern, minimal.

**Architectural pattern:** Hook + Components (Approach B)
- `useDataGrid` hook owns all state and TanStack Table instance
- Focused rendering components consume the hook via context
- Top-level `<DataGrid>` is a compositor only — no logic

---

## 2. Design Language — Utilitarian Precision

### Typography
- **Header labels:** `text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground`
- **Body cells (string/general):** `text-[13px] font-normal`
- **Body cells (number/code):** `font-mono text-[12px]` — uses JetBrains Mono (already installed)
- **Group row labels:** `text-[12px] font-medium`
- **Toolbar labels:** `text-[13px] font-medium`

### Color Tokens
All values reference CSS custom properties — zero hardcoded hex.

| Token | Usage |
|-------|-------|
| `--background` | table background, row default |
| `--muted/0.4` | header background (barely-there tint) |
| `--muted/0.3` | row hover |
| `--primary/0.06` | selected row background |
| `--primary` | selected row left border (2px), editing ring |
| `--border` | cell/row dividers |
| `--border/0.5` | vertical cell dividers (subtler) |
| `--muted-foreground` | header text, icon default |

### Column Type Icon Tints (subtle, icon only)
| Type | Color class |
|------|-------------|
| string | `text-blue-500/60` |
| number | `text-emerald-500/60` |
| date | `text-orange-500/60` |
| multi-value | `text-purple-500/60` |
| select | `text-slate-500/60` |
| custom | none (or user-provided) |

### Density Presets (CSS custom properties)
```css
[data-density="compact"]     { --row-height: 32px; --cell-px: 8px;  --cell-py: 4px;  --font-size: 12px; }
[data-density="normal"]      { --row-height: 40px; --cell-px: 12px; --cell-py: 8px;  --font-size: 13px; }
[data-density="comfortable"] { --row-height: 48px; --cell-px: 16px; --cell-py: 12px; --font-size: 14px; }
```

### Cell States
| State | Visual |
|-------|--------|
| default | `bg-background` |
| hover | `bg-muted/30` |
| selected row | `bg-primary/6 border-l-2 border-primary` |
| editing | `ring-2 ring-primary/60 ring-inset bg-background` |
| pinned top/bottom row | `bg-muted/60 sticky` + `shadow-sm` |
| mutating (optimistic) | `opacity-70` shimmer overlay |

### Pinned Column Shadow
```css
/* Last pinned-left column */
box-shadow: inset -1px 0 0 var(--border), 4px 0 8px -2px oklch(0 0 0 / 0.06);
/* First pinned-right column */
box-shadow: inset 1px 0 0 var(--border), -4px 0 8px -2px oklch(0 0 0 / 0.06);
```

### Header Design
- Height follows density: `36px / 40px / 44px`
- Border: `border-b-2 border-border` (heavier than row dividers)
- Column type icon: 12px, colored per type, left of label
- Sort icon: `ArrowUpDown` → `ArrowUp` / `ArrowDown`, inline after label, animated
- Filter icon: `ListFilter`, appears on hover, `text-primary` when active
- Header action group (sort/filter/pin/resize): right-aligned, appears on hover
- Resize handle: `1px bg-border` right edge → `3px` on hover, `cursor-col-resize`
- Header group row: same `bg-muted/40`, `border-b border-border`, label centered, spans child columns

### Skeleton
- Bars: `bg-muted/60 rounded-sm animate-pulse`
- Cell bars: varying widths (40–80%) per column for natural look, centered vertically
- Header bars: 70% column width, `h-[11px]` matching header text height
- Header group bars: 60% width, `h-4`
- Respects `prefers-reduced-motion` (no animation when reduced-motion is set)

### Toolbar
```
[slots.toolbarLeft] [Search...] ──────────── [Columns] [Density] [Refresh] [Export] [slots.toolbarRight]
```
- `bg-background/80 backdrop-blur-md border-b border-border/60`
- Height: `48px`
- Search: `w-56` → `w-72` on focus (CSS transition)
- Buttons: `ghost` variant, `size-8`, icon only with tooltip
- When rows selected — contextual bar slides in above toolbar:
  ```
  ✓ {N} rows selected   [Delete] [Export selected] [Clear selection]
  ```

---

## 3. Folder Structure

```
src/
  types/
    grid-types.ts           # GridRow, GridMode, GridDensity, GridFeaturesConfig
    column-types.ts         # ColumnMeta (module-augmentable), GridColumnDef
    filter-types.ts         # FilterState, FilterMode, FacetData
    sort-types.ts           # SortState, SortMode
    slot-types.ts           # GridSlots — all replaceable UI regions
    editor-types.ts         # EditorProps, MutationContext

  features/
    sorting/
      use-sorting.ts
      sort-indicator.tsx
    filtering/
      use-filtering.ts
      column-filter-popover.tsx
      filter-row.tsx
      facet-badge.tsx
      fuzzy-filter.ts
    grouping/
      use-grouping.ts
      group-row.tsx
    selection/
      use-selection.ts
      selection-cell.tsx
    pinning/
      use-column-pinning.ts
      use-row-pinning.ts
      pinned-shadow.tsx
    editing/
      use-editing.ts
      optimistic-update.ts
    virtualization/
      use-virtualization.ts
    loading/
      use-loading-state.ts
      skeleton-cell.tsx
      skeleton-header.tsx
      skeleton-header-group.tsx

  columns/
    string-column.tsx
    number-column.tsx
    date-column.tsx
    multi-value-column.tsx
    select-column.tsx
    index.ts

  editors/
    text-editor.tsx
    number-editor.tsx
    date-editor.tsx
    chip-editor.tsx
    select-editor.tsx
    index.ts

  hooks/
    use-data-grid.ts        # orchestrates all feature hooks
    use-column-resize.ts
    use-infinite-data.ts

  utils/
    formatters.ts
    csv-export.ts
    mock-data.ts

  components/
    data-grid/
      data-grid.tsx
      data-grid-toolbar.tsx
      data-grid-header.tsx
      data-grid-row.tsx
      data-grid-cell.tsx
      data-grid-skeleton.tsx
      data-grid-row-skeleton.tsx
      data-grid-empty.tsx
      index.ts

  demo/
    demo-page.tsx
    demo-columns.ts
    demo-data.ts
```

---

## 4. Core API

### DataGrid Component
```tsx
<DataGrid
  columns={columns}
  data={data}                        // flat mode
  queryKey={['items']}              // paginated/infinite mode
  queryFn={fetchItems}              // paginated/infinite mode
  mode="flat"                        // 'flat' | 'paginated' | 'infinite' | 'tree'
  getSubRows={(row) => row.children} // tree mode
  features={featuresConfig}
  density="normal"
  className=""
  rowClassName={(row) => ''}
  icons={{ sort, filter, expand, ... }}
  slots={{ toolbar, empty, headerCell, row, cell, ... }}
  onRowClick={(row) => {}}
  onRowDoubleClick={(row) => {}}
  onCellClick={(cell) => {}}
/>
```

### Features Config
```ts
features: {
  sorting:       { enabled, mode: 'client'|'server', onSortChange }
  filtering:     { enabled, mode: 'client'|'server', fuzzy, filterRow, faceting, onFilterChange }
  grouping:      { enabled, defaultGroupBy, onGroupChange }
  selection:     { enabled, mode: 'single'|'multi', onSelectionChange }
  pinning:       { columns, rows }
  editing:       { enabled, onMutate, onError }
  virtualization:{ enabled, rowHeight, overscan }
  export:        { csv, onExport }
  loading:       { enabled, skeletonRows, showHeaderSkeleton }
}
```

### Column Factories
```ts
stringColumn({ accessorKey, header, editable, copyable, meta })
numberColumn({ accessorKey, header, editable, format: 'currency'|'percent'|'decimal', meta })
dateColumn({ accessorKey, header, editable, dateFormat, meta })
multiValueColumn({ accessorKey, header, editable, options, meta })
selectColumn({ accessorKey, header, editable, options, meta })
```

### useDataGrid Hook (returned shape)
```ts
{
  table,               // TanStack Table instance
  isLoading,           // boolean
  isMutating,          // boolean
  isFetchingNextPage,  // boolean (infinite mode)
  sortState,           // current sort (server-side exposure)
  filterState,         // current filters (server-side exposure)
  editingCell,         // { rowId, columnId } | null
  selectedRows,        // GridRow[]
  density,             // GridDensity
  setDensity,
  globalFilter,
  setGlobalFilter,
  virtualRows,         // from TanStack Virtual
  virtualColumns,      // from TanStack Virtual
  rowVirtualizer,      // TanStack Virtual instance
  columnVirtualizer,   // TanStack Virtual instance
  tableContainerRef,   // ref for scroll container
}
```

---

## 5. Table Modes

### Flat
- Pure client-side, data prop required
- All features run client-side by default

### Paginated
- TanStack Query `useQuery` with page param
- Pagination bar in footer
- `manualPagination: true` on TanStack Table

### Infinite
- TanStack Query `useInfiniteQuery`
- Skeleton rows appended at bottom while fetching next page
- `fetchNextPage` triggered at scroll threshold via virtual scroll position

### Tree
- `getSubRows` prop required
- Row expand/collapse via TanStack Table expanding feature
- Indent: `20px × depth`
- Expand toggle: `ChevronRight` rotates to `ChevronDown` (CSS transition)
- Designed for BOM/PLM hierarchies — no max depth limit

---

## 6. Editing

- **Trigger:** double-click cell → `editingCell` state set
- **Save:** Enter key or blur (configurable)
- **Cancel:** Escape key → revert to original value
- **Optimistic update:** value updates in local state immediately; `onMutate` runs async; on error, value reverts and `onError` fires
- **Mutation state:** cell shows `opacity-70` + shimmer while mutation pending

### Editor mapping
| Column type | Editor component |
|-------------|-----------------|
| string | `TextEditor` — plain input |
| number | `NumberEditor` — numeric input, right-aligned |
| date | `DateEditor` — shadcn Calendar in Popover |
| multi-value | `ChipEditor` — tag add/remove with keyboard support |
| select | `SelectEditor` — shadcn Select dropdown |
| custom | `meta.renderEditor` |

---

## 7. Filtering

### Client-side
- TanStack Table's built-in filter functions + custom `fuzzyFilter`
- `fuzzyFilter`: simple Levenshtein-based matching, no external dependency
- Column faceting via `getFacetedUniqueValues()` — shown in filter popovers as checkboxes with counts
- Global fuzzy search via `globalFilter` state

### Server-side
- `manualFiltering: true` on TanStack Table
- `filterState` exposed from hook — consumer passes to query function
- Debounced (300ms) before triggering refetch

### Filter UI modes
- **A) Column filter popover** — `ListFilter` icon in header on hover → popover with type-aware input (text/number range/date range/checkbox list)
- **B) Filter row** — always-visible row below headers, input per column
- **Both available** — `features.filtering.filterRow: true` enables B, A always available

---

## 8. Sorting

- Multi-column sort supported (Shift+click for secondary sort)
- `SortIndicator` component: `ArrowUpDown` (none) → `ArrowUp` (asc) → `ArrowDown` (desc)
- Server-side: `manualSorting: true`, `onSortChange` callback with current `SortState[]`

---

## 9. Virtualization

- **Row virtualization:** TanStack Virtual `useVirtualizer`, `overscan: 5` default
- **Column virtualization:** TanStack Virtual `useVirtualizer` on columns, `overscan: 3` default
- Pinned columns rendered outside virtual column window (always mounted)
- Scroll container: `overflow-auto` div, measured by virtualizers
- `estimateSize` uses `--row-height` CSS variable converted to number

---

## 10. Accessibility

- Table uses semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
- `aria-sort` on sorted column headers
- `aria-selected` on selected rows
- `aria-expanded` on tree rows
- `aria-colindex`, `aria-rowindex` for virtualized cells
- `role="gridcell"` on editable cells
- Keyboard navigation: Tab between cells, Enter to edit, Arrow keys to navigate
- Focus management: on edit cancel/save, focus returns to cell
- `aria-live="polite"` region for mutation feedback

---

## 11. Extensibility

### Custom cell renderer
```ts
stringColumn({
  accessorKey: 'status',
  header: 'Status',
  meta: {
    render: (value, row) => <StatusBadge value={value} />
  }
})
```

### Custom editor
```ts
meta: {
  renderEditor: ({ value, onChange, onSave, onCancel }) => (
    <MyCustomEditor value={value} onChange={onChange} onSave={onSave} />
  )
}
```

### Custom slot
```tsx
<DataGrid
  slots={{
    toolbar: MyToolbar,
    toolbarRight: <ExtraButton />,
    empty: <MyEmptyState />,
    row: MyCustomRow,
  }}
/>
```

### ColumnMeta module augmentation
```ts
declare module '@/types/column-types' {
  interface ColumnMeta {
    bomLevel?: number
    revisable?: boolean
    unit?: string
  }
}
```

---

## 12. Demo Page

- 10,000 rows of mock BOM/PLM data
- Columns: Part Number (string), Description (string), Quantity (number), Unit Price (number/currency), Status (select), Tags (multi-value), Created Date (date), children[] for tree
- All features enabled: tree mode, editing, sorting, filtering, grouping, selection, column pinning, column visibility, density controls, export
- Simulated mutations with 800ms fake delay + occasional simulated error
- TanStack Query QueryClient wrapping demo
