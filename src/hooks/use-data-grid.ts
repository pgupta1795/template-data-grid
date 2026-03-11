import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import type { Table } from '@tanstack/react-table'
import type { GridRow, GridDensity, GridMode, GridFeaturesConfig } from '@/types/grid-types'
import type { GridColumnDef } from '@/types/column-types'
import type { DataGridContextValue } from '@/components/data-grid/data-grid-context'

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
  const { data, columns, density: initialDensity = 'normal' } = config

  const [density, setDensity] = React.useState<GridDensity>(initialDensity)
  const [globalFilter, setGlobalFilter] = React.useState<string>('')
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
  })

  return {
    table: table as unknown as Table<GridRow>,
    isLoading: false,
    density,
    setDensity,
    globalFilter,
    setGlobalFilter,
    tableContainerRef,
  }
}
