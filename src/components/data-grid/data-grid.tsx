import React, { memo } from "react"
import type { Row } from "@tanstack/react-table"
import type {
  GridRow,
  GridDensity,
  GridMode,
  GridFeaturesConfig,
} from "@/types/grid-types"
import type { GridColumnDef } from "@/types/column-types"
import type { GridSlots } from "@/types/slot-types"
import { useDataGrid } from "@/hooks/use-data-grid"
import { DataGridProvider, useDataGridContext } from "./data-grid-context"
import { DataGridHeader } from "./data-grid-header"
import { DataGridRow } from "./data-grid-row"
import { DataGridEmpty } from "./data-grid-empty"
import { cn } from "@/lib/utils"

const DENSITY_VARS: Record<GridDensity, Record<string, string>> = {
  compact: {
    "--cell-px": "8px",
    "--cell-py": "4px",
    "--row-height": "32px",
    "--header-height": "32px",
    "--font-size": "12px",
  },
  normal: {
    "--cell-px": "12px",
    "--cell-py": "8px",
    "--row-height": "40px",
    "--header-height": "38px",
    "--font-size": "13px",
  },
  comfortable: {
    "--cell-px": "16px",
    "--cell-py": "12px",
    "--row-height": "52px",
    "--header-height": "46px",
    "--font-size": "14px",
  },
}

// Skeleton rows shown while lazy-expanding a tree node
const TreeSkeletonRows = memo(function TreeSkeletonRows({
  depth,
  colCount,
}: {
  depth: number
  colCount: number
}) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <tr key={i} className="bg-background border-b border-border/50">
          <td
            colSpan={colCount}
            style={{
              padding: `6px 12px 6px ${(depth + 1) * 20 + 12}px`,
            }}
          >
            <div
              className="h-3.5 rounded-sm bg-muted animate-pulse"
              style={{ width: `${55 + i * 15}%` }}
            />
          </td>
        </tr>
      ))}
    </>
  )
})

function DataGridBody() {
  const {
    table,
    features,
    mode,
    loadingRowIds,
    rowVirtualizer,
  } = useDataGridContext()

  const isVirtualized = features?.virtualization?.enabled ?? false
  const isTreeMode = mode === "tree"

  // For tree mode use all rows (flat expanded list); for flat use center rows
  const allRows = isTreeMode
    ? table.getRowModel().rows
    : undefined

  const topRows = table.getTopRows()
  const centerRows = isTreeMode ? [] : table.getCenterRows()
  const bottomRows = table.getBottomRows()

  const rowsToVirtualize = allRows ?? centerRows
  const hasRows =
    topRows.length +
      (allRows?.length ?? centerRows.length) +
      bottomRows.length >
    0

  const colCount =
    table.getVisibleLeafColumns().length

  // Determine which rows to render (virtual or all)
  const virtualItems = isVirtualized ? rowVirtualizer.getVirtualItems() : null
  const totalSize = rowVirtualizer.getTotalSize()

  const renderedCenterRows = virtualItems
    ? virtualItems.map((vr) => rowsToVirtualize[vr.index]).filter(Boolean)
    : rowsToVirtualize

  const paddingTop =
    isVirtualized && virtualItems && virtualItems.length > 0
      ? (virtualItems[0]?.start ?? 0)
      : 0
  const paddingBottom =
    isVirtualized && virtualItems && virtualItems.length > 0
      ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0

  if (!hasRows) {
    return (
      <tr>
        <td colSpan={colCount}>
          <DataGridEmpty />
        </td>
      </tr>
    )
  }

  return (
    <>
      {/* Pinned top rows (always rendered, sticky) */}
      {topRows.map((row) => (
        <DataGridRow key={row.id} row={row as Row<GridRow>} pinned="top" />
      ))}

      {/* Top padding spacer for row virtualization */}
      {isVirtualized && paddingTop > 0 && (
        <tr>
          <td
            colSpan={colCount}
            style={{ height: `${paddingTop}px`, padding: 0 }}
          />
        </tr>
      )}

      {/* Center rows */}
      {renderedCenterRows.map((row) => {
        if (!row) return null
        const isLoading = loadingRowIds.has(row.id)
        return (
          <React.Fragment key={row.id}>
            <DataGridRow row={row as Row<GridRow>} />
            {/* Show skeleton children while lazy-fetching */}
            {isTreeMode && isLoading && (
              <TreeSkeletonRows
                depth={row.depth}
                colCount={colCount}
              />
            )}
          </React.Fragment>
        )
      })}

      {/* Bottom padding spacer for row virtualization */}
      {isVirtualized && paddingBottom > 0 && (
        <tr>
          <td
            colSpan={colCount}
            style={{ height: `${paddingBottom}px`, padding: 0 }}
          />
        </tr>
      )}

      {/* Pinned bottom rows (always rendered, sticky) */}
      {bottomRows.map((row) => (
        <DataGridRow
          key={row.id}
          row={row as Row<GridRow>}
          pinned="bottom"
        />
      ))}
    </>
  )
}

export interface DataGridProps<TData extends GridRow> {
  data: TData[]
  columns: GridColumnDef<TData>[]
  mode?: GridMode
  density?: GridDensity
  features?: GridFeaturesConfig
  slots?: GridSlots
  className?: string
  getSubRows?: (row: TData) => TData[] | undefined
  onExpand?: (row: GridRow) => Promise<GridRow[]> | void
}

export function DataGrid<TData extends GridRow>(
  props: DataGridProps<TData>,
) {
  const grid = useDataGrid(props)
  const { table } = grid
  const densityVars = DENSITY_VARS[grid.density]

  // Compute total table width for column virtualization
  const totalTableWidth = table
    .getVisibleLeafColumns()
    .reduce((sum, col) => sum + col.getSize(), 0)

  return (
    <DataGridProvider value={grid}>
      <div
        data-density={grid.density}
        className={cn("relative w-full font-sans", props.className)}
        style={densityVars as React.CSSProperties}
      >
        {/* toolbar placeholder — Phase 7 */}
        <div
          ref={grid.tableContainerRef}
          className="overflow-auto rounded-md border border-border"
        >
          <table
            className="border-collapse text-sm"
            style={{ width: `${totalTableWidth}px`, minWidth: "100%" }}
          >
            <DataGridHeader />
            <tbody>
              <DataGridBody />
            </tbody>
          </table>
        </div>
        {/* pagination placeholder — Phase 8 */}
      </div>
    </DataGridProvider>
  )
}
