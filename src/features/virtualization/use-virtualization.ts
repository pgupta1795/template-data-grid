import React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { Virtualizer } from "@tanstack/react-virtual"
import type { GridDensity } from "@/types/grid-types"

export const DENSITY_ROW_HEIGHTS: Record<GridDensity, number> = {
  compact: 32,
  normal: 40,
  comfortable: 52,
}

export type RowVirtualizerInstance = Virtualizer<HTMLDivElement, Element>
export type ColVirtualizerInstance = Virtualizer<HTMLDivElement, Element>

interface RowVirtualizerConfig {
  enabled: boolean
  rowCount: number
  density: GridDensity
  rowHeight?: number
  containerRef: React.RefObject<HTMLDivElement | null>
  overscan?: number
}

interface ColVirtualizerConfig {
  enabled: boolean
  columns: { getSize: () => number }[]
  containerRef: React.RefObject<HTMLDivElement | null>
  overscan?: number
}

export function useRowVirtualizer(
  config: RowVirtualizerConfig,
): RowVirtualizerInstance {
  const rowHeight =
    config.rowHeight ?? DENSITY_ROW_HEIGHTS[config.density]
  return useVirtualizer({
    count: config.enabled ? config.rowCount : 0,
    getScrollElement: () => config.containerRef.current,
    estimateSize: () => rowHeight,
    overscan: config.overscan ?? 5,
  })
}

export function useColVirtualizer(
  config: ColVirtualizerConfig,
): ColVirtualizerInstance {
  return useVirtualizer({
    horizontal: true,
    count: config.enabled ? config.columns.length : 0,
    getScrollElement: () => config.containerRef.current,
    estimateSize: (i) => config.columns[i]?.getSize() ?? 150,
    overscan: config.overscan ?? 3,
  })
}
