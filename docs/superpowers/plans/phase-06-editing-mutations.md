# Phase 6 — In-Cell Editing + TanStack Query Mutations
**Goal:** Full in-cell editing with all five editor types, TanStack Query optimistic mutations, keyboard navigation, and simulated API calls in the demo.

**Depends on:** Phase 5 complete

---

## Step 1 — Editing State Hook

### `src/features/editing/use-editing.ts`
Single source of truth for which cell is being edited and the current editor value.

```ts
interface EditingState {
  rowId: string
  columnId: string
  originalValue: unknown
  currentValue: unknown
}

function useEditing(config: EditingConfig) {
  const [editingCell, setEditingCell] = useState<EditingState | null>(null)

  const startEditing = (rowId: string, columnId: string, value: unknown) => {
    setEditingCell({ rowId, columnId, originalValue: value, currentValue: value })
  }

  const updateValue = (value: unknown) => {
    setEditingCell(prev => prev ? { ...prev, currentValue: value } : null)
  }

  const cancelEditing = () => {
    setEditingCell(null)   // originalValue discarded — cell reverts automatically
  }

  const commitEditing = async () => {
    if (!editingCell) return
    const { rowId, columnId, currentValue, originalValue } = editingCell
    if (currentValue === originalValue) {
      setEditingCell(null)
      return
    }
    setEditingCell(null)
    await config.onMutate?.(rowId, columnId, currentValue)
  }

  return { editingCell, startEditing, updateValue, cancelEditing, commitEditing }
}
```

### `src/features/editing/optimistic-update.ts`
Helpers for TanStack Query optimistic mutation pattern.

```ts
// Returns mutation config with optimistic update + rollback
export function createOptimisticMutation<TData extends GridRow>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  onMutate: (rowId: string, columnId: string, value: unknown) => Promise<void>
): UseMutationOptions {
  return {
    mutationFn: ({ rowId, columnId, value }) => onMutate(rowId, columnId, value),

    onMutate: async ({ rowId, columnId, value }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousData = queryClient.getQueryData<TData[]>(queryKey)

      // Optimistically update cache
      queryClient.setQueryData<TData[]>(queryKey, (old = []) =>
        old.map(row => row.id === rowId ? { ...row, [columnId]: value } : row)
      )

      return { previousData }   // context for rollback
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  }
}
```

For **flat mode** (no queryKey), editing uses a local data copy with `useState` and simulates the optimistic pattern without TanStack Query.

---

## Step 2 — Editors

All editors share the `EditorProps<T>` interface:
```ts
interface EditorProps<T = unknown> {
  value: T
  onChange: (value: T) => void
  onSave: () => void
  onCancel: () => void
  row: GridRow
  columnId: string
  meta: ColumnMeta
}
```

All editors:
- Auto-focus on mount (`autoFocus` or `useEffect(() => ref.current?.focus(), [])`)
- `onKeyDown`: Enter → `onSave()`, Escape → `onCancel()`
- Blur → `onSave()` (configurable via `meta.saveOnBlur`)
- Match cell dimensions (same padding, font size, no layout shift)

### `src/editors/text-editor.tsx`
```tsx
// shadcn <Input type="text" />
// Styles: same cell padding, font, fully transparent bg until focused
// ring-2 ring-primary/60 ring-inset when focused
// w-full, no border (ring replaces it)
```

### `src/editors/number-editor.tsx`
```tsx
// shadcn <Input type="number" /> or controlled Input with numeric validation
// Right-aligned (text-right)
// font-mono
// Prevents non-numeric characters
// Shows formatted value when not focused, raw number when focused
```

### `src/editors/date-editor.tsx`
```tsx
// shadcn Calendar inside a Popover
// Shows formatted date as trigger
// Calendar opens below cell
// Single date selection
// "Clear" button to set null
// Closes on date select → calls onSave()
// Uses date-fns for parsing/formatting
```

### `src/editors/chip-editor.tsx`
```tsx
// Renders existing chips + an input for adding new ones
// Each chip has an X button to remove
// Input: autocomplete from meta.options (if provided)
// Autocomplete: shadcn Command/Popover dropdown
// Add chip: Enter on input text → appends to array
// Keyboard: Backspace on empty input → removes last chip
// Click outside → onSave()
```

### `src/editors/select-editor.tsx`
```tsx
// shadcn Select or Popover with option list
// Opens immediately on edit start
// Options from meta.options
// Each option shows color dot + label
// Selecting an option → calls onSave() immediately
// Escape → onCancel()
```

### `src/editors/boolean-editor.tsx`
```tsx
// shadcn Switch toggle
// Immediately saves on toggle (no Enter needed — binary state)
// Click outside → onSave() with current toggle state
// Escape → onCancel()
// Visual: centered Switch in cell, same height as row
```

