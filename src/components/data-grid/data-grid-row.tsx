import type { Row } from '@tanstack/react-table'
import type { GridRow } from '@/types/grid-types'
import { DataGridCell } from './data-grid-cell'
import { GroupRow } from '@/features/grouping/group-row'
import { cn } from '@/lib/utils'

interface DataGridRowProps {
  row: Row<GridRow>
  virtualRow?: { start: number }
  pinned?: 'top' | 'bottom'
  className?: string
}

export function DataGridRow({ row, virtualRow, pinned, className }: DataGridRowProps) {
  // Render group rows differently
  if (row.getIsGrouped()) {
    return <GroupRow row={row} />
  }

  const pinnedStyle: React.CSSProperties | undefined = pinned
    ? {
        position: 'sticky',
        top: pinned === 'top' ? 'var(--header-height)' : undefined,
        bottom: pinned === 'bottom' ? 0 : undefined,
        zIndex: 2,
      }
    : virtualRow
      ? { transform: `translateY(${virtualRow.start}px)` }
      : undefined

  return (
    <tr
      className={cn(
        'group/row bg-background hover:bg-muted/30',
        'data-[selected=true]:bg-primary/6 data-[selected=true]:border-l-2 data-[selected=true]:border-l-primary',
        'transition-colors duration-100',
        pinned && 'bg-muted/60 shadow-sm',
        className
      )}
      data-selected={String(row.getIsSelected())}
      data-pinned={pinned}
      style={pinnedStyle}
    >
      {row.getVisibleCells().map(cell => (
        <DataGridCell key={cell.id} cell={cell} />
      ))}
    </tr>
  )
}
