import React from "react"
import type { RowPinningState, OnChangeFn } from "@tanstack/react-table"
import type { RowPinningFeatureConfig } from "@/types/grid-types"

export function useRowPinning(_config: RowPinningFeatureConfig | undefined) {
  const [rowPinning, setRowPinning] = React.useState<RowPinningState>({})

  const handleRowPinningChange: OnChangeFn<RowPinningState> =
    React.useCallback((updater) => {
      setRowPinning((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      )
    }, [])

  const tableOptions = {
    enableRowPinning: true,
    keepPinnedRows: true,
    onRowPinningChange: handleRowPinningChange,
  }

  return { rowPinning, tableOptions }
}
