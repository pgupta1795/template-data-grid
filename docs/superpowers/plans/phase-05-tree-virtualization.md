# Phase 5 — Tree Table + Row & Column Virtualization
**Goal:** Implement the tree table mode for BOM/PLM hierarchies with arbitrary nesting depth. Add TanStack Virtual row + column virtualization so the grid handles 100k+ rows and 30+ columns efficiently.

**Depends on:** Phase 4 complete

---

## Step 1 — Tree Table Mode

### TanStack Table config for tree mode
```ts
{
  getSubRows: props.getSubRows ?? ((row) => row.children),
  getExpandedRowModel: getExpandedRowModel(),
  autoResetExpanded: false,
  enableExpanding: true,
  onExpandedChange: setExpanded,
  // Important: expanding is separate from grouping
  // Tree rows use getSubRows, grouped rows use getGroupedRowModel
}
```

**Mode detection in `useDataGrid`:**
```ts
if (mode === 'tree') {
  tableConfig.getSubRows = props.getSubRows ?? ((row: any) => row.children)
  tableConfig.getExpandedRowModel = getExpandedRowModel()
}
```

---

## Step 1b — Lazy Tree Expansion (onExpand API)

For BOM/PLM use cases where the tree has thousands of nodes, loading all data upfront is impractical. The grid supports **lazy child fetching**: root objects load immediately, children are fetched only when a row is expanded.

### API

```ts
// DataGrid prop — only applies in tree mode
onExpand?: (row: GridRow) => Promise<GridRow[]> | void
```

If `onExpand` is provided:
- `getSubRows` still works for pre-loaded children (fallback for already-fetched nodes)
- When a row is expanded AND its children array is empty/undefined, `onExpand(row)` is called
- Result is merged back into the row's data using `setData` (local state update)
- Loading state shown for that specific row during fetch

### `src/features/tree/use-lazy-expand.ts`

```ts
interface LazyExpandConfig {
  onExpand?: (row: GridRow) => Promise<GridRow[]> | void
  setData: React.Dispatch<React.SetStateAction<GridRow[]>>
}

function useLazyExpand({ onExpand, setData }: LazyExpandConfig) {
  // Track which rows are currently loading their children
  const [loadingRowIds, setLoadingRowIds] = useState<Set<string>>(new Set())

  const handleExpand = useCallback(async (row: Row<GridRow>) => {
    if (!onExpand) return
    const rowData = row.original
    const alreadyHasChildren = rowData.children && rowData.children.length > 0
    if (alreadyHasChildren) return  // already fetched, TanStack Table handles expand

    setLoadingRowIds(prev => new Set(prev).add(row.id))
    try {
      const children = await onExpand(rowData)
      if (children) {
        // Merge children into data tree (recursive path update)
        setData(prev => mergeChildrenIntoTree(prev, rowData.id, children))
      }
    } finally {
      setLoadingRowIds(prev => {
        const next = new Set(prev)
        next.delete(row.id)
        return next
      })
    }
  }, [onExpand, setData])

  return { loadingRowIds, handleExpand }
}
```

### `mergeChildrenIntoTree` utility (add to `grid-utils.ts`)

```ts
// Recursively finds the node with matching id and sets its children
export function mergeChildrenIntoTree(
  rows: GridRow[],
  parentId: string,
  children: GridRow[]
): GridRow[]
```

### ExpandToggle update

```tsx
function ExpandToggle({ row }: { row: Row<GridRow> }) {
  const { handleExpand, loadingRowIds } = useDataGridContext()
  const isLoadingChildren = loadingRowIds.has(row.id)

  if (!row.getCanExpand()) return null

  return (
    <button
      onClick={async () => {
        if (!row.getIsExpanded()) {
          await handleExpand(row)  // fetch children if needed
        }
        row.getToggleExpandedHandler()()  // then toggle TanStack Table state
      }}
      style={{ paddingLeft: `${row.depth * 20}px` }}
      aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
      aria-expanded={row.getIsExpanded()}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      {isLoadingChildren
        ? <Loader2 size={14} className="animate-spin" />
        : <ChevronRight
            size={14}
            className={cn('transition-transform duration-150', row.getIsExpanded() && 'rotate-90')}
          />
      }
    </button>
  )
}
```

### Row skeleton during lazy load

