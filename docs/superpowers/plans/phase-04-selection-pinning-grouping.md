# Phase 4 — Selection, Pinning, Grouping, Row Pinning
**Goal:** Add row selection (single/multi with checkboxes), column pinning (left/right with shadow), row pinning (sticky top/bottom), and row grouping with expand/collapse.

**Depends on:** Phase 3 complete

---

## Step 1 — Row Selection

### `src/features/selection/use-selection.ts`
Manages TanStack Table row selection state.

```ts
{
  enableRowSelection: true,
  enableMultiRowSelection: mode === 'multi',
  onRowSelectionChange: setRowSelection,
  getRowId: (row) => row.id,
}
```

Returns:
- `rowSelection` state
- `selectedRows: GridRow[]` — actual row data for selected rows
- `isAllSelected`, `isSomeSelected`
- `toggleAll()`, `toggleRow(rowId)`
- `clearSelection()`
- Calls `onSelectionChange(selectedRows)` whenever selection changes

### `src/features/selection/selection-cell.tsx`
Renders the checkbox column header + cell.

**Header checkbox:**
- `Checkbox` (shadcn) with indeterminate state when some rows selected
- `aria-label="Select all rows"`

**Row checkbox:**
- `Checkbox` (shadcn)
- `aria-label="Select row"`
- `stopPropagation` on click to prevent row click handler

**Selection column definition** (auto-injected when `features.selection.enabled`):
```ts
{
  id: '__select__',
  size: 40,
  maxSize: 40,
  enableSorting: false,
  enableResizing: false,
  enableHiding: false,
  header: ({ table }) => <SelectAllCheckbox table={table} />,
  cell: ({ row }) => <SelectRowCheckbox row={row} />,
}
```

### Selection visual on rows
`DataGridRow` reads `row.getIsSelected()`:
- Selected: `bg-primary/6 border-l-[2px] border-l-primary`
- Checkbox column: `w-10 shrink-0`

---

## Step 2 — Column Pinning

### `src/features/pinning/use-column-pinning.ts`
Manages TanStack Table column pinning state.

```ts
{
  enableColumnPinning: true,
  onColumnPinningChange: setColumnPinning,
}
```

Returns:
- `columnPinning` state
- `pinColumnLeft(columnId)`, `pinColumnRight(columnId)`, `unpinColumn(columnId)`
- `isPinned(columnId): 'left' | 'right' | false`
- `leftPinnedColumns`, `rightPinnedColumns` — ordered arrays

**CSS approach for pinned columns:**
- Pinned columns: `position: sticky; left: {offset}px` or `right: {offset}px`
- `z-index: 1` to stay above scrolling cells
- Offset calculated by summing widths of previous pinned columns

### `src/features/pinning/pinned-shadow.tsx`
Applies the pinned column edge shadow:

```ts
// Last left-pinned column cell and header
'shadow-[inset_-1px_0_0_hsl(var(--border)),_4px_0_8px_-2px_oklch(0_0_0/0.06)]'

// First right-pinned column cell and header
'shadow-[inset_1px_0_0_hsl(var(--border)),_-4px_0_8px_-2px_oklch(0_0_0/0.06)]'
```

Returns a `getPinnedShadowClass(column, pinnedColumns)` helper function.

### Header pin action
Add pin option to header action menu (three-dot or right-click context menu in Phase 7 toolbar section):
- "Pin left" → `pinColumnLeft(columnId)`
- "Pin right" → `pinColumnRight(columnId)`
- "Unpin" → `unpinColumn(columnId)` (shown when already pinned)
- `Pin` icon (lucide) indicates pinned state in header

### Wire into DataGridHeader + DataGridCell
- Apply `sticky left-{n}px` or `right-{n}px` to pinned `<th>` and `<td>`
- Apply pinned shadow class to edge columns
- `bg-background` on pinned cells so they cover scrolling cells

---

## Step 3 — Row Pinning

### `src/features/pinning/use-row-pinning.ts`
Manages TanStack Table row pinning state.

