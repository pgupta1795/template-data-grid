import type { GridColumnDef, ColumnMeta } from '../types/column-types'
import { formatNumber } from '../utils/formatters'

interface NumberColumnOptions {
  accessorKey: string
  header: string
  editable?: boolean
  format?: 'currency' | 'percent' | 'decimal'
  currency?: string
  locale?: string
  width?: number
  meta?: Partial<ColumnMeta>
  [key: string]: unknown
}

export function numberColumn(options: NumberColumnOptions): GridColumnDef {
  const { accessorKey, header, editable, format, currency, locale, width, meta: extraMeta, ...rest } = options

  return {
    accessorKey,
    header,
    size: width ?? 120,
    enableSorting: true,
    meta: {
      type: 'number',
      editable: editable ?? false,
      format,
      currency,
      locale,
      ...extraMeta,
    },
    cell: ({ getValue }) => {
      const value = getValue<number>()
      if (value === null || value === undefined) return null
      const display = format
        ? formatNumber(value, format, locale, currency)
        : String(value)
      return (
        <div className="text-right font-mono tabular-nums">{display}</div>
      )
    },
    ...rest,
  } as GridColumnDef
}
