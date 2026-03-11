import React from "react"
import type { Table, Row } from "@tanstack/react-table"
import type {
  GridRow,
  GridDensity,
  GridFeaturesConfig,
  GridMode,
} from "@/types/grid-types"
import type { GridSlots } from "@/types/slot-types"
import type {
  RowVirtualizerInstance,
  ColVirtualizerInstance,
} from "@/features/virtualization/use-virtualization"
import type { ActiveEdit } from "@/features/editing/use-editing"

export interface DataGridContextValue {
  table: Table<GridRow>
  isLoading: boolean
  isRefetching: boolean
  isFetchingNextPage: boolean
  density: GridDensity
  setDensity: (d: GridDensity) => void
  globalFilter: string
  setGlobalFilter: (v: string) => void
  tableContainerRef: React.RefObject<HTMLDivElement | null>
  features?: GridFeaturesConfig
  mode?: GridMode
  slots?: GridSlots
  onRefresh?: () => void
  // Tree features
  handleExpand: (row: Row<GridRow>) => Promise<void>
  loadingRowIds: Set<string>
  // Virtualization
  rowVirtualizer: RowVirtualizerInstance
  columnVirtualizer: ColVirtualizerInstance
  // Editing
  activeEdit: ActiveEdit | null
  startEditing: (rowId: string, columnId: string, value: unknown) => void
  cancelEditing: () => void
  commitEditing: (value: unknown) => Promise<void>
  mutatingRowIds: Set<string>
  errorRowIds: Set<string>
  // Pagination
  pagination: { pageIndex: number; pageSize: number }
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >
  paginatedTotal: number | undefined
  // Infinite
  hasNextPage: boolean
  fetchNextPage: () => void
}

export const DataGridContext =
  React.createContext<DataGridContextValue | null>(null)

interface DataGridProviderProps {
  value: DataGridContextValue
  children: React.ReactNode
}

export function DataGridProvider({
  value,
  children,
}: DataGridProviderProps) {
  return (
    <DataGridContext.Provider value={value}>
      {children}
    </DataGridContext.Provider>
  )
}

export function useDataGridContext(): DataGridContextValue {
  const context = React.useContext(DataGridContext)
  if (context === null) {
    throw new Error(
      "useDataGridContext must be used within a DataGridProvider",
    )
  }
  return context
}
