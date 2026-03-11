import React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getGroupedRowModel,
  getExpandedRowModel,
} from "@tanstack/react-table"
import type { Table, FilterFnOption } from "@tanstack/react-table"
import type {
  GridRow,
  GridDensity,
  GridMode,
  GridFeaturesConfig,
} from "@/types/grid-types"
import type { GridColumnDef, ColumnType } from "@/types/column-types"
import type { DataGridContextValue } from "@/components/data-grid/data-grid-context"
import { useSorting } from "@/features/sorting/use-sorting"
import { useFiltering } from "@/features/filtering/use-filtering"
import { useColumnResize } from "./use-column-resize"
import { filterFnForType } from "@/features/filtering/filter-functions"
import { useSelection } from "@/features/selection/use-selection"
import { selectionColumnDef } from "@/features/selection/selection-cell"
import { useColumnPinning } from "@/features/pinning/use-column-pinning"
import { useRowPinning } from "@/features/pinning/use-row-pinning"
import { useGrouping } from "@/features/grouping/use-grouping"
import { useColumnOrdering } from "@/features/ordering/use-column-ordering"
import { useLazyExpand } from "@/features/tree/use-lazy-expand"
import { expandColumnDef } from "@/features/tree/expand-toggle"
import {
  useRowVirtualizer,
  useColVirtualizer,
} from "@/features/virtualization/use-virtualization"
import { useEditing } from "@/features/editing/use-editing"

export interface DataGridConfig<TData extends GridRow> {
  data: TData[]
  columns: GridColumnDef<TData>[]
  mode?: GridMode
  density?: GridDensity
  features?: GridFeaturesConfig
  getSubRows?: (row: TData) => TData[] | undefined
  onExpand?: (row: GridRow) => Promise<GridRow[]> | void
}

