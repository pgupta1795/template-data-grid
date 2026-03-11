import React from "react"
import type { Table, Row } from "@tanstack/react-table"
import type {
  GridRow,
  GridDensity,
  GridFeaturesConfig,
  GridMode,
} from "@/types/grid-types"
import type {
  RowVirtualizerInstance,
  ColVirtualizerInstance,
} from "@/features/virtualization/use-virtualization"

export interface DataGridContextValue {
  table: Table<GridRow>
  isLoading: boolean
  density: GridDensity
  setDensity: (d: GridDensity) => void
  globalFilter: string
  setGlobalFilter: (v: string) => void
  tableContainerRef: React.RefObject<HTMLDivElement | null>
  features?: GridFeaturesConfig
  mode?: GridMode
  // Tree features
  handleExpand: (row: Row<GridRow>) => Promise<void>
  loadingRowIds: Set<string>
  // Virtualization
  rowVirtualizer: RowVirtualizerInstance
  columnVirtualizer: ColVirtualizerInstance
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
