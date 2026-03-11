import { TableHead } from "@/components/ui/table"

interface SkeletonHeaderProps {
  index: number
}

export function SkeletonHeader({ index }: SkeletonHeaderProps) {
  const labelWidth = `${50 + (index % 3) * 15}%`

  return (
    <TableHead className="bg-muted/40 border-r border-border/30 px-[var(--cell-px)]">
      <div className="flex items-center gap-1.5">
        {/* Type icon placeholder */}
        <div className="w-3 h-3 rounded-sm bg-muted/60 animate-pulse motion-reduce:animate-none shrink-0" />
        {/* Label placeholder */}
        <div
          className="h-[11px] rounded-sm bg-muted/60 animate-pulse motion-reduce:animate-none"
          style={{ width: labelWidth }}
        />
      </div>
    </TableHead>
  )
}
