# Phase 8 — Paginated + Infinite Data Modes
**Goal:** Wire up TanStack Query for the paginated and infinite table modes. Add a pagination bar for paginated mode. Make server-side sorting and filtering fully functional with the query integration.

**Depends on:** Phase 7 complete

---

## Step 1 — QueryClient Setup

### Update `src/main.tsx`
Wrap the app in `QueryClientProvider`:
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,      // 30s
      gcTime: 1000 * 60 * 5,    // 5min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
```

---

## Step 2 — Infinite Data Hook

### `src/hooks/use-infinite-data.ts`
Wraps TanStack Query `useInfiniteQuery` for the infinite table mode.

```ts
interface InfiniteDataConfig<TData> {
  queryKey: QueryKey
  queryFn: (params: { pageParam: number; sort: SortState[]; filters: FilterState[] }) => Promise<InfiniteDataResult<TData>>
  sortState: SortState[]
  filterState: FilterState[]
  enabled?: boolean
}

interface InfiniteDataResult<TData> {
  rows: TData[]
  nextPage: number | null
  total?: number
}

function useInfiniteData<TData extends GridRow>(config: InfiniteDataConfig<TData>) {
  const query = useInfiniteQuery({
    queryKey: [...config.queryKey, { sort: config.sortState, filters: config.filterState }],
    queryFn: ({ pageParam = 0 }) => config.queryFn({
      pageParam,
      sort: config.sortState,
      filters: config.filterState,
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: config.enabled !== false,
  })

  // Flatten all pages into a single rows array for TanStack Table
  const rows = useMemo(
    () => query.data?.pages.flatMap(page => page.rows) ?? [],
    [query.data]
  )

  return {
    rows,
    total: query.data?.pages[0]?.total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  }
}
```

---

## Step 3 — Paginated Data Hook

### Add paginated support to `useDataGrid`

For paginated mode, use TanStack Query `useQuery` with page param:

```ts
// Inside useDataGrid, when mode === 'paginated':
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 })

