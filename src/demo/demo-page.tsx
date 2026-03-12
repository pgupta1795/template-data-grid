import { DataGrid } from "../components/data-grid"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import type { GridColumnDef } from "../types/column-types"
import type { GridRow } from "../types/grid-types"
import {
  fetchBomInfinitePage,
  fetchBomPage,
  generateMockBomData,
  generateMockChildren,
  generateMockRootNodes,
} from "../utils/mock-data"
import { demoBomColumns } from "./demo-columns"
import { ConfiguredTable } from "../lib/table-engine/configured-table"
import { bomEngineConfig } from "./bom-engine-config"


// Flat mode — 10k rows, fully virtualized
const flatData = generateMockBomData(10000)

// Tree mode — root nodes only (children fetched lazily)
const treeRootData = generateMockRootNodes(50)

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function simulateUpdateCell(
  _rowId: string,
  _columnId: string,
  _value: unknown
): Promise<void> {
  void _rowId
  void _columnId
  void _value
  await delay(600 + Math.random() * 400)
  if (Math.random() < 0.1) {
    throw new Error(`Simulated save failure`)
  }
}

const allFeatures = {
  sorting: { enabled: true },
  filtering: { enabled: true, filterRow: true },
  selection: { enabled: true, mode: "multi" as const },
  columnPinning: { enabled: true },
  editing: {
    enabled: true,
    onMutate: simulateUpdateCell,
    onError: (err: unknown) => console.error("[grid mutation error]", err),
  },
  loading: { enabled: true, skeletonRows: 10 },
}

export function DemoPage() {
  return (
    <div className="flex h-screen max-h-screen flex-col overflow-hidden bg-background p-4">
      <div className="mb-4 shrink-0">
        <h1 className="text-lg font-semibold">BOM Data Grid — Phase 8</h1>
        <p className="text-sm text-muted-foreground">
          Flat · Paginated · Infinite scroll · Tree
        </p>
      </div>

      <Tabs defaultValue="infinite" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mb-4 shrink-0">
          <TabsTrigger value="flat">Flat</TabsTrigger>
          <TabsTrigger value="paginated">Paginated</TabsTrigger>
          <TabsTrigger value="infinite">Infinite</TabsTrigger>
          <TabsTrigger value="tree">Tree (BOM)</TabsTrigger>
          <TabsTrigger value="engine">Engine (Config)</TabsTrigger>
        </TabsList>

        <TabsContent
          value="flat"
          className="min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
        >
          <DataGrid
            key="flat"
            data={flatData}
            columns={demoBomColumns as GridColumnDef<GridRow>[]}
            mode="flat"
            density="normal"
            className="h-full min-h-0 flex-1"
            features={{
              ...allFeatures,
              sorting: { enabled: true, mode: "client" },
              filtering: { enabled: true, mode: "client", filterRow: true },
              grouping: { enabled: true },
              virtualization: { enabled: true, overscan: 5 },
            }}
          />
        </TabsContent>

        <TabsContent
          value="paginated"
          className="min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
        >
          <DataGrid
            key="paginated"
            queryKey={["bom-paginated"]}
            queryFn={
              fetchBomPage as unknown as Parameters<
                typeof DataGrid
              >[0]["queryFn"]
            }
            columns={demoBomColumns as GridColumnDef<GridRow>[]}
            mode="paginated"
            density="normal"
            className="h-full min-h-0 flex-1"
            features={allFeatures}
          />
        </TabsContent>

        <TabsContent
          value="infinite"
          className="min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
        >
          <DataGrid
            key="infinite"
            queryKey={["bom-infinite"]}
            queryFn={
              fetchBomInfinitePage as unknown as Parameters<
                typeof DataGrid
              >[0]["queryFn"]
            }
            columns={demoBomColumns as GridColumnDef<GridRow>[]}
            mode="infinite"
            density="normal"
            className="h-full min-h-0 flex-1"
            features={{
              ...allFeatures,
              virtualization: { enabled: true, overscan: 5 },
            }}
          />
        </TabsContent>

        <TabsContent
          value="tree"
          className="min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col"
        >
          <DataGrid
            key="tree"
            data={treeRootData}
            columns={demoBomColumns as GridColumnDef<GridRow>[]}
            mode="tree"
            density="normal"
            className="h-full min-h-0 flex-1"
            getSubRows={(row) => row.children as GridRow[] | undefined}
            onExpand={async (row) => {
              await delay(400 + Math.random() * 300)
              return generateMockChildren(
                row.id,
                5 + Math.floor(Math.random() * 10)
              )
            }}
            features={{
              ...allFeatures,
              sorting: { enabled: true, mode: "client" },
              filtering: { enabled: true, mode: "client", filterRow: true },
            }}
          />
        </TabsContent>

        <TabsContent
          value="engine"
          className="min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col h-[600px]"
        >
          <ConfiguredTable config={bomEngineConfig} className="h-full min-h-0 flex-1" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
