import React from "react"
import { flexRender } from "@tanstack/react-table"
import type { Header } from "@tanstack/react-table"
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
  GripVertical,
  Pin,
  PinOff,
  Layers,
} from "lucide-react"
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useDataGridContext } from "./data-grid-context"
import { SortIndicator } from "@/features/sorting/sort-indicator"
import { ColumnFilterPopover } from "@/features/filtering/column-filter-popover"
import { FilterRow } from "@/features/filtering/filter-row"
import { getPinnedShadowClass } from "@/features/pinning/pinned-shadow"
import type { ColumnType } from "@/types/column-types"
import type { GridRow } from "@/types/grid-types"

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

// ─────────────────────────────────────────────────────────────────────────────
// Sortable header cell wrapper (DnD)
// ─────────────────────────────────────────────────────────────────────────────

function SortableHeaderCell({
  header,
  isResizing,
}: {
  header: Header<GridRow, unknown>
  isResizing: boolean
}) {
  const { table, features } = useDataGridContext()
  const column = header.column

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const meta = column.columnDef.meta as { type?: ColumnType } | undefined
  const columnType = meta?.type
  const typeEntry = columnType ? TYPE_ICONS[columnType] : undefined
  const TypeIcon = typeEntry?.icon

  const canSort = column.getCanSort()
  const sorting = table.getState().sorting
  const sortDir = column.getIsSorted()
  const sortIdx = sortDir
    ? sorting.findIndex((s) => s.id === column.id)
    : undefined

  const isPinned = column.getIsPinned()
  const shadowClass = getPinnedShadowClass(
    column,
    table.getLeftLeafColumns(),
    table.getRightLeafColumns(),
  )

  const pinnedStyle: React.CSSProperties = isPinned
    ? {
        position: "sticky",
        left: isPinned === "left" ? column.getStart("left") : undefined,
        right: isPinned === "right" ? column.getAfter("right") : undefined,
        zIndex: 3,
      }
    : {}

  const isGrouped = features?.grouping?.enabled && column.getIsGrouped()

  const thStyle: React.CSSProperties = {
    width: `${header.getSize()}px`,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...pinnedStyle,
  }

  return (
    <th
      ref={setNodeRef}
      style={thStyle}
      colSpan={header.colSpan}
      className={cn(
        "group/header px-[var(--cell-px)] h-[var(--header-height)]",
        "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
        "select-none whitespace-nowrap border-r border-border/30 last:border-r-0 relative",
        canSort && "cursor-pointer",
        isResizing && "select-none",
        isPinned && "bg-background",
        shadowClass,
      )}
      onClick={
        canSort
          ? (e) => column.toggleSorting(undefined, e.shiftKey)
          : undefined
      }
    >
      {header.isPlaceholder ? null : (
        <div className="flex items-center gap-1 h-full">
          {/* Drag handle */}
          <span
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover/header:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing shrink-0 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </span>

          {TypeIcon && (
            <TypeIcon
              className={`h-3 w-3 shrink-0 ${typeEntry?.className ?? ""}`}
            />
          )}

          <span className="shrink-0 min-w-0 truncate flex-1">
            {flexRender(column.columnDef.header, header.getContext())}
          </span>

          {/* Grouping indicator */}
          {isGrouped && (
            <button
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                column.toggleGrouping()
              }}
              title="Remove grouping"
            >
              <Layers className="h-3 w-3 text-primary" />
            </button>
          )}

          <SortIndicator
            direction={sortDir === false ? false : sortDir}
            sortIndex={sortIdx}
          />

          {/* Filter popover */}
          <span
            onClick={(e) => e.stopPropagation()}
            className="inline-flex shrink-0"
          >
            <ColumnFilterPopover column={column} />
          </span>

          {/* Column action menu (pin / group) */}
          {column.id !== "__select__" && (
            <span onClick={(e) => e.stopPropagation()} className="shrink-0">
              <HeaderActionMenu column={column} />
            </span>
          )}
        </div>
      )}

      {/* Resize handle */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors",
          column.getIsResizing()
            ? "bg-primary w-[3px]"
            : "hover:bg-primary/40",
        )}
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        onClick={(e) => e.stopPropagation()}
      />
    </th>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Header action menu (pin + group)
// ─────────────────────────────────────────────────────────────────────────────