const paginatedQuery = useQuery({
  queryKey: [...queryKey, { page: pagination.pageIndex, pageSize: pagination.pageSize, sort: sortState, filters: filterState }],
  queryFn: () => queryFn({
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sort: sortState,
    filters: filterState,
  }),
  enabled: mode === 'paginated' && !!queryKey,
  placeholderData: keepPreviousData,   // don't flash skeleton on page change
})
```

TanStack Table config for paginated mode:
```ts
{
  manualPagination: true,
  rowCount: paginatedQuery.data?.total ?? -1,
  onPaginationChange: setPagination,
  state: { pagination },
}
```

---

## Step 4 — Pagination Bar

### `src/components/data-grid/data-grid-pagination.tsx`

Renders below the table for paginated mode.

```
[←] [1] [2] [3] ... [14] [→]   Page {n} of {total}   Rows per page: [25 ▼]
```

Visual:
- `flex items-center justify-between px-3 py-2 border-t border-border/60 bg-background`
- Page buttons: `ghost` variant, `size-8`, current page `default` variant
- Ellipsis: `...` for skipped pages
- Rows per page: shadcn `Select` with options `[10, 25, 50, 100]`
- Total count: `text-xs text-muted-foreground`

Accessibility:
- `aria-label="Pagination"` on nav
- `aria-current="page"` on current page button
- `aria-label="Next page"` / `aria-label="Previous page"` on arrow buttons

```tsx
function DataGridPagination() {
  const { table, paginatedQuery } = useDataGridContext()
  const { pageIndex, pageSize } = table.getState().pagination

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border/60">
      <div className="text-xs text-muted-foreground">
        {paginatedQuery?.data?.total
          ? `${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, paginatedQuery.data.total)} of ${paginatedQuery.data.total}`
          : `Page ${pageIndex + 1}`
        }
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers(pageIndex, table.getPageCount()).map((page, i) =>
          page === '...'
            ? <span key={i} className="px-1 text-muted-foreground">…</span>
            : (
              <Button
                key={page}
                variant={page === pageIndex ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8 text-xs"
                onClick={() => table.setPageIndex(page as number)}
                aria-current={page === pageIndex ? 'page' : undefined}
              >
                {(page as number) + 1}
              </Button>
            )
        )}

        <Button
          variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Rows per page</span>
        <Select value={String(pageSize)} onValueChange={v => table.setPageSize(Number(v))}>
          <SelectTrigger className="h-7 w-16 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map(n => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
```

---

## Step 5 — Demo Mock API

### `src/demo/demo-data.ts` — extend with API simulation

```ts
// Simulate paginated API
export async function fetchBomPage(params: {
  pageIndex: number
  pageSize: number
  sort: SortState[]
  filters: FilterState[]
}): Promise<{ rows: GridRow[]; total: number }> {
  await delay(400 + Math.random() * 300)

  let rows = [...ALL_MOCK_DATA]   // 10k rows pre-generated

  // Apply client-side filtering to simulate server filter
  if (params.filters.length > 0) {
    rows = applyFilters(rows, params.filters)
  }

  // Apply client-side sort to simulate server sort
  if (params.sort.length > 0) {
    rows = applySort(rows, params.sort)
  }

  const total = rows.length
  const start = params.pageIndex * params.pageSize
  return { rows: rows.slice(start, start + params.pageSize), total }
}

// Simulate infinite API
export async function fetchBomInfinitePage(params: {
  pageParam: number
  sort: SortState[]
  filters: FilterState[]
}): Promise<InfiniteDataResult<GridRow>> {
  await delay(300 + Math.random() * 200)

  const PAGE_SIZE = 50
  let rows = [...ALL_MOCK_DATA]

  if (params.filters.length > 0) rows = applyFilters(rows, params.filters)
  if (params.sort.length > 0) rows = applySort(rows, params.sort)

  const start = params.pageParam * PAGE_SIZE
  const pageRows = rows.slice(start, start + PAGE_SIZE)
  const nextPage = start + PAGE_SIZE < rows.length ? params.pageParam + 1 : null

  return { rows: pageRows, nextPage, total: rows.length }
}
```

---

## Step 6 — Demo Page — All Three Non-Tree Modes

Update `demo-page.tsx` to have tabs for each mode:

```tsx
<Tabs defaultValue="infinite">
  <TabsList>
    <TabsTrigger value="flat">Flat</TabsTrigger>
    <TabsTrigger value="paginated">Paginated</TabsTrigger>
    <TabsTrigger value="infinite">Infinite</TabsTrigger>
    <TabsTrigger value="tree">Tree (BOM)</TabsTrigger>
  </TabsList>

  <TabsContent value="flat">
    <DataGrid data={MOCK_DATA_200} columns={demoBomColumns} mode="flat" features={allFeatures} />
  </TabsContent>

  <TabsContent value="paginated">
    <DataGrid queryKey={['bom-paginated']} queryFn={fetchBomPage} columns={demoBomColumns} mode="paginated" features={allFeatures} />
  </TabsContent>

  <TabsContent value="infinite">
    <DataGrid queryKey={['bom-infinite']} queryFn={fetchBomInfinitePage} columns={demoBomColumns} mode="infinite" features={allFeatures} />
  </TabsContent>

  <TabsContent value="tree">
    <DataGrid data={MOCK_TREE_DATA} columns={demoBomColumns} mode="tree" getSubRows={r => r.children} features={allFeatures} />
  </TabsContent>
</Tabs>
```

---

## Completion Criteria

- [ ] Paginated mode: data loads on mount via useQuery
- [ ] Paginated mode: pagination bar renders correctly
- [ ] Paginated mode: next/prev page works, data changes without full skeleton flash
- [ ] Paginated mode: rows per page selector works
- [ ] Paginated mode: server sort — changing sort refetches with sort params
- [ ] Paginated mode: server filter — changing filter refetches with filter params
- [ ] Paginated mode: page resets to 0 when sort/filter changes
- [ ] Infinite mode: initial page loads
- [ ] Infinite mode: scrolling to bottom triggers `fetchNextPage`
- [ ] Infinite mode: skeleton rows appear at bottom while fetching
- [ ] Infinite mode: server sort/filter: changing either refetches from page 0
- [ ] Infinite mode: all pages flattened correctly in table
- [ ] Demo tabs: all 4 modes accessible and functional
- [ ] `keepPreviousData` prevents flash on paginated page change
- [ ] `npm run typecheck` passes
