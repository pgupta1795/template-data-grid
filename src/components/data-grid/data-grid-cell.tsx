import React, { useState } from 'react'
import type { Cell } from '@tanstack/react-table'
import { Calendar, Check, Copy, X } from 'lucide-react'
import type { GridRow } from '@/types/grid-types'
import type { ColumnMeta } from '@/types/column-types'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatNumber, formatDate } from '@/utils/formatters'
import { cn } from '@/lib/utils'
import { useDataGridContext } from './data-grid-context'
import { getPinnedShadowClass } from '@/features/pinning/pinned-shadow'

// ---------------------------------------------------------------------------
// CopyButton
// ---------------------------------------------------------------------------

function CopyButton({ value, alwaysVisible }: { value: string; alwaysVisible?: boolean }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); void handleCopy() }}
      className={cn(
        'ml-1.5 shrink-0 transition-opacity text-muted-foreground hover:text-foreground',
        alwaysVisible ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'
      )}
      aria-label="Copy value"
    >
      {copied
        ? <Check className="h-3 w-3 text-emerald-500" />
        : <Copy className="h-3 w-3" />
      }
    </button>
  )
}

// ---------------------------------------------------------------------------
// DEFAULT_COLORS palette (matches select-column.tsx)
// ---------------------------------------------------------------------------

const DEFAULT_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800',
  draft: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800',
  obsolete: 'bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:text-zinc-400 dark:border-zinc-700',
  review: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800',
}

// ---------------------------------------------------------------------------
// Type-based renderers
// ---------------------------------------------------------------------------

function StringRenderer({ value, meta }: { value: unknown; meta?: ColumnMeta }) {
  const str = String(value ?? '')
  return (
    <div className="flex items-center min-w-0">
      <span className="truncate">{str}</span>
      {meta?.copyable && str && <CopyButton value={str} />}
    </div>
  )
}

function NumberRenderer({ value, meta }: { value: unknown; meta?: ColumnMeta }) {
  const num = Number(value)
  const display = meta?.format
    ? formatNumber(num, meta.format, meta.locale ?? 'en-US', meta.currency ?? 'USD')
    : String(value ?? '')

  return (
    <span className="font-mono">{display}</span>
  )
}

function DateRenderer({ value, meta }: { value: unknown; meta?: ColumnMeta }) {
  const display = formatDate(
    value as Date | string | number | null | undefined,
    meta?.dateFormat
  )

  return (
    <div className="flex items-center gap-1.5">
      <Calendar className="shrink-0 text-muted-foreground" style={{ width: 14, height: 14 }} />
      <span>{display}</span>
    </div>
  )
}

function MultiValueRenderer({ value, meta }: { value: unknown; meta?: ColumnMeta }) {
  const items = Array.isArray(value) ? (value as string[]) : []
  const maxVisible = meta?.maxVisible ?? 3
  const visible = items.slice(0, maxVisible)
  const overflow = items.length - maxVisible

  return (
    <div className="flex items-center flex-wrap gap-1">
      {visible.map((item, i) => (
        <Badge key={i} variant="secondary" className="text-xs">
          {item}
        </Badge>
      ))}
      {overflow > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{overflow}
        </Badge>
      )}
    </div>
  )
}

function SelectRenderer({ value, meta }: { value: unknown; meta?: ColumnMeta }) {
  const str = String(value ?? '')
  if (!str) return null

  const opt = meta?.options?.find(o => o.value === str)
  const label = opt?.label ?? str
  const colorClass = opt?.color ?? DEFAULT_COLORS[str] ?? ''

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium capitalize', colorClass)}
    >
      {label}
    </Badge>
  )
}

