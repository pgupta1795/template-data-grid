# Phase 7 — Toolbar + Skeleton Loading
**Goal:** Build the full configurable toolbar with all controls, the skeleton loading system (initial load + refetch + infinite append), and the selected rows contextual action bar.

**Depends on:** Phase 6 complete

---

## Step 1 — Loading State Hook

### `src/features/loading/use-loading-state.ts`
Derives loading states from TanStack Query status and mutation status.

```ts
function useLoadingState(config: LoadingConfig) {
  // Composed from external flags passed in
  return {
    isInitialLoading: boolean,     // first load — show full skeleton
    isRefetching: boolean,         // background refetch — subtle indicator
    isMutating: boolean,           // optimistic update in flight
    isFetchingNextPage: boolean,   // infinite mode — appending rows
  }
}
```

For flat mode (no query), `isInitialLoading` is derived from a brief artificial delay on first mount if `features.loading.enabled`.

---

## Step 2 — Skeleton Components

### `src/features/loading/skeleton-cell.tsx`
Single shimmer cell bar.

```tsx
function SkeletonCell({ width = '60%', height = '13px' }) {
  return (
    <td className="px-[var(--cell-px)] py-[var(--cell-py)] border-r border-border/30 border-b border-border/50">
      <div
        className="rounded-sm bg-muted/60 animate-pulse motion-reduce:animate-none"
        style={{ width, height }}
      />
    </td>
  )
}
```

Width varies per column type:
- string: `55–70%` (randomized from seed for stable widths)
- number: `40–50%` (right side, mimics right-aligned numbers)
- date: `65%` (fixed — dates are predictable length)
- multi-value: `75%`
- select: `45%`

Width seeded from column index so skeletons don't flicker between renders.

### `src/features/loading/skeleton-header.tsx`
Single shimmer header bar.

```tsx
function SkeletonHeader({ column }) {
  return (
    <th className={headerCellBaseStyles}>
      <div className="flex items-center gap-1.5">
        {/* Type icon placeholder */}
        <div className="w-3 h-3 rounded-sm bg-muted/60 animate-pulse motion-reduce:animate-none" />
        {/* Label placeholder */}
        <div
          className="h-[11px] rounded-sm bg-muted/60 animate-pulse motion-reduce:animate-none"
          style={{ width: `${50 + (column.index % 3) * 15}%` }}
        />
      </div>
    </th>
  )
}
```

### `src/features/loading/skeleton-header-group.tsx`
Shimmer bar for column group header row.

```tsx
function SkeletonHeaderGroup({ colSpan }) {
  return (
    <th colSpan={colSpan} className="px-3 py-2 border-r border-border/30">
      <div className="h-4 w-3/5 rounded-sm bg-muted/60 animate-pulse motion-reduce:animate-none mx-auto" />
    </th>
  )
}
```

### `src/components/data-grid/data-grid-skeleton.tsx`
Full table skeleton — renders skeleton header groups + skeleton header row + N skeleton body rows.

```tsx
function DataGridSkeleton({ columns, skeletonRows = 8, showHeaderSkeleton = true }) {
  return (
    <>
      {showHeaderSkeleton && (
        <thead>
          {hasHeaderGroups && (
            <tr className="bg-muted/40 border-b border-border">
              {headerGroups.map(g => <SkeletonHeaderGroup key={g.id} colSpan={g.colSpan} />)}
            </tr>
          )}
          <tr className="bg-muted/40 border-b-2 border-border">
            {columns.map((col, i) => <SkeletonHeader key={col.id} column={{ ...col, index: i }} />)}
          </tr>
        </thead>
      )}
      <tbody>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <tr key={i} className="border-b border-border/50">
            {columns.map((col, j) => (
              <SkeletonCell key={col.id} width={getSkeletonWidth(col.meta?.type, j)} />
            ))}
          </tr>
        ))}
      </tbody>
    </>
  )
}
```