When `isLoadingChildren` is true for a row that is being expanded, show 3 skeleton rows indented at `row.depth + 1` level to indicate children are loading.

### `canExpand` detection

To show the expand toggle even on rows that haven't loaded children yet, the column factory or data source must signal that a row CAN have children via a sentinel field:

```ts
// In GridRow type, add optional field:
_hasChildren?: boolean   // true = show expand toggle even if children array is empty
```

If `row.original._hasChildren === true`, the `ExpandToggle` renders (even with no children loaded yet).
If `row.original._hasChildren === false` or undefined, defer to TanStack Table's `row.getCanExpand()`.

### Demo for lazy expand

In `demo-page.tsx` tree tab:
```ts
<DataGrid
  data={MOCK_ROOT_NODES}   // only root-level nodes
  mode="tree"
  onExpand={async (row) => {
    await delay(400 + Math.random() * 300)
    return generateMockChildren(row.id, 5 + Math.floor(Math.random() * 10))
  }}
  getSubRows={r => r.children}
  columns={demoBomColumns}
  features={allFeatures}
/>
```

### Expand toggle column (auto-injected in tree mode)

A special column is prepended to the column list when `mode === 'tree'`:
```ts
{
  id: '__expand__',
  size: 32,
  maxSize: 32,
  enableSorting: false,
  enableResizing: false,
  enableHiding: false,
  header: () => null,
  cell: ({ row }) => <ExpandToggle row={row} />,
}
```

### `src/features/tree/expand-toggle.tsx`
Renders the expand/collapse control for tree rows.

```tsx
function ExpandToggle({ row }: { row: Row<GridRow> }) {
  if (!row.getCanExpand()) return null

  return (
    <button
      onClick={row.getToggleExpandedHandler()}
      style={{ paddingLeft: `${row.depth * 20}px` }}   // 20px indent per level
      aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
      aria-expanded={row.getIsExpanded()}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      <ChevronRight
        size={14}
        className={cn(
          'transition-transform duration-150',
          row.getIsExpanded() && 'rotate-90'
        )}
      />
    </button>
  )
}
```

### Depth indentation in first data cell
When `mode === 'tree'`, the first non-expand column cell gets `paddingLeft` addition:
```ts
// In DataGridCell, check if it's the first data column in tree mode
const extraPadding = isFirstDataColumn && mode === 'tree'
  ? `${row.depth * 20}px`
  : '0px'
```

This gives a natural "nested" appearance without a separate indent column.

### BOM-specific considerations
- No max depth limit — PLM BOMs can be 10+ levels deep
- `expandAll()` / `collapseAll()` controls wired into toolbar (Phase 7)
- Tree rows show depth indicator: subtle left border tints `oklch(var(--primary) / {0.05 * depth})`
- Performance: only expanded rows pass through `getFilteredRowModel` — TanStack Table handles this

---

## Step 2 — Row Virtualization

### `src/features/virtualization/use-virtualization.ts`

```ts
import { useVirtualizer } from '@tanstack/react-virtual'

export function useVirtualization({
  enabled,
  rowCount,
  rowHeight = 40,        // matches --row-height normal density
  containerRef,
  overscan = 5,
}: VirtualizationConfig) {
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  return { rowVirtualizer, virtualRows: rowVirtualizer.getVirtualItems() }
}
```

**Density-aware row height:**
```ts
const densityHeights: Record<GridDensity, number> = {
  compact: 32,
  normal: 40,
  comfortable: 48,
}
const rowHeight = densityHeights[density]
```

**Wire into DataGrid body:**
```tsx
// Total height spacer (prevents scroll bar jump)
<tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }} />

// Only render virtual rows
{virtualRows.map(virtualRow => {
  const row = rows[virtualRow.index]
  return (
    <DataGridRow
      key={row.id}
      row={row}
      style={{ transform: `translateY(${virtualRow.start}px)`, position: 'absolute' }}
    />
  )
})}
```

**Important:** rows use `position: absolute` + `translateY` inside a relative container. The `<tbody>` becomes `position: relative; height: {totalSize}px`.

**Tree mode virtualization:**
- TanStack Table's `getRowModel().rows` with tree expansion gives the flat list of visible rows
- Virtualization operates on this flat list — collapsed subtrees are simply not in the list
- No special handling needed — TanStack Table handles the tree → flat mapping

---

## Step 3 — Column Virtualization

