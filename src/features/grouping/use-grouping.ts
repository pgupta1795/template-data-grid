import React from "react"
import type {
  GroupingState,
  ExpandedState,
  OnChangeFn,
} from "@tanstack/react-table"
import type { GroupingFeatureConfig } from "@/types/grid-types"

export function useGrouping(_config: GroupingFeatureConfig | undefined) {
  const [grouping, setGrouping] = React.useState<GroupingState>([])
  const [expanded, setExpanded] = React.useState<ExpandedState>({})

  const handleGroupingChange: OnChangeFn<GroupingState> = React.useCallback(
    (updater) => {
      setGrouping((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      )
    },
    [],
  )

  const handleExpandedChange: OnChangeFn<ExpandedState> = React.useCallback(
    (updater) => {
      setExpanded((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      )
    },
    [],
  )

  const tableOptions = {
    enableGrouping: true,
    groupedColumnMode: "reorder" as const,
    onGroupingChange: handleGroupingChange,
    onExpandedChange: handleExpandedChange,
    autoResetExpanded: false,
  }

  return { grouping, expanded, tableOptions }
}
