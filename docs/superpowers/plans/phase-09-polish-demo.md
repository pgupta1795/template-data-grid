# Phase 9 — Polish, Demo, Accessibility & Final Review
**Goal:** Final polish pass — accessibility audit, responsive behavior, dark mode verification, animation refinements, demo page completion, and documentation comments across all public APIs.

**Depends on:** Phase 8 complete

---

## Step 1 — Accessibility Audit

Walk through every interactive element and verify:

### Table semantics
- [ ] `<table role="grid">` with `aria-label` or `aria-labelledby`
- [ ] `<th scope="col">` on all header cells
- [ ] `<th scope="row">` on row header cells (tree mode first cell)
- [ ] `aria-sort="ascending|descending|none"` on sortable headers
- [ ] `aria-selected="true|false"` on selectable rows
- [ ] `aria-expanded="true|false"` on tree rows
- [ ] `aria-colindex` and `aria-rowindex` on virtualized cells (required when rows/cols are out of DOM)
- [ ] `aria-rowcount` and `aria-colcount` on `<table>` for virtualized grids

### Keyboard navigation
- [ ] Tab into grid → lands on first cell
- [ ] Arrow keys navigate between cells
- [ ] Enter / F2 → start editing focused cell
- [ ] Escape → cancel editing, return focus to cell
- [ ] Space → toggle row selection on focused row
- [ ] Shift+Space → extend selection

### Focus management
- [ ] After edit save/cancel → focus returns to the `<td>`
- [ ] After row expand/collapse → focus stays on toggle button
- [ ] Modal/popover close → focus returns to trigger element

### Editors
- [ ] All editors have visible focus ring
- [ ] DateEditor Calendar navigable by keyboard
- [ ] ChipEditor: Backspace removes last chip, Tab moves to next interactive element
- [ ] SelectEditor: keyboard navigable dropdown

### ARIA live regions
- [ ] `aria-live="polite"` region announces mutation success/error
- [ ] Filter changes announce row count: "Showing 47 of 10,000 rows"

---

## Step 2 — Dark Mode Verification

Verify every component in dark mode:

- [ ] Header: `bg-muted/40` readable in dark
- [ ] Row hover: `bg-muted/30` visible in dark
- [ ] Selected row: `bg-primary/6 border-primary` visible in dark
- [ ] Editing ring: `ring-primary/60` visible in dark
- [ ] Pinned column shadow: visible in dark (shadow color is neutral)
- [ ] Skeleton shimmer: `bg-muted/60` visible in dark
- [ ] Column type icon tints: visible in dark without being harsh
- [ ] Toolbar frosted glass: `bg-background/80 backdrop-blur-md` works in dark
- [ ] Popover backgrounds: correct `bg-popover` token
- [ ] All Badge chip colors: check each color in dark mode

---

## Step 3 — Animation Refinements

### Row reveal (flat mode, initial load)
Stagger rows appearing after skeleton transitions out:
```css
@keyframes row-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
Apply to first 20 rows only (above fold): `animation: row-in 0.15s ease forwards`
Stagger: `animation-delay: {index * 20}ms`
Respects `prefers-reduced-motion`: skip animation.

### Skeleton → data transition
Crossfade between skeleton state and real data:
```tsx
<AnimatePresence mode="wait">
  {isInitialLoading
    ? <DataGridSkeleton key="skeleton" />
    : <tbody key="data" className="animate-in fade-in duration-200">...</tbody>
  }
</AnimatePresence>
```
Use shadcn `animate-in` (tw-animate-css already installed).

### Column filter popover
- Open: `animate-in zoom-in-95 slide-in-from-top-2 duration-150`
- Close: `animate-out zoom-out-95 slide-out-to-top-2 duration-100`

### Selected rows bar
- Enter: `animate-in slide-in-from-top-2 duration-200`
- Exit: `animate-out slide-out-to-top-2 duration-150`

### Sort indicator
- Direction change: icon swaps with `transition-all duration-150`

### Tree row expand
- Chevron rotation: `transition-transform duration-150 ease-out`

### Resize handle
- Width transition: `transition-[width] duration-100`

---

## Step 4 — Performance Final Check

- [ ] Run demo with 10,000 rows in tree mode, expand root level — no jank
- [ ] Measure DOM nodes in virtualized state — should be ~30–50 rows max
- [ ] Column virtualization: horizontal scroll smooth with 20+ columns
- [ ] React DevTools Profiler: no unnecessary rerenders on row hover
- [ ] `DataGridRow` and `DataGridCell` memo working correctly (no re-render on unrelated state change)
- [ ] Verify stable column definition (no new array reference on each render in demo)

---

## Step 5 — Demo Page Polish

### Full-featured demo `src/demo/demo-page.tsx`

Add header and controls above the tabs:
```tsx
<div className="min-h-screen bg-background p-6">
  <div className="max-w-[1600px] mx-auto space-y-4">
    {/* Header */}
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Data Grid</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Production-grade spreadsheet grid · 10,000 rows · TanStack Table + Virtual + Query
      </p>
    </div>

    {/* Feature pills */}
    <div className="flex flex-wrap gap-1.5">
      {['Tree / BOM', 'Virtualized', 'Inline editing', 'Server-side sort', 'Server-side filter',
        'Fuzzy search', 'Column pinning', 'Row grouping', 'Faceting', 'CSV export'].map(f => (
        <Badge key={f} variant="secondary" className="text-[11px]">{f}</Badge>
      ))}
    </div>

    {/* Tabs */}
    <Tabs defaultValue="tree">...all 4 mode tabs...</Tabs>
  </div>
