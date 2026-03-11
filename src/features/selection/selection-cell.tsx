import type { ColumnDef, Table, Row } from "@tanstack/react-table"
import type { GridRow } from "@/types/grid-types"
import { Checkbox } from "@/components/ui/checkbox"

function SelectAllCheckbox({ table }: { table: Table<GridRow> }) {
  const isAll = table.getIsAllRowsSelected()
  const isSome = table.getIsSomeRowsSelected()

  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={isAll}
        indeterminate={isSome && !isAll}
        onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
        aria-label="Select all rows"
        className="h-3.5 w-3.5"
      />
    </div>
  )
}

function SelectRowCheckbox({ row }: { row: Row<GridRow> }) {
  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
        className="h-3.5 w-3.5"
      />
    </div>
  )
}

export const selectionColumnDef: ColumnDef<GridRow> = {
  id: "__select__",
  size: 40,
  maxSize: 40,
  enableSorting: false,
  enableResizing: false,
  enableHiding: false,
  enableGrouping: false,
  header: ({ table }) => (
    <SelectAllCheckbox table={table as Table<GridRow>} />
  ),
  cell: ({ row }) => (
    <SelectRowCheckbox row={row as Row<GridRow>} />
  ),
}
