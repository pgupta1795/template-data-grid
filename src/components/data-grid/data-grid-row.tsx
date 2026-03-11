import type { Row } from '@tanstack/react-table'
import type { GridRow } from '@/types/grid-types'
import { DataGridCell } from './data-grid-cell'
import { cn } from '@/lib/utils'

interface DataGridRowProps {
  row: Row<GridRow>
  virtualRow?: { start: number }
  className?: string
}

export function DataGridRow({ row, virtualRow, className }: DataGridRowProps) {
  return (
    <tr
      className={cn(
        'group/row bg-background hover:bg-muted/30',
        'data-[selected=true]:bg-primary/6 data-[selected=true]:border-l-2 data-[selected=true]:border-l-primary',
        'transition-colors duration-100',
        className
      )}
      data-selected={String(row.getIsSelected())}
      style={virtualRow ? { transform: `translateY(${virtualRow.start}px)` } : undefined}
    >
      {row.getVisibleCells().map(cell => (
        <DataGridCell key={cell.id} cell={cell} />
      ))}
    </tr>
  )
}