### `src/editors/code-editor.tsx`
```tsx
// shadcn <Textarea /> in monospace font (not <Input> — code is multiline)
// Auto-sizes to content up to 4 lines, then scrollable
// font-mono text-[12px], same cell padding
// ring-2 ring-primary/60 ring-inset when focused
// Enter → newline (NOT save — code often multiline)
// Ctrl+Enter or Cmd+Enter → onSave()
// Escape → onCancel()
// Tab → inserts 2-space indent (preventDefault on default Tab behavior)
```

---

## Step 3 — Wire Editing into DataGridCell

```tsx
function DataGridCell({ cell, row }) {
  const { editingCell, startEditing, updateValue, cancelEditing, commitEditing } = useDataGridContext()

  const isEditing =
    editingCell?.rowId === row.id &&
    editingCell?.columnId === cell.column.id

  const isEditable = cell.column.columnDef.meta?.editable

  if (isEditing) {
    const EditorComponent = getEditor(cell.column.columnDef.meta?.type, cell.column.columnDef.meta?.renderEditor)
    return (
      <TableCell className={cn(cellBaseStyles, 'p-0 ring-2 ring-primary/60 ring-inset')}>
        <EditorComponent
          value={editingCell.currentValue}
          onChange={updateValue}
          onSave={commitEditing}
          onCancel={cancelEditing}
          row={row.original}
          columnId={cell.column.id}
          meta={cell.column.columnDef.meta!}
        />
      </TableCell>
    )
  }

  return (
    <TableCell
      className={cn(cellBaseStyles, isEditable && 'cursor-text')}
      onDoubleClick={() => {
        if (isEditable) startEditing(row.id, cell.column.id, cell.getValue())
      }}
    >
      {/* normal cell render */}
    </TableCell>
  )
}
```

---

## Step 4 — Mutation State Visual

When a cell's row is being mutated (optimistic update in flight):
- Row: `opacity-70 pointer-events-none`
- Cell that was edited: shimmer overlay `after:absolute after:inset-0 after:bg-primary/5 after:animate-pulse`

When mutation errors:
- Row briefly flashes red: `animate-[flash-error_0.3s_ease]`
- Toast notification via shadcn `Sonner` or custom toast

```css
@keyframes flash-error {
  0%, 100% { background: transparent; }
  50% { background: oklch(var(--destructive) / 0.1); }
}
```

---

## Step 5 — Keyboard Navigation Between Cells

Beyond editor-level keyboard shortcuts, add grid-level keyboard navigation:

When not editing:
- `Tab` → move focus to next cell (right)
- `Shift+Tab` → previous cell (left)
- `ArrowDown` → next row same column
- `ArrowUp` → previous row same column
- `Enter` or `F2` → start editing focused cell
- `Delete` or `Backspace` → clear cell value (if editable)

Focus tracking:
```ts
const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null)
```

Each `<td>` gets `tabIndex={isFocused ? 0 : -1}` and `onFocus={() => setFocusedCell(...)}`

Focused cell visual: `ring-1 ring-primary/40 ring-inset outline-none`

---

## Step 6 — Demo Mutations

### `src/demo/demo-data.ts`
```ts
// Simulated mutation with fake delay
export async function simulateUpdateCell(
  rowId: string,
  columnId: string,
  value: unknown
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400))
  // 10% chance of error to demonstrate rollback
  if (Math.random() < 0.1) {
    throw new Error(`Failed to update ${columnId}`)
  }
}
```

### Wire into demo
```ts
features: {
  editing: {
    enabled: true,
    onMutate: simulateUpdateCell,
    onError: (error) => toast.error(String(error)),
  }
}
```

---

## Completion Criteria

- [ ] Double-click a string cell → text input appears, focused, same visual size
- [ ] Double-click a number cell → numeric input, right-aligned
- [ ] Double-click a date cell → Calendar popover opens
- [ ] Double-click a multi-value cell → chip editor with existing chips + input
- [ ] Double-click a select cell → dropdown opens immediately
- [ ] Enter saves, Escape cancels (value reverts)
- [ ] Blur saves (click outside editor)
- [ ] Optimistic update: value changes immediately in UI
- [ ] Mutation pending: row shows `opacity-70`
- [ ] Mutation error (10% chance): value reverts, error flash animation on row
- [ ] Keyboard navigation: Tab/Arrow keys move between cells
- [ ] `Enter`/`F2` on focused cell starts editing
- [ ] Non-editable cells: `cursor-default`, double-click does nothing
- [ ] `npm run typecheck` passes
