import React from 'react'
import type { GridRow, GridDensity, GridMode, GridFeaturesConfig } from '@/types/grid-types'
import type { GridColumnDef } from '@/types/column-types'
import type { GridSlots } from '@/types/slot-types'
import { useDataGrid } from '@/hooks/use-data-grid'
import { DataGridProvider } from './data-grid-context'
import { DataGridHeader } from './data-grid-header'
import { DataGridRow } from './data-grid-row'
import { DataGridEmpty } from './data-grid-empty'
import { cn } from '@/lib/utils'

const DENSITY_VARS: Record<GridDensity, Record<string, string>> = {
  compact:     { '--cell-px': '8px',  '--cell-py': '4px',  '--row-height': '32px', '--header-height': '32px', '--font-size': '12px' },
  normal:      { '--cell-px': '12px', '--cell-py': '8px',  '--row-height': '40px', '--header-height': '38px', '--font-size': '13px' },
  comfortable: { '--cell-px': '16px', '--cell-py': '12px', '--row-height': '52px', '--header-height': '46px', '--font-size': '14px' },
}

export interface DataGridProps<TData extends GridRow> {
  data: TData[]
  columns: GridColumnDef<TData>[]
  mode?: GridMode
  density?: GridDensity
  features?: GridFeaturesConfig
  slots?: GridSlots
  className?: string
}

export function DataGrid<TData extends GridRow>(props: DataGridProps<TData>) {
  const grid = useDataGrid(props)
  const rows = grid.table.getRowModel().rows
  const densityVars = DENSITY_VARS[grid.density]

  return (
    <DataGridProvider value={grid}>
      <div
        data-density={grid.density}
        className={cn('relative w-full font-sans', props.className)}
        style={densityVars as React.CSSProperties}
      >
        {/* toolbar placeholder — Phase 7 */}
        <div ref={grid.tableContainerRef} className="overflow-auto rounded-md border border-border">
          <table className="w-full border-collapse text-sm">
            <DataGridHeader />
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={props.columns.length}>
                    <DataGridEmpty
                      slots={{ empty: props.slots?.emptyState }}
                    />
                  </td>
                </tr>
              ) : (
                rows.map(row => <DataGridRow key={row.id} row={row} />)
              )}
            </tbody>
          </table>
        </div>
        {/* pagination placeholder — Phase 8 */}
      </div>
    </DataGridProvider>
  )
}