### `src/components/data-grid/data-grid-row-skeleton.tsx`
Single skeleton row appended at bottom during infinite scroll fetch.

```tsx
function DataGridRowSkeleton({ columns }) {
  return (
    <tr className="border-b border-border/50">
      {columns.map((col, i) => (
        <SkeletonCell key={col.id} width={getSkeletonWidth(col.meta?.type, i)} />
      ))}
    </tr>
  )
}
```

Show 3 of these at the bottom when `isFetchingNextPage`.

---

## Step 3 — Toolbar

### `src/components/data-grid/data-grid-toolbar.tsx`

Full toolbar layout:
```
[slots.toolbarLeft] [SearchInput] ─────────── [ColumnVisibility] [Density] [ExpandAll*] [Refresh] [ExportCSV] [AddRow*] [slots.toolbarRight]
```
*tree mode only / conditional

**Container styles:**
```
sticky top-0 z-10
flex items-center gap-2 px-3 h-12
bg-background/80 backdrop-blur-md
border-b border-border/60
```

**Full toolbar layout:**
```
[slots.toolbarLeft] [SearchInput] ─────────── [ActiveFilterCount] [ResetFilters*] [ColumnVisibility] [Density] [ExpandAll*] [Refresh] [ExportCSV] [AddRow*] [slots.toolbarRight]
```
*conditional / only shown when relevant

**Controls:**

#### Search Input
```tsx
<div className="relative">
  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
  <Input
    placeholder="Search..."
    value={globalFilter}
    onChange={e => setGlobalFilter(e.target.value)}
    className="h-8 w-56 pl-8 text-sm transition-[width] duration-200 focus:w-72"
  />
  {globalFilter && (
    <button onClick={() => setGlobalFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2">
      <X className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  )}
</div>
```

#### Active Filters Indicator + Reset Button
Only shown when any filters are active (column filters OR global search).

```tsx
{hasActiveFilters && (
  <div className="flex items-center gap-1">
    {/* Count badge */}
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <ListFilter className="h-3 w-3 text-primary" />
      <span className="text-primary font-medium">{activeFilterCount}</span>
      <span>filter{activeFilterCount !== 1 ? 's' : ''}</span>
    </span>

    {/* Reset button */}
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
      onClick={() => clearAllFilters(table)}
    >
      <X className="h-3 w-3" />
      Reset
    </Button>
  </div>
)}
```

- `activeFilterCount` = number of columns with active filters + (globalFilter ? 1 : 0)
- Uses `clearAllFilters` from `grid-utils.ts` which calls `table.resetColumnFilters()` + `table.resetGlobalFilter()`
- Animates in/out: `animate-in fade-in duration-150` / `animate-out fade-out duration-100`

#### Column Visibility Toggle
```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="sm" className="h-8 gap-1.5">
      <Columns3 className="h-3.5 w-3.5" />
      <span className="text-xs">Columns</span>
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-48 p-2" align="end">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-2 pb-1">
      Toggle columns
    </div>
    {table.getAllLeafColumns()
      .filter(col => col.columnDef.enableHiding !== false)
      .map(col => (
        <label key={col.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 cursor-pointer">
          <Checkbox
            checked={col.getIsVisible()}
            onCheckedChange={col.toggleVisibility}
          />
          <span className="text-sm">{getColumnHeader(col)}</span>
        </label>
      ))
    }
  </PopoverContent>
</Popover>
```

