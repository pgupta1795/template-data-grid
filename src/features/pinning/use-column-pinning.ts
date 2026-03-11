import React from "react"
import type { ColumnPinningState, OnChangeFn } from "@tanstack/react-table"
import type { ColumnPinningFeatureConfig } from "@/types/grid-types"

export function useColumnPinning(_config: ColumnPinningFeatureConfig | undefined) {
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    {},
  )

  const handleColumnPinningChange: OnChangeFn<ColumnPinningState> =
    React.useCallback((updater) => {
      setColumnPinning((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      )
    }, [])

  const tableOptions = {
    enableColumnPinning: true,
    onColumnPinningChange: handleColumnPinningChange,
  }

  return { columnPinning, tableOptions }
}
