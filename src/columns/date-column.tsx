import type { GridColumnDef, ColumnMeta } from '../types/column-types'
import { formatDate } from '../utils/formatters'
import { CalendarIcon } from 'lucide-react'

interface DateColumnOptions {
  accessorKey: string
  header: string
  editable?: boolean
  dateFormat?: string
  width?: number
  meta?: Partial<ColumnMeta>
  [key: string]: unknown
}

/**
 * Creates a date column definition with calendar icon.
 *
 * @param options.accessorKey - The key of the data field to display
 * @param options.header - Column header label
 * @param options.editable - Enable double-click inline editing (default: false)
 * @param options.dateFormat - Format string for date display (default: 'MMM d, yyyy')
 * @param options.width - Base width in pixels (default: 160)
 * @param options.meta - Extra column metadata injected into react-table
 *
 * @example
 * dateColumn({ accessorKey: 'createdAt', header: 'Created', dateFormat: 'MMM d, yyyy' })
 */
export function dateColumn(options: DateColumnOptions): GridColumnDef {
  const { accessorKey, header, editable, dateFormat = 'MMM d, yyyy', width, meta: extraMeta, ...rest } = options

  return {
    accessorKey,
    header,
    size: width ?? 160,
    meta: {
      type: 'date',
      editable: editable ?? false,
      dateFormat,
      ...extraMeta,
    },
    cell: ({ getValue }) => {
      const value = getValue<Date | string | number | null>()
      if (!value) return null
      const display = formatDate(value, dateFormat)
      return (
        <div className="flex items-center gap-1.5 bg-orange-500/5 rounded px-1.5 -mx-1.5">
          <CalendarIcon className="h-3.5 w-3.5 text-orange-400 shrink-0" />
          <span className="text-sm">{display}</span>
        </div>
      )
    },
    ...rest,
  } as GridColumnDef
}