```ts
{
  enableRowPinning: true,
  keepPinnedRows: true,
  onRowPinningChange: setRowPinning,
}
```

Returns:
- `pinRowTop(rowId)`, `pinRowBottom(rowId)`, `unpinRow(rowId)`
- `isRowPinned(rowId): 'top' | 'bottom' | false`

**Pinned row rendering:**
- Top pinned rows: rendered before virtual rows, `position: sticky top-{headerHeight}px`
- Bottom pinned rows: rendered after virtual rows, `position: sticky bottom-0`
- Style: `bg-muted/60` + `shadow-sm` to distinguish from scrolling rows

**Wire into DataGrid compositor:**
```tsx
{table.getTopRows().map(row => <DataGridRow row={row} pinned="top" />)}
{/* virtual rows */}
{table.getBottomRows().map(row => <DataGridRow row={row} pinned="bottom" />)}
```

---

## Step 4 — Row Grouping

### `src/features/grouping/use-grouping.ts`
Manages TanStack Table grouping state.

```ts
{
  enableGrouping: true,
  groupedColumnMode: 'reorder',   // grouped columns move to front
  onGroupingChange: setGrouping,
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  autoResetExpanded: false,
}
```

Returns:
- `grouping` state (array of column IDs)
- `groupBy(columnId)`, `removeGroup(columnId)`, `clearGrouping()`
- `isGrouped(columnId)`
- `groupingState` — current grouping columns

**Active grouping indicator in header:**
- When column is grouped: small `Group` icon (lucide `Layers`) appears in header beside label
- Clicking it removes the grouping

### `src/features/grouping/group-row.tsx`
Renders a group header row.

Visual:
```
[ChevronRight/Down] [ColumnIcon] ColumnName: GroupValue  (N items)
```

Styles:
- `bg-muted/50 border-b border-border`
- Label: `text-[12px] font-medium`
- Count badge: `text-[11px] text-muted-foreground` in parentheses
- Expand icon: `ChevronRight` rotates to `ChevronDown` with `transition-transform duration-150`
- Indent: no indent for group rows (they always full-width)
- Aggregation values shown in corresponding columns (TanStack Table aggregation)

### Wire into DataGridRow
```tsx
if (row.getIsGrouped()) {
  return <GroupRow row={row} />
}
return <StandardRow row={row} />
```

---

## Step 5 — Column Ordering (DnD)

### Install: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` (done in Phase 1)

### Wire TanStack Table column ordering
```ts
{
  onColumnOrderChange: setColumnOrder,
}
```

### `src/features/ordering/use-column-ordering.ts`
Returns:
- `columnOrder` state
- `reorderColumn(fromId, toId)` — updates column order array
- DnD sensors config

### DnD integration in DataGridHeader
- Wrap `<thead>` in `<DndContext>` with `SortableContext`
- Each `<th>` wrapped in `useSortable({ id: column.id })`
- Drag handle: `GripVertical` icon (lucide, 12px) shown on header hover
- While dragging: dragged header `opacity-50`, drop target shows `bg-primary/10` indicator
- `onDragEnd`: call `reorderColumn(active.id, over.id)`

---

## Completion Criteria

- [ ] Row selection checkboxes appear when `features.selection.enabled: true`
- [ ] Select all checkbox works with indeterminate state
- [ ] Selected rows highlighted with left accent border
- [ ] `onSelectionChange` called with selected row data
- [ ] Column pinning: left/right pin works visually (sticky positioning)
- [ ] Pinned column shadow visible at edge
- [ ] Row pinning: top/bottom rows stay sticky during scroll
- [ ] Row grouping: columns can be grouped, group rows render with count
- [ ] Group rows expand/collapse with animated chevron
- [ ] Aggregation values shown in grouped rows (sum for numbers)
- [ ] Column DnD reorder: drag headers to reorder columns
- [ ] DnD drag ghost shows `opacity-50` on source
- [ ] `npm run typecheck` passes
