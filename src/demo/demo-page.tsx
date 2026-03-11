import React from "react"
import { DataGrid } from "../components/data-grid"
import {
  generateMockBomData,
  generateMockRootNodes,
  generateMockChildren,
} from "../utils/mock-data"
import { demoBomColumns } from "./demo-columns"
import type { GridColumnDef } from "../types/column-types"
import type { GridRow } from "../types/grid-types"

// Flat mode — 10k rows, fully virtualized
const flatData = generateMockBomData(10000)

// Tree mode — root nodes only (children fetched lazily)
const treeRootData = generateMockRootNodes(50)

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type TabKey = "flat" | "tree"

export function DemoPage() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("flat")

  return (
    <div className="p-6 min-h-screen bg-background">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">
          BOM Data Grid — Phase 5
        </h1>
        <p className="text-sm text-muted-foreground">
          Tree mode · Lazy expand · Row & Column Virtualization
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(["flat", "tree"] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded text-sm font-medium border transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "flat"
              ? "Flat — 10k rows virtualized"
              : "Tree — lazy expand"}
          </button>
        ))}
      </div>

      {activeTab === "flat" && (
        <DataGrid
          key="flat"
          data={flatData}
          columns={demoBomColumns as GridColumnDef<GridRow>[]}
          mode="flat"
          density="normal"
          features={{
            sorting: { enabled: true, mode: "client" },
            filtering: { enabled: true, mode: "client", filterRow: true },
            selection: { enabled: true, mode: "multi" },
            columnPinning: { enabled: true },
            rowPinning: { enabled: true },
            grouping: { enabled: true },
            virtualization: { enabled: true, rowHeight: 40, overscan: 5 },
          }}
        />
      )}

      {activeTab === "tree" && (
        <DataGrid
          key="tree"
          data={treeRootData}
          columns={demoBomColumns as GridColumnDef<GridRow>[]}
          mode="tree"
          density="normal"
          getSubRows={(row) => row.children as GridRow[] | undefined}
          onExpand={async (row) => {
            await delay(400 + Math.random() * 300)
            return generateMockChildren(
              row.id,
              5 + Math.floor(Math.random() * 10),
            )
          }}
          features={{
            sorting: { enabled: true, mode: "client" },
            filtering: { enabled: true, mode: "client", filterRow: true },
            selection: { enabled: true, mode: "multi" },
            columnPinning: { enabled: true },
          }}
        />
      )}
    </div>
  )
}
