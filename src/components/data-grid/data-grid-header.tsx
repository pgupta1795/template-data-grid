import { flexRender } from '@tanstack/react-table'
import type { LucideIcon } from 'lucide-react'
import {
  Type,
  Hash,
  Calendar,
  List,
  ChevronDown,
  ToggleLeft,
  Code2,
  Sparkles,
  ListFilter,
} from 'lucide-react'
import { useDataGridContext } from './data-grid-context'
import { SortIndicator } from '@/features/sorting/sort-indicator'
import type { ColumnType } from '@/types/column-types'

const TYPE_ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  string:        { icon: Type,        className: 'text-sky-500' },
  number:        { icon: Hash,        className: 'text-violet-500' },
  date:          { icon: Calendar,    className: 'text-orange-500' },
  'multi-value': { icon: List,        className: 'text-teal-500' },
  select:        { icon: ChevronDown, className: 'text-amber-500' },
  boolean:       { icon: ToggleLeft,  className: 'text-pink-500' },
  code:          { icon: Code2,       className: 'text-emerald-500' },
  custom:        { icon: Sparkles,    className: 'text-purple-500' },
}

export function DataGridHeader() {
  const { table } = useDataGridContext()
  const headerGroups = table.getHeaderGroups()

  return (
    <thead>
      {headerGroups.map((headerGroup, groupIndex) => {
        const isGroupRow = headerGroups.length > 1 && groupIndex < headerGroups.length - 1

        return (
          <tr
            key={headerGroup.id}
            className={
              isGroupRow
                ? 'bg-muted/40 border-b border-border'
                : undefined
            }
          >
            {headerGroup.headers.map((header) => {
              if (isGroupRow) {
                // Render group header row cells
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="bg-muted/40 border-b border-border px-[var(--cell-px)] h-[var(--header-height)]"
                  >
                    {!header.isPlaceholder && (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center block">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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

              return (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  className="group/header px-[var(--cell-px)] h-[var(--header-height)] text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground select-none whitespace-nowrap border-r border-border/30 last:border-r-0 relative"
                >
                  {header.isPlaceholder ? null : (
                    <div className="flex items-center gap-1.5 h-full">
                      {TypeIcon && (
                        <TypeIcon
                          className={`h-3 w-3 shrink-0 ${typeEntry?.className ?? ''}`}
                        />
                      )}
                      <span className="shrink-0">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
                      <span className="flex-1" />
                      <SortIndicator direction={false} />
                      <ListFilter className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover/header:opacity-100" />
                    </div>
                  )}
                  <div className="absolute right-0 top-0 h-full w-1 hover:bg-primary/40 cursor-col-resize" />
                </th>
              )
            })}
          </tr>
        )
      })}
    </thead>
  )
}