export function useDataGrid<TData extends GridRow>(
  config: DataGridConfig<TData>,
): DataGridContextValue {
  const {
    data,
    columns,
    density: initialDensity = "normal",
    features,
    mode,
  } = config

  const [density, setDensity] = React.useState<GridDensity>(initialDensity)
  const [columnVisibility, setColumnVisibility] =
    React.useState<Record<string, boolean>>({})
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  // Internal data state — allows lazy tree expand to merge children
  const [internalData, setInternalData] = React.useState<TData[]>(data)
  React.useEffect(() => {
    setInternalData(data as TData[])
  }, [data])

  // Feature hooks
  const sortingHook = useSorting(features?.sorting)
  const filteringHook = useFiltering(features?.filtering)
  const resizeHook = useColumnResize()
  const selectionHook = useSelection(features?.selection)
  const columnPinningHook = useColumnPinning(features?.columnPinning)
  const rowPinningHook = useRowPinning(features?.rowPinning)
  const groupingHook = useGrouping(features?.grouping)
  const orderingHook = useColumnOrdering()

  // Editing
  const editingHook = useEditing(features?.editing)

  // Lazy tree expand
  const { loadingRowIds, handleExpand } = useLazyExpand({
    onExpand: config.onExpand,
    setData: setInternalData as React.Dispatch<
      React.SetStateAction<GridRow[]>
    >,
  })

  // Post-process columns: add filterFn + aggregationFn per column type
  const processedColumns = React.useMemo(
    () =>
      columns.map((col) => {
        const type = col.meta?.type as ColumnType | undefined
        const fn = filterFnForType(type)
        return {
          ...col,
          ...(fn ? { filterFn: fn as FilterFnOption<TData> } : {}),
          ...(type === "number" ? { aggregationFn: "sum" as const } : {}),
        }
      }),
    [columns],
  )

  // Inject special columns
  const finalColumns = React.useMemo(() => {
    let cols: GridColumnDef<TData>[] = processedColumns
    if (features?.selection?.enabled) {
      cols = [selectionColumnDef as GridColumnDef<TData>, ...cols]
    }
    if (mode === "tree") {
      cols = [expandColumnDef as GridColumnDef<TData>, ...cols]
    }
    return cols
  }, [features?.selection?.enabled, mode, processedColumns])

  // Destructure all table options from hooks
  const {
    manualSorting,
    onSortingChange,
    enableMultiSort,
    sortDescFirst,
    manualFiltering,
    filterFns,
    globalFilterFn,
    onColumnFiltersChange,
    onGlobalFilterChange,
    columnResizeMode,
    enableColumnResizing,
    columnResizeDirection,
    enableRowSelection,
    enableMultiRowSelection,
    onRowSelectionChange,
    enableColumnPinning,
    onColumnPinningChange,
    enableRowPinning,
    keepPinnedRows,
    onRowPinningChange,
    enableGrouping,
    groupedColumnMode,
    onGroupingChange,
    onExpandedChange,
    autoResetExpanded,
    onColumnOrderChange,
  } = {
    ...sortingHook.tableOptions,
    ...filteringHook.tableOptions,
    ...resizeHook.tableOptions,
    ...selectionHook.tableOptions,
    ...columnPinningHook.tableOptions,
    ...rowPinningHook.tableOptions,
    ...groupingHook.tableOptions,
    ...orderingHook.tableOptions,
  }

  // Stable references for column and data — define outside component or wrap in useMemo
  const memoizedColumns = React.useMemo(() => finalColumns, [finalColumns])
  const memoizedData = React.useMemo(() => internalData, [internalData])

  const table = useReactTable<TData>({
    data: memoizedData,
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    // Tree mode: teach TanStack Table how to traverse child rows
    ...(mode === "tree"
      ? {
          getSubRows: (row: TData) =>
            config.getSubRows
              ? config.getSubRows(row)
              : (row.children as TData[] | undefined),
          enableExpanding: true,
          autoResetExpanded: false,
        }
      : {}),
    state: {
      sorting: sortingHook.sortingState,
      columnFilters: filteringHook.columnFilters,
      globalFilter: filteringHook.globalFilter,
      columnVisibility,
      rowSelection: selectionHook.rowSelection,
      columnPinning: columnPinningHook.columnPinning,
      rowPinning: rowPinningHook.rowPinning,
      grouping: groupingHook.grouping,
      expanded: groupingHook.expanded,
      columnOrder: orderingHook.columnOrder,
    },
    onColumnVisibilityChange: setColumnVisibility,
    // Sorting
    manualSorting,
    onSortingChange,
    enableMultiSort,
    sortDescFirst,
    // Filtering
    manualFiltering,
    filterFns,
    globalFilterFn,
    onColumnFiltersChange,
    onGlobalFilterChange,
    // Resize
    columnResizeMode,
    enableColumnResizing,
    columnResizeDirection,
    // Selection
    enableRowSelection,
    enableMultiRowSelection,
    onRowSelectionChange,
    // Column pinning
    enableColumnPinning,
    onColumnPinningChange,
    // Row pinning
    enableRowPinning,
    keepPinnedRows,
    onRowPinningChange,
    // Grouping
    enableGrouping,
    groupedColumnMode,
    onGroupingChange,
    onExpandedChange,
    autoResetExpanded,
    // Column ordering
    onColumnOrderChange,
  })

  // Row virtualization — count center rows for flat, all visible rows for tree
  const rowsForVirtualizer =
    mode === "tree"
      ? table.getRowModel().rows
      : table.getCenterRows()
  const rowVirtualizer = useRowVirtualizer({
    enabled: features?.virtualization?.enabled ?? false,
    rowCount: rowsForVirtualizer.length,
    density,
    rowHeight: features?.virtualization?.rowHeight,
    containerRef: tableContainerRef,
    overscan: features?.virtualization?.overscan,
  })

  // Column virtualization — only center (non-pinned) columns
  const centerColumns = table.getCenterLeafColumns()
  const columnVirtualizer = useColVirtualizer({
    enabled: features?.virtualization?.enabled ?? false,
    columns: centerColumns,
    containerRef: tableContainerRef,
  })

  return {
    table: table as unknown as Table<GridRow>,
    isLoading: false,
    density,
    setDensity,
    globalFilter: filteringHook.globalFilter,
    setGlobalFilter: filteringHook.setGlobalFilter,
    tableContainerRef,
    features,
    mode,
    handleExpand: handleExpand as (row: import("@tanstack/react-table").Row<GridRow>) => Promise<void>,
    loadingRowIds,
    rowVirtualizer,
    columnVirtualizer,
    activeEdit: editingHook.activeEdit,
    startEditing: editingHook.startEditing,
    cancelEditing: editingHook.cancelEditing,
    commitEditing: editingHook.commitEditing,
    mutatingRowIds: editingHook.mutatingRowIds,
    errorRowIds: editingHook.errorRowIds,
  }
}