</div>
```

### Tree mode demo — BOM data
- Root level: 20 assemblies (e.g. "Engine Assembly", "Chassis Assembly")
- Each has 5–15 sub-components
- Sub-components have 2–8 parts
- Parts have 0–3 sub-parts
- Total: ~2,000 nodes (demonstrates deep hierarchy without overwhelming)

### All features enabled on demo
```ts
const allFeatures: GridFeaturesConfig = {
  sorting:        { enabled: true, mode: 'client' },
  filtering:      { enabled: true, mode: 'client', fuzzy: true, filterRow: false, faceting: true },
  grouping:       { enabled: true },
  selection:      { enabled: true, mode: 'multi' },
  pinning:        { columns: true, rows: true },
  editing:        { enabled: true, onMutate: simulateUpdateCell, onError: showErrorToast },
  virtualization: { enabled: true, rowHeight: 40, overscan: 5 },
  export:         { csv: true },
  loading:        { enabled: true, skeletonRows: 8, showHeaderSkeleton: true },
}
```

---

## Step 6 — JSDoc Comments on Public APIs

Add JSDoc to all public exports:

- `DataGrid` component props
- All column factory functions (`stringColumn`, `numberColumn`, etc.)
- `useDataGrid` hook return shape
- `ColumnMeta` interface fields
- `GridFeaturesConfig` all sub-configs
- `GridSlots` all slot definitions

Example:
```ts
/**
 * Creates a string column definition.
 *
 * @param options.accessorKey - The key of the data field to display
 * @param options.header - Column header label
 * @param options.editable - Enable double-click inline editing (default: false)
 * @param options.copyable - Show copy button on cell hover (default: false)
 *
 * @example
 * stringColumn({ accessorKey: 'name', header: 'Name', editable: true, copyable: true })
 */
export function stringColumn(options: StringColumnOptions): GridColumnDef { ... }
```

---

## Step 7 — Public Exports Barrel

### `src/index.ts` (library root export)
```ts
// Components
export { DataGrid } from './components/data-grid'

// Column factories
export { stringColumn, numberColumn, dateColumn, multiValueColumn, selectColumn } from './columns'

// Hooks
export { useDataGrid } from './hooks/use-data-grid'

// Types
export type {
  GridRow,
  GridMode,
  GridDensity,
  GridFeaturesConfig,
  GridSlots,
  GridColumnDef,
  ColumnMeta,
  ColumnType,
  SelectOption,
  FilterState,
  SortState,
  EditorProps,
} from './types'
```

---

## Step 8 — Final Checklist

### Functionality
- [ ] All 4 table modes work end-to-end
- [ ] All 5 column types render and edit correctly
- [ ] Client-side sort, filter, fuzzy search work
- [ ] Server-side sort, filter wired to demo mock API
- [ ] Column visibility toggle works
- [ ] Column reorder (DnD) works
- [ ] Column resize works
- [ ] Column pinning (left/right) works
- [ ] Row pinning (top/bottom) works
- [ ] Row selection (multi) with action bar
- [ ] Row grouping with aggregation
- [ ] Tree expand/collapse with BOM data
- [ ] Skeleton loading (initial, refetch, infinite append)
- [ ] All editors work with optimistic mutations + rollback
- [ ] CSV export downloads correctly
- [ ] Dark mode verified
- [ ] All slots overridable

### Code Quality
- [ ] `npm run typecheck` — zero errors
- [ ] `npm run lint` — zero errors
- [ ] No `any` types except intentional boundary points (documented)
- [ ] All public APIs have JSDoc
- [ ] No unused imports or variables
- [ ] Column factories callable in 1 line for simple cases

### Performance
- [ ] 10k row virtualized flat: smooth scroll
- [ ] 10k row tree (expanded 2 levels): smooth scroll
- [ ] Column virtualization: 30+ columns scrolls smoothly
- [ ] No unnecessary re-renders verified
