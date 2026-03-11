import { flexRender } from "@tanstack/react-table"
import type { LucideIcon } from "lucide-react"
import {
  Type,
  Hash,
  Calendar,
  List,
  ChevronDown,
  ToggleLeft,
  Code2,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDataGridContext } from "./data-grid-context"
import { SortIndicator } from "@/features/sorting/sort-indicator"
import { ColumnFilterPopover } from "@/features/filtering/column-filter-popover"
import { FilterRow } from "@/features/filtering/filter-row"
import type { ColumnType } from "@/types/column-types"

const TYPE_ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  string:        { icon: Type,        className: "text-sky-500" },
  number:        { icon: Hash,        className: "text-violet-500" },
  date:          { icon: Calendar,    className: "text-orange-500" },
  "multi-value": { icon: List,        className: "text-teal-500" },
  select:        { icon: ChevronDown, className: "text-amber-500" },
  boolean:       { icon: ToggleLeft,  className: "text-pink-500" },
  code:          { icon: Code2,       className: "text-emerald-500" },
  custom:        { icon: Sparkles,    className: "text-purple-500" },
}

export function DataGridHeader() {
  const { table, features } = useDataGridContext()
  const headerGroups = table.getHeaderGroups()
  const sortingState = table.getState().sorting
  const isResizing = !!table.getState().columnSizingInfo?.isResizingColumn

  return (
    <thead>
      {headerGroups.map((headerGroup, groupIndex) => {
        const isGroupRow =
          headerGroups.length > 1 && groupIndex < headerGroups.length - 1

        return (
          <tr
            key={headerGroup.id}
            className={
              isGroupRow
                ? "bg-muted/40 border-b border-border"
                : undefined
            }
          >
            {headerGroup.headers.map((header) => {
              if (isGroupRow) {
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: `${header.getSize()}px` }}
                    className="bg-muted/40 border-b border-border px-[var(--cell-px)] h-[var(--header-height)]"
                  >
                    {!header.isPlaceholder && (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center block">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </span>
                    )}
                  </th>
                )
              }

              // Leaf / main header cells
              const meta = header.column.columnDef.meta as
                | { type?: ColumnType }
                | undefined
              const columnType = meta?.type
              const typeEntry = columnType ? TYPE_ICONS[columnType] : undefined
              const TypeIcon = typeEntry?.icon

              const canSort = header.column.getCanSort()
              const sortDir = header.column.getIsSorted()
              const sortIdx = sortDir
                ? sortingState.findIndex((s) => s.id === header.column.id)
                : undefined

              return (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: `${header.getSize()}px` }}
                  className={cn(
                    "group/header px-[var(--cell-px)] h-[var(--header-height)] text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground select-none whitespace-nowrap border-r border-border/30 last:border-r-0 relative",
                    canSort && "cursor-pointer",
                    isResizing && "select-none",
                  )}
                  onClick={
                    canSort
                      ? (e) => header.column.toggleSorting(undefined, e.shiftKey)
                      : undefined
                  }
                >
                  {header.isPlaceholder ? null : (
                    <div className="flex items-center gap-1.5 h-full">
                      {TypeIcon && (
                        <TypeIcon
                          className={`h-3 w-3 shrink-0 ${typeEntry?.className ?? ""}`}
                        />
                      )}
                      <span className="shrink-0 min-w-0 truncate">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </span>
                      <span className="flex-1" />
                      <SortIndicator
                        direction={sortDir === false ? false : sortDir}
                        sortIndex={sortIdx}
                      />
                      {/* Filter popover — click stops sort propagation */}
                      <span
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex"
                      >
                        <ColumnFilterPopover column={header.column} />
                      </span>
                    </div>
                  )}
                  {/* Resize handle */}
                  <div
                    className={cn(
                      "absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors",
                      header.column.getIsResizing()
                        ? "bg-primary w-[3px]"
                        : "hover:bg-primary/40",
                    )}
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
              )
            })}
          </tr>
        )
      })}

      {/* Optional filter row */}
      {features?.filtering?.filterRow && <FilterRow />}
    </thead>
  )
}
