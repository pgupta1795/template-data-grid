import { flexRender } from "@tanstack/react-table"
import type { Row } from "@tanstack/react-table"
import type { GridRow } from "@/types/grid-types"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface GroupRowProps {
  row: Row<GridRow>
}

export function GroupRow({ row }: GroupRowProps) {
  const isExpanded = row.getIsExpanded()

  return (
    <tr
      className="bg-muted/50 border-b border-border cursor-pointer hover:bg-muted/70 transition-colors duration-100"
      onClick={() => row.toggleExpanded()}
    >
      {row.getVisibleCells().map((cell) => {
        if (cell.getIsGrouped()) {
          return (
            <td
              key={cell.id}
              className="px-[var(--cell-px)] py-1.5 border-r border-border/30 last:border-r-0"
            >
              <div className="flex items-center gap-1.5">
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-150" />
                )}
                <span className="text-[12px] font-medium">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  ({row.subRows.length})
                </span>
              </div>
            </td>
          )
        }

        if (cell.getIsAggregated()) {
          return (
            <td
              key={cell.id}
              className={cn(
                "px-[var(--cell-px)] py-1.5 border-r border-border/30 last:border-r-0",
                "text-[11px] text-muted-foreground font-mono text-right",
              )}
            >
              {flexRender(
                cell.column.columnDef.aggregatedCell ??
                  cell.column.columnDef.cell,
                cell.getContext(),
              )}
            </td>
          )
        }

        // Placeholder
        return (
          <td
            key={cell.id}
            className="px-[var(--cell-px)] py-1.5 border-r border-border/30 last:border-r-0"
          />
        )
      })}
    </tr>
  )
}
