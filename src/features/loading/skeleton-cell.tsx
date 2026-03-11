import { TableCell } from "@/components/ui/table"

interface SkeletonCellProps {
  width?: string
  height?: string
}

export function SkeletonCell({
  width = "60%",
  height = "13px",
}: SkeletonCellProps) {
  return (
    <TableCell className="px-[var(--cell-px)] py-[var(--cell-py)] border-r border-border/30">
      <div
        className="rounded-sm bg-muted/60 animate-pulse motion-reduce:animate-none"
        style={{ width, height }}
      />
    </TableCell>
  )
}
