import React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
} from "@tanstack/react-table"
import type { Table, FilterFnOption } from "@tanstack/react-table"
import type { GridRow, GridDensity, GridMode, GridFeaturesConfig } from "@/types/grid-types"
import type { GridColumnDef, ColumnType } from "@/types/column-types"
import type { DataGridContextValue } from "@/components/data-grid/data-grid-context"
import { useSorting } from "@/features/sorting/use-sorting"
import { useFiltering } from "@/features/filtering/use-filtering"
import { useColumnResize } from "./use-column-resize"
import { filterFnForType } from "@/features/filtering/filter-functions"

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

  const sortingHook = useSorting(features?.sorting)
  const filteringHook = useFiltering(features?.filtering)
  const resizeHook = useColumnResize()

  // Post-process columns to set correct filter function per type
  const processedColumns = React.useMemo(
    () =>
      columns.map((col) => {
        const type = col.meta?.type as ColumnType | undefined
        const fn = filterFnForType(type)
        return fn
          ? { ...col, filterFn: fn as FilterFnOption<TData> }
          : col
      }),
    [columns],
  )

  const {
    manualSorting, onSortingChange, enableMultiSort, sortDescFirst,
    manualFiltering, filterFns, globalFilterFn, onColumnFiltersChange, onGlobalFilterChange,
    columnResizeMode, enableColumnResizing, columnResizeDirection,
  } = {
    ...sortingHook.tableOptions,
    ...filteringHook.tableOptions,
    ...resizeHook.tableOptions,
  }

  const table = useReactTable<TData>({
    data,
    columns: processedColumns,
    getCoreRowModel: getCoreRowModel(),
    // Row model functions — called here so they are typed with TData
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    state: {
      sorting: sortingHook.sortingState,
      columnFilters: filteringHook.columnFilters,
      globalFilter: filteringHook.globalFilter,
      columnVisibility,
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
