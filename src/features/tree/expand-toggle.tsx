import type { Row } from "@tanstack/react-table"
import { ChevronRight, Loader2 } from "lucide-react"
import type { GridRow } from "@/types/grid-types"
import { useDataGridContext } from "@/components/data-grid/data-grid-context"
import { cn } from "@/lib/utils"

export function ExpandToggle({ row }: { row: Row<GridRow> }) {
  const { handleExpand, loadingRowIds } = useDataGridContext()
  const isLoadingChildren = loadingRowIds.has(row.id)
  const canExpand =
    row.original._hasChildren === true || row.getCanExpand()

  if (!canExpand) return null

  return (
    <button
      onClick={async (e) => {
        e.stopPropagation()
        if (!row.getIsExpanded()) {
          await handleExpand(row)
        }
        row.getToggleExpandedHandler()()
      }}
      style={{ paddingLeft: `${row.depth * 20}px` }}
      aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
      aria-expanded={row.getIsExpanded()}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      {isLoadingChildren ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <ChevronRight
          size={14}
          className={cn(
            "transition-transform duration-150",
            row.getIsExpanded() && "rotate-90",
          )}
        />
      )}
    </button>
  )
}

export const expandColumnDef = {
  id: "__expand__",
  size: 32,
  maxSize: 32,
  enableSorting: false,
  enableResizing: false,
  enableHiding: false,
  header: () => null,
  cell: ({ row }: { row: Row<GridRow> }) => <ExpandToggle row={row} />,
}