function HeaderActionMenu({
  column,
}: {
  column: ReturnType<
    typeof useDataGridContext
  >["table"]["getAllLeafColumns"]["prototype"][number]
}) {
  const { features } = useDataGridContext()
  const isPinned = column.getIsPinned()
  const canGroup = features?.grouping?.enabled && column.getCanGroup()
  const isGrouped = column.getIsGrouped()

  const hasPinning = features?.columnPinning?.enabled
  if (!hasPinning && !canGroup) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="opacity-0 group-hover/header:opacity-60 hover:!opacity-100 transition-opacity inline-flex items-center justify-center"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label="Column actions"
      >
        <Pin className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" className="min-w-36">
        {hasPinning && (
          <>
            {isPinned !== "left" && (
              <DropdownMenuItem onClick={() => column.pin("left")}>
                <Pin className="h-3.5 w-3.5 rotate-45" />
                Pin left
              </DropdownMenuItem>
            )}
            {isPinned !== "right" && (
              <DropdownMenuItem onClick={() => column.pin("right")}>
                <Pin className="h-3.5 w-3.5 -rotate-45" />
                Pin right
              </DropdownMenuItem>
            )}
            {isPinned && (
              <DropdownMenuItem onClick={() => column.pin(false)}>
                <PinOff className="h-3.5 w-3.5" />
                Unpin
              </DropdownMenuItem>
            )}
          </>
        )}
        {hasPinning && canGroup && <DropdownMenuSeparator />}
        {canGroup && (
          <DropdownMenuItem onClick={() => column.toggleGrouping()}>
            <Layers className="h-3.5 w-3.5" />
            {isGrouped ? "Remove grouping" : "Group by"}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DataGridHeader
// ─────────────────────────────────────────────────────────────────────────────

export function DataGridHeader() {
  const { table, features, columnVirtualizer } = useDataGridContext()
  const headerGroups = table.getHeaderGroups()
  const isResizing = !!table.getState().columnSizingInfo?.isResizingColumn
  const isColVirtualized = features?.virtualization?.enabled ?? false

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const allCols = table.getAllLeafColumns()
    const currentOrder =
      table.getState().columnOrder.length > 0
        ? table.getState().columnOrder
        : allCols.map((c) => c.id)

    const fromIdx = currentOrder.indexOf(String(active.id))
    const toIdx = currentOrder.indexOf(String(over.id))
    if (fromIdx === -1 || toIdx === -1) return

    const newOrder = [...currentOrder]
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, String(active.id))
    table.setColumnOrder(newOrder)
  }

  const leafHeaders =
    headerGroups[headerGroups.length - 1]?.headers ?? []
  const columnIds = leafHeaders.map((h) => h.column.id)

  // Column virtualization helpers
  const virtualCols = isColVirtualized
    ? columnVirtualizer.getVirtualItems()
    : null
  const centerCols = table.getCenterLeafColumns()
  const centerColIdSet = isColVirtualized
    ? new Set(
        (virtualCols ?? [])
          .map((vc) => centerCols[vc.index]?.id)
          .filter(Boolean),
      )
    : null
  const totalColVirtualSize = columnVirtualizer.getTotalSize()
  const startPad =
    virtualCols && virtualCols.length > 0
      ? centerCols
          .slice(0, virtualCols[0]?.index ?? 0)
          .reduce((s, c) => s + c.getSize(), 0)
      : 0
  const endPad =
    virtualCols && virtualCols.length > 0
      ? totalColVirtualSize -
        centerCols
          .slice(0, (virtualCols[virtualCols.length - 1]?.index ?? 0) + 1)
          .reduce((s, c) => s + c.getSize(), 0)
      : 0

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <thead>
        {headerGroups.map((headerGroup, groupIndex) => {
          const isGroupRow =
            headerGroups.length > 1 && groupIndex < headerGroups.length - 1

          if (isGroupRow) {
            return (
              <tr
                key={headerGroup.id}
                className="bg-muted/40 border-b border-border"
              >
                {headerGroup.headers.map((header) => (
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
                ))}
              </tr>
            )
          }

          // Split leaf headers for column virtualization
          const leftHeaders = headerGroup.headers.filter(
            (h) => h.column.getIsPinned() === "left",
          )
          const centerHeaders = headerGroup.headers.filter(
            (h) => !h.column.getIsPinned(),
          )
          const rightHeaders = headerGroup.headers.filter(
            (h) => h.column.getIsPinned() === "right",
          )
          const visibleCenterHeaders =
            centerColIdSet
              ? centerHeaders.filter((h) => centerColIdSet.has(h.column.id))
              : centerHeaders

          // Leaf row — sortable
          return (
            <SortableContext
              key={headerGroup.id}
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              <tr>
                {/* Always-visible left-pinned headers */}
                {leftHeaders.map((header) => (
                  <SortableHeaderCell
                    key={header.id}
                    header={header as Header<GridRow, unknown>}
                    isResizing={isResizing}
                  />
                ))}

                {/* Start spacer for column virtualization */}
                {isColVirtualized && startPad > 0 && (
                  <th style={{ width: startPad, padding: 0 }} />
                )}

                {/* Visible center headers */}
                {visibleCenterHeaders.map((header) => (
                  <SortableHeaderCell
                    key={header.id}
                    header={header as Header<GridRow, unknown>}
                    isResizing={isResizing}
                  />
                ))}

                {/* End spacer for column virtualization */}
                {isColVirtualized && endPad > 0 && (
                  <th style={{ width: endPad, padding: 0 }} />
                )}

                {/* Always-visible right-pinned headers */}
                {rightHeaders.map((header) => (
                  <SortableHeaderCell
                    key={header.id}
                    header={header as Header<GridRow, unknown>}
                    isResizing={isResizing}
                  />
                ))}
              </tr>
            </SortableContext>
          )
        })}

        {/* Optional filter row */}
        {features?.filtering?.filterRow && <FilterRow />}
      </thead>
    </DndContext>
  )
}