#### Density Control
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <AlignJustify className="h-3.5 w-3.5" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
      Density
    </DropdownMenuLabel>
    {(['compact', 'normal', 'comfortable'] as GridDensity[]).map(d => (
      <DropdownMenuItem key={d} onClick={() => setDensity(d)}>
        {density === d && <Check className="h-3.5 w-3.5 mr-2" />}
        <span className="capitalize">{d}</span>
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

#### Expand/Collapse All (tree mode only)
```tsx
{mode === 'tree' && (
  <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={toggleExpandAll}>
    {isAllExpanded
      ? <><ChevronsUpDown className="h-3.5 w-3.5" /><span className="text-xs">Collapse</span></>
      : <><ChevronsUpDown className="h-3.5 w-3.5" /><span className="text-xs">Expand all</span></>
    }
  </Button>
)}
```

#### Refresh Button
```tsx
<Button
  variant="ghost" size="icon" className="h-8 w-8"
  onClick={() => queryClient.invalidateQueries({ queryKey })}
  disabled={isRefetching}
>
  <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
</Button>
```

#### Export CSV
```tsx
<Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={handleExport}>
  <Download className="h-3.5 w-3.5" />
  <span className="text-xs">Export</span>
</Button>
```

#### Add Row (optional)
```tsx
{features.addRow && (
  <Button size="sm" className="h-8 gap-1.5 ml-auto">
    <Plus className="h-3.5 w-3.5" />
    <span className="text-xs">Add row</span>
  </Button>
)}
```

---

## Step 4 — Selected Rows Action Bar

Slides down from above toolbar when rows are selected.

```tsx
{selectedRows.length > 0 && (
  <div className="
    flex items-center gap-2 px-3 h-10
    bg-primary/5 border-b border-primary/20
    text-sm
    animate-in slide-in-from-top-2 duration-200
  ">
    <Check className="h-3.5 w-3.5 text-primary" />
    <span className="font-medium text-primary">{selectedRows.length} rows selected</span>
    <Separator orientation="vertical" className="h-4 mx-1" />

    {/* Slot for custom actions */}
    {slots?.selectionActions?.(selectedRows)}

    {/* Default: export selected */}
    <Button variant="ghost" size="sm" className="h-7 gap-1.5" onClick={() => exportSelected(selectedRows)}>
      <Download className="h-3.5 w-3.5" />
      <span className="text-xs">Export selected</span>
    </Button>

    <Button
      variant="ghost" size="sm" className="h-7 gap-1.5 ml-auto"
      onClick={clearSelection}
    >
      <X className="h-3.5 w-3.5" />
      <span className="text-xs">Clear</span>
    </Button>
  </div>
)}
```

---

## Step 5 — Wire Slots

If `slots.toolbar` is provided, render it instead of default toolbar:
```tsx
const ToolbarComponent = slots?.toolbar ?? DataGridToolbar
return <ToolbarComponent {...toolbarProps} />
```

`slots.toolbarLeft` and `slots.toolbarRight` are rendered inside the default toolbar layout.

---

## Completion Criteria

- [ ] Toolbar renders with all controls
- [ ] Search input expands on focus (width CSS transition)
- [ ] Search clears with X button when text present
- [ ] Active filter count badge appears when any filters active
- [ ] Reset button appears only when filters are active
- [ ] Reset button clears ALL column filters AND global search in one click
- [ ] Reset button animates in/out smoothly
- [ ] Column visibility popover shows all hideable columns with checkboxes
- [ ] Toggling column visibility hides/shows it instantly
- [ ] Density dropdown changes row height + padding for all three variants
- [ ] Expand/Collapse all works in tree mode
- [ ] Refresh button spins while refetching
- [ ] Export CSV downloads valid file with visible columns only
- [ ] Selected rows bar appears/disappears with slide animation
- [ ] Export selected uses only selected row data
- [ ] Clear selection button works
- [ ] `slots.toolbar` override replaces entire toolbar
- [ ] `slots.toolbarLeft/Right` inject correctly into default toolbar
- [ ] Initial load shows full skeleton (headers + N rows)
- [ ] Skeleton widths vary per column type
- [ ] Skeleton header shows type icon + label shimmer
- [ ] `animate-pulse` not shown when `prefers-reduced-motion` is set
- [ ] Infinite scroll append shows 3 skeleton rows at bottom
- [ ] `npm run typecheck` passes
