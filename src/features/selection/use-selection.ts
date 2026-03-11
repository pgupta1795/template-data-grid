import React from "react"
import type { RowSelectionState, OnChangeFn } from "@tanstack/react-table"
import type { SelectionFeatureConfig } from "@/types/grid-types"

export function useSelection(config: SelectionFeatureConfig | undefined) {
  const mode = config?.mode ?? "multi"

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> =
    React.useCallback((updater) => {
      setRowSelection((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      )
    }, [])

  const clearSelection = React.useCallback(() => setRowSelection({}), [])

  const tableOptions = {
    enableRowSelection: true,
    enableMultiRowSelection: mode === "multi",
    onRowSelectionChange: handleRowSelectionChange,
  }

  return { rowSelection, clearSelection, tableOptions }
}
