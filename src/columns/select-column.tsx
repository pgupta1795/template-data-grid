import type { GridColumnDef, ColumnMeta, SelectOption } from '../types/column-types'
import { Badge } from '../components/ui/badge'
import { cn } from '../utils/grid-utils'

interface SelectColumnOptions {
  accessorKey: string
  header: string
  editable?: boolean
  options: SelectOption[]
  width?: number
  meta?: Partial<ColumnMeta>
  [key: string]: unknown
}

const DEFAULT_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800',
  draft: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800',
  obsolete: 'bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:text-zinc-400 dark:border-zinc-700',
  review: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800',
}

export function selectColumn(options: SelectColumnOptions): GridColumnDef {
  const { accessorKey, header, editable, options: selectOptions, width, meta: extraMeta, ...rest } = options

  return {
    accessorKey,
    header,
    size: width ?? 140,
    meta: {
      type: 'select',
      editable: editable ?? false,
      options: selectOptions,
      ...extraMeta,
    },
    cell: ({ getValue }) => {
      const value = getValue<string>()
      if (!value) return null
      const opt = selectOptions.find(o => o.value === value)
      const label = opt?.label ?? value
      const colorClass = opt?.color ?? DEFAULT_COLORS[value] ?? ''
      return (
        <Badge
          variant="outline"
          className={cn('text-xs font-medium capitalize', colorClass)}
        >
          {label}
        </Badge>
      )
    },
    ...rest,
  } as GridColumnDef
}
