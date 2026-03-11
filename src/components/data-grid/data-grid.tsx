import React, { memo } from "react"
import type { Row } from "@tanstack/react-table"
import type { QueryKey } from "@tanstack/react-query"
import type {
  GridRow,
  GridDensity,
  GridMode,
  GridFeaturesConfig,
} from "@/types/grid-types"
import type { GridColumnDef } from "@/types/column-types"
import type { GridSlots } from "@/types/slot-types"
import type {
  PaginatedQueryFn,
  InfiniteQueryFn,
} from "@/hooks/use-data-grid"
import { useDataGrid } from "@/hooks/use-data-grid"
import { DataGridProvider, useDataGridContext } from "./data-grid-context"
import { DataGridHeader } from "./data-grid-header"
import { DataGridRow } from "./data-grid-row"
import { DataGridEmpty } from "./data-grid-empty"
import { DataGridSkeleton } from "./data-grid-skeleton"
import { DataGridRowSkeleton } from "./data-grid-row-skeleton"
import { DataGridToolbar } from "./data-grid-toolbar"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"

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
        <TableRow key={i} className="bg-background border-b border-border/50">
          <TableCell
            colSpan={colCount}
            style={{
              padding: `6px 12px 6px ${(depth + 1) * 20 + 12}px`,
            }}
          >
            <div
              className="h-3.5 rounded-sm bg-muted animate-pulse"
              style={{ width: `${55 + i * 15}%` }}
            />
          </TableCell>
        </TableRow>
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
    isFetchingNextPage,
  } = useDataGridContext()

  const isVirtualized = features?.virtualization?.enabled ?? false
  const isTreeMode = mode === "tree"

  // For tree mode use all rows (flat expanded list); for flat use center rows
  const allRows = isTreeMode ? table.getRowModel().rows : undefined

  const topRows = table.getTopRows()
  const centerRows = isTreeMode ? [] : table.getCenterRows()
  const bottomRows = table.getBottomRows()

  const rowsToVirtualize = allRows ?? centerRows
  const hasRows =
    topRows.length +
      (allRows?.length ?? centerRows.length) +
      bottomRows.length >
    0

  const colCount = table.getVisibleLeafColumns().length
  const visibleColumns = table.getVisibleLeafColumns().map((col) => ({
    id: col.id,
    meta: col.columnDef.meta,
  }))

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
      <TableRow>
        <TableCell colSpan={colCount}>
          <DataGridEmpty />
        </TableCell>
      </TableRow>
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
        <TableRow>
          <TableCell
            colSpan={colCount}
            style={{ height: `${paddingTop}px`, padding: 0 }}
          />
        </TableRow>
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
              <TreeSkeletonRows depth={row.depth} colCount={colCount} />
            )}
          </React.Fragment>
        )
      })}

      {/* Infinite scroll — append skeleton rows while fetching next page */}
      {isFetchingNextPage && (
        <>
          <DataGridRowSkeleton columns={visibleColumns} />
          <DataGridRowSkeleton columns={visibleColumns} />
          <DataGridRowSkeleton columns={visibleColumns} />
        </>
      )}

      {/* Bottom padding spacer for row virtualization */}
      {isVirtualized && paddingBottom > 0 && (
        <TableRow>
          <TableCell
            colSpan={colCount}
            style={{ height: `${paddingBottom}px`, padding: 0 }}
          />
        </TableRow>
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

function DataGridInner() {
  const {
    table,
    isLoading,
    features,
    slots,
    tableContainerRef,
  } = useDataGridContext()

  const skeletonRows = features?.loading?.skeletonRows ?? 8

  // Derive visible columns for skeleton
  const visibleColumns = table.getVisibleLeafColumns().map((col) => ({
    id: col.id,
    meta: col.columnDef.meta,
  }))

  // Compute total table width for column virtualization
  const totalTableWidth = table
    .getVisibleLeafColumns()
    .reduce((sum, col) => sum + col.getSize(), 0)

  return (
    <>
      {slots?.toolbar ? (
        slots.toolbar({ table })
      ) : (
        <DataGridToolbar />
      )}

      <Table
        containerRef={tableContainerRef}
        containerClassName="overflow-auto rounded-md border border-border"
        className="border-collapse text-sm"
        style={{ width: `${totalTableWidth}px`, minWidth: "100%" }}
      >
        {isLoading ? (
          <DataGridSkeleton
            columns={visibleColumns}
            skeletonRows={skeletonRows}
            showHeaderSkeleton
          />
        ) : (
          <>
            <DataGridHeader />
            <TableBody>
              <DataGridBody />
            </TableBody>
          </>
        )}
      </Table>
      {/* pagination placeholder — Phase 8 */}
    </>
  )
}

export interface DataGridProps<TData extends GridRow> {
  data?: TData[]
  queryKey?: QueryKey
  queryFn?: PaginatedQueryFn<TData> | InfiniteQueryFn<TData>
  columns: GridColumnDef<TData>[]
  mode?: GridMode
  density?: GridDensity
  features?: GridFeaturesConfig
  slots?: GridSlots
  className?: string
  getSubRows?: (row: TData) => TData[] | undefined
  onExpand?: (row: GridRow) => Promise<GridRow[]> | void
  // External loading signals (e.g. from TanStack Query)
  isRefetching?: boolean
  isFetchingNextPage?: boolean
  onRefresh?: () => void
}

export function DataGrid<TData extends GridRow>(props: DataGridProps<TData>) {
  const grid = useDataGrid(props)
  const densityVars = DENSITY_VARS[grid.density]

  return (
    <DataGridProvider value={grid}>
      <div
        data-density={grid.density}
        className={cn("relative w-full font-sans", props.className)}
        style={densityVars as React.CSSProperties}
      >
        <DataGridInner />
      </div>
    </DataGridProvider>
  )
}
