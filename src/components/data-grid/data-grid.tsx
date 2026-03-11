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
import { DataGridPagination } from "./data-grid-pagination"
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
    hasNextPage,
    fetchNextPage,
    tableContainerRef,
  } = useDataGridContext()

  React.useEffect(() => {
    if (mode !== "infinite") return
    const container = tableContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (
        scrollHeight - scrollTop - clientHeight < 300 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage()
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [mode, hasNextPage, isFetchingNextPage, fetchNextPage, tableContainerRef])

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
      {renderedCenterRows.map((row, renderIdx) => {
        if (!row) return null
        const isLoading = loadingRowIds.has(row.id)
        return (
          <React.Fragment key={row.id}>
            <DataGridRow
              row={row as Row<GridRow>}
              initialIndex={renderIdx}
            />
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
    mode,
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

      <div className="rounded-md border border-border overflow-hidden">
        <Table
          containerRef={tableContainerRef}
          containerClassName="overflow-auto"
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
              <TableBody className="animate-in fade-in duration-200">
                <DataGridBody />
              </TableBody>
            </>
          )}
        </Table>
        {mode === "paginated" && <DataGridPagination />}
      </div>
    </>
  )
}

/**
 * Configuration props for the DataGrid component.
 */
export interface DataGridProps<TData extends GridRow> {
  /** The data to display in the grid (for flat and tree modes). */
  data?: TData[]
  /** React Query key array for paginated and infinite modes. */
  queryKey?: QueryKey
  /** The fetch function for paginated and infinite modes. */
  queryFn?: PaginatedQueryFn<TData> | InfiniteQueryFn<TData>
  /** Array of column definitions created via column factories. */
  columns: GridColumnDef<TData>[]
  /** Operational mode of the grid. Defaults to 'flat'. */
  mode?: GridMode
  /** Density spacing for rows and cells. Defaults to 'normal'. */
  density?: GridDensity
  /** Configuration for features like sorting, filtering, grouping, editing, virtualization, etc. */
  features?: GridFeaturesConfig
  /** Custom render slots for grid sections like toolbar and pagination. */
  slots?: GridSlots
  /** Additional CSS classes for the root container. */
  className?: string
  /** Used in tree mode to resolve children nodes from a given row. */
  getSubRows?: (row: TData) => TData[] | undefined
  /** Triggered when an Expandable row requests to load children lazily. */
  onExpand?: (row: GridRow) => Promise<GridRow[]> | void
  /** Indicates if external data is currently refetching. */
  isRefetching?: boolean
  /** Indicates if infinite scroll is currently fetching the next page. */
  isFetchingNextPage?: boolean
  /** Callback fired when the user clicks the refresh button. */
  onRefresh?: () => void
}

/**
 * A highly capable data grid built on top of TanStack Table.
 * Supports Flat, Paginated, Infinite, and Tree modes with full virtualization and editing.
 */
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