### Extend `use-virtualization.ts` to add column virtualizer

```ts
const columnVirtualizer = useVirtualizer({
  horizontal: true,
  count: virtualColumnCount,   // non-pinned columns only
  getScrollElement: () => containerRef.current,
  estimateSize: (index) => leafColumns[index].getSize(),
  overscan: 3,
})
```

**Critical:** Pinned columns are **not virtualized** — they always mount. Only the scrolling (center) columns go through the column virtualizer.

**Column rendering with virtualization:**
```tsx
// In DataGridHeader and DataGridRow:

// 1. Always render left-pinned columns
{leftPinnedColumns.map(col => <HeaderCell key={col.id} column={col} />)}

// 2. Spacer for off-screen left columns
<th style={{ width: `${columnVirtualizer.range?.startIndex * avgColWidth}px` }} />

// 3. Render only visible center columns
{virtualColumns.map(vcol => {
  const col = centerColumns[vcol.index]
  return <HeaderCell key={col.id} column={col} style={{ width: col.getSize() }} />
})}

// 4. Spacer for off-screen right columns
<th style={{ width: `${rightPad}px` }} />

// 5. Always render right-pinned columns
{rightPinnedColumns.map(col => <HeaderCell key={col.id} column={col} />)}
```

This ensures total table width is always correct even when most columns are off-screen.

---

## Step 4 — Infinite Scroll Trigger

When `mode === 'infinite'`, add scroll-position checking to fetch next page:

```ts
// In use-virtualization.ts, return a scroll handler
const handleScroll = useCallback(() => {
  const { scrollTop, scrollHeight, clientHeight } = containerRef.current!
  const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - (rowHeight * overscan)
  if (scrolledToBottom && hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }
}, [hasNextPage, isFetchingNextPage, fetchNextPage, rowHeight, overscan])
```

Attach to scroll container: `<div ref={containerRef} onScroll={handleScroll}>`

---

## Step 5 — Performance Hardening

### Memoization in DataGridRow
```tsx
export const DataGridRow = memo(function DataGridRow({ row, style }: DataGridRowProps) {
  // ...
}, (prev, next) => prev.row.id === next.row.id && prev.style === next.style)
```

### Memoization in DataGridCell
```tsx
export const DataGridCell = memo(DataGridCellInner, (prev, next) => {
  return prev.cell.getValue() === next.cell.getValue()
    && prev.isEditing === next.isEditing
})
```

### Stable column definitions
Column factories return objects that don't change reference on each render.
Document in column factory JSDoc: "Define columns outside the component or wrap in useMemo."

### `useDataGrid` internal memoization
```ts
const memoizedColumns = useMemo(() => columns, [columns])
const memoizedData = useMemo(() => data, [data])
```

---

## Demo Update

Update `src/demo/demo-page.tsx`:
- Increase to `generateMockBomData(10000)` now that virtualization is in
- Enable `mode: 'tree'`
- Enable `features.virtualization: { enabled: true, rowHeight: 40 }`
- Add expand/collapse all controls
- Verify scroll performance stays smooth at 10k rows

---

## Completion Criteria

- [ ] Tree mode renders with correct indentation (20px × depth)
- [ ] Expand/collapse toggles work with animated chevron
- [ ] Multiple nesting levels work (test 5+ deep)
- [ ] Depth-tinted left border on tree rows
- [ ] `onExpand` lazy loading: spinner shows on row while children are fetching
- [ ] `onExpand` lazy loading: 3 skeleton rows appear at child indent level during fetch
- [ ] `onExpand`: children merged into tree correctly after fetch
- [ ] `_hasChildren: true` shows expand toggle even when children array is empty
- [ ] `mergeChildrenIntoTree` handles deep nesting (5+ levels)
- [ ] Demo: lazy expand with simulated 400–700ms delay per expand
- [ ] Row virtualization: only ~15–25 rows in DOM at once (verify in DevTools)
- [ ] Smooth scroll at 10,000 rows — no jank
- [ ] Total scrollable height correct (rows don't jump on scroll)
- [ ] Column virtualization: only visible columns rendered (verify in DevTools)
- [ ] Pinned columns always visible during horizontal scroll
- [ ] Pinned columns excluded from column virtualization window
- [ ] Density change updates row virtualizer `estimateSize` correctly
- [ ] `npm run typecheck` passes
- [ ] No layout shift during scroll
