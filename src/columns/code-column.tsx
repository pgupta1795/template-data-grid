import type { GridColumnDef, ColumnMeta } from '../types/column-types'
import { Copy, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { useState } from 'react'
import { cn } from '../utils/grid-utils'

interface CodeColumnOptions {
  accessorKey: string
  header: string
  editable?: boolean
  language?: string
  copyable?: boolean
  maxLines?: number
  width?: number
  meta?: Partial<ColumnMeta>
  [key: string]: unknown
}

function CodeCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={e => { e.stopPropagation(); void handleCopy() }}
      className="ml-1.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy code"
    >
      {copied
        ? <Check className="h-3 w-3 text-emerald-500" />
        : <Copy className="h-3 w-3" />
      }
    </button>
  )
}

export function codeColumn(options: CodeColumnOptions): GridColumnDef {
  const {
    accessorKey, header, editable,
    language = 'text', copyable = true, maxLines = 1,
    width, meta: extraMeta, ...rest
  } = options

  return {
    accessorKey,
    header,
    size: width ?? 220,
    filterFn: 'includesString',
    meta: {
      type: 'code',
      editable: editable ?? false,
      language,
      copyable,
      maxLines,
      ...extraMeta,
    },
    cell: ({ getValue }) => {
      const raw = getValue<string>() ?? ''
      if (!raw) return null

      const lines = raw.split('\n')
      const isTruncated = lines.length > maxLines
      const display = isTruncated
        ? lines.slice(0, maxLines).join('\n') + '...'
        : raw

      const codeBlock = (
        <div className="flex items-center min-w-0">
          <code
            className={cn(
              'font-mono text-[12px] bg-muted/40 rounded px-1.5 py-0.5 truncate max-w-full',
            )}
          >
            {display}
          </code>
          {copyable && <CodeCopyButton value={raw} />}
        </div>
      )

      if (isTruncated) {
        return (
          <Tooltip>
            <TooltipTrigger render={<span className="cursor-default" />}>{codeBlock}</TooltipTrigger>
            <TooltipContent>
              <pre className="font-mono text-[11px] max-w-sm whitespace-pre-wrap">{raw}</pre>
            </TooltipContent>
          </Tooltip>
        )
      }

      return codeBlock
    },
    ...rest,
  } as GridColumnDef
}
