import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

interface SortIndicatorProps {
  direction: 'asc' | 'desc' | false
}

export function SortIndicator({ direction }: SortIndicatorProps) {
  return (
    <span className="transition-transform duration-150 inline-flex items-center">
      {direction === 'asc' && (
        <ArrowUp className="h-3.5 w-3.5 text-foreground" />
      )}
      {direction === 'desc' && (
        <ArrowDown className="h-3.5 w-3.5 text-foreground" />
      )}
      {direction === false && (
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
      )}
    </span>
  )
}
