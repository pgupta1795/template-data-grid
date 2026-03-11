import React from 'react'
import type { Table } from '@tanstack/react-table'
import type { GridRow, GridDensity } from '@/types/grid-types'

export interface DataGridContextValue {
  table: Table<GridRow>
  isLoading: boolean
  density: GridDensity
  setDensity: (d: GridDensity) => void
  globalFilter: string
  setGlobalFilter: (v: string) => void
  tableContainerRef: React.RefObject<HTMLDivElement | null>
}

export const DataGridContext = React.createContext<DataGridContextValue | null>(null)

interface DataGridProviderProps {
  value: DataGridContextValue
  children: React.ReactNode
}

export function DataGridProvider({ value, children }: DataGridProviderProps) {
  return <DataGridContext.Provider value={value}>{children}</DataGridContext.Provider>
}

export function useDataGridContext(): DataGridContextValue {
  const context = React.useContext(DataGridContext)
  if (context === null) {
    throw new Error('useDataGridContext must be used within a DataGridProvider')
  }
  return context
}
