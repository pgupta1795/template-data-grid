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
import type { GridRow, GridDensity, GridMode, GridFeaturesConfig } from "@/types/grid-types"
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

export interface DataGridConfig<TData extends GridRow> {
  data: TData[]
  columns: GridColumnDef<TData>[]
  mode?: GridMode
  density?: GridDensity
  features?: GridFeaturesConfig
}

export function useDataGrid<TData extends GridRow>(
  config: DataGridConfig<TData>,
): DataGridContextValue {
  const { data, columns, density: initialDensity = "normal", features } = config

  const [density, setDensity] = React.useState<GridDensity>(initialDensity)
  const [columnVisibility, setColumnVisibility] =
    React.useState<Record<string, boolean>>({})
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  // Feature hooks
  const sortingHook = useSorting(features?.sorting)
  const filteringHook = useFiltering(features?.filtering)
  const resizeHook = useColumnResize()
  const selectionHook = useSelection(features?.selection)
  const columnPinningHook = useColumnPinning(features?.columnPinning)
  const rowPinningHook = useRowPinning(features?.rowPinning)
  const groupingHook = useGrouping(features?.grouping)
  const orderingHook = useColumnOrdering()

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

  // Inject selection column when enabled
  const finalColumns = React.useMemo(
    () =>
      features?.selection?.enabled
        ? [selectionColumnDef as GridColumnDef<TData>, ...processedColumns]
        : processedColumns,
    [features?.selection?.enabled, processedColumns],
  )

  // Destructure all table options from hooks
  const {
    manualSorting, onSortingChange, enableMultiSort, sortDescFirst,
    manualFiltering, filterFns, globalFilterFn, onColumnFiltersChange, onGlobalFilterChange,
    columnResizeMode, enableColumnResizing, columnResizeDirection,
    enableRowSelection, enableMultiRowSelection, onRowSelectionChange,
    enableColumnPinning, onColumnPinningChange,
    enableRowPinning, keepPinnedRows, onRowPinningChange,
    enableGrouping, groupedColumnMode, onGroupingChange, onExpandedChange, autoResetExpanded,
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

  const table = useReactTable<TData>({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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

  return {
    table: table as unknown as Table<GridRow>,
    isLoading: false,
    density,
    setDensity,
    globalFilter: filteringHook.globalFilter,
    setGlobalFilter: filteringHook.setGlobalFilter,
    tableContainerRef,
    features,
  }
}