function BooleanRenderer({ value, meta }: { value: unknown; meta?: ColumnMeta }) {
  const bool = !!value
  const renderAs = meta?.renderAs ?? 'badge'

  if (renderAs === 'checkbox') {
    return (
      <div className="flex items-center pointer-events-none">
        <Checkbox checked={bool} disabled />
      </div>
    )
  }

  if (renderAs === 'icon') {
    return bool
      ? <Check className="h-4 w-4 text-emerald-500" />
      : <X className="h-4 w-4 text-muted-foreground/50" />
  }

  // default: badge
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium',
        bool
          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800'
          : 'bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:text-zinc-400 dark:border-zinc-700'
      )}
    >
      {bool ? (meta?.trueLabel ?? 'Yes') : (meta?.falseLabel ?? 'No')}
    </Badge>
  )
}

function CodeRenderer({ value }: { value: unknown }) {
  const str = String(value ?? '')
  return (
    <div className="flex items-center min-w-0">
      <code className="font-mono bg-muted/40 rounded px-1.5 py-0.5 text-xs truncate">
        {str}
      </code>
      {str && <CopyButton value={str} alwaysVisible />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DataGridCell
// ---------------------------------------------------------------------------

export interface DataGridCellProps {
  cell: Cell<GridRow, unknown>
  className?: string
}

export function DataGridCell({ cell, className }: DataGridCellProps) {
  const { table } = useDataGridContext()
  const { column, row } = cell
  const meta = column.columnDef.meta as ColumnMeta | undefined
  const value = cell.getValue()

  // Pinned column sticky styles
  const isPinned = column.getIsPinned()
  const leftCols = table.getLeftLeafColumns()
  const rightCols = table.getRightLeafColumns()
  const pinnedStyle: React.CSSProperties = isPinned
    ? {
        position: "sticky",
        left: isPinned === "left" ? column.getStart("left") : undefined,
        right: isPinned === "right" ? column.getAfter("right") : undefined,
        zIndex: 1,
      }
    : {}
  const shadowClass = getPinnedShadowClass(column, leftCols, rightCols)

  // 1. Custom render function takes priority
  if (typeof meta?.render === 'function') {
    const rendered = (meta.render as (value: unknown, row: GridRow) => React.ReactNode)(value, row.original)
    return (
      <td
        style={pinnedStyle}
        className={cn(
          'px-[var(--cell-px)] py-[var(--cell-py)]',
          'border-r border-border/30 last:border-r-0',
          'border-b border-border/50',
          'text-[length:var(--font-size)]',
          'transition-colors duration-100',
          'group-hover/row:bg-muted/30',
          isPinned && 'bg-background',
          shadowClass,
          className
        )}
      >
        {rendered}
      </td>
    )
  }

  // 2. Type-based rendering
  const type = meta?.type

  let content: React.ReactNode
  let isDateCell = false

  switch (type) {
    case 'string':
      content = <StringRenderer value={value} meta={meta} />
      break

    case 'number':
      content = <NumberRenderer value={value} meta={meta} />
      break

    case 'date':
      isDateCell = true
      content = <DateRenderer value={value} meta={meta} />
      break

    case 'multi-value':
      content = <MultiValueRenderer value={value} meta={meta} />
      break

    case 'select':
      content = <SelectRenderer value={value} meta={meta} />
      break

    case 'boolean':
      content = <BooleanRenderer value={value} meta={meta} />
      break

    case 'code':
      content = <CodeRenderer value={value} />
      break

    default:
      content = <span>{String(value ?? '')}</span>
      break
  }

  return (
    <td
      style={pinnedStyle}
      className={cn(
        'px-[var(--cell-px)] py-[var(--cell-py)]',
        'border-r border-border/30 last:border-r-0',
        'border-b border-border/50',
        'text-[length:var(--font-size)]',
        'transition-colors duration-100',
        'group-hover/row:bg-muted/30',
        type === 'number' && 'text-right',
        isDateCell && 'bg-orange-500/5',
        isPinned && 'bg-background',
        shadowClass,
        className
      )}
    >
      {content}
    </td>
  )
}
