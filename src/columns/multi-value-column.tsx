import type { GridColumnDef, ColumnMeta, SelectOption } from '../types/column-types'
import { Badge } from '../components/ui/badge'
import { toArray } from '../utils/grid-utils'

interface MultiValueColumnOptions {
  accessorKey: string
  header: string
  editable?: boolean
  options?: SelectOption[]
  maxVisible?: number
  width?: number
  meta?: Partial<ColumnMeta>
  [key: string]: unknown
}

export function multiValueColumn(options: MultiValueColumnOptions): GridColumnDef {
  const { accessorKey, header, editable, options: selectOptions, maxVisible = 3, width, meta: extraMeta, ...rest } = options

  return {
    accessorKey,
    header,
    size: width ?? 240,
    meta: {
      type: 'multi-value',
      editable: editable ?? false,
      options: selectOptions,
      maxVisible,
      ...extraMeta,
    },
    cell: ({ getValue }) => {
      const values = toArray<string>(getValue<string | string[] | null>())
      if (!values.length) return null
      const visible = values.slice(0, maxVisible)
      const remaining = values.length - visible.length
      return (
        <div className="flex items-center gap-1 flex-wrap">
          {visible.map((v, i) => (
            <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0.5 font-normal">
              {v}
            </Badge>
          ))}
          {remaining > 0 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-normal text-muted-foreground">
              +{remaining}
            </Badge>
          )}
        </div>
      )
    },
    ...rest,
  } as GridColumnDef
}
