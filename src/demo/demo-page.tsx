import { DataGrid } from "../components/data-grid"
import {
  generateMockBomData,
  generateMockRootNodes,
  generateMockChildren,
  fetchBomPage,
  fetchBomInfinitePage,
} from "../utils/mock-data"
import { demoBomColumns } from "./demo-columns"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs"
import type { GridColumnDef } from "../types/column-types"
import type { GridRow } from "../types/grid-types"

// Flat mode — 200 rows (no virtualization needed for demo)
const flatData = generateMockBomData(200)

// Tree mode — root nodes only (children fetched lazily)
const treeRootData = generateMockRootNodes(50)

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function simulateUpdateCell(
  _rowId: string,
  _columnId: string,
  _value: unknown,
): Promise<void> {
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
    <div className="p-6 min-h-screen bg-background">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">BOM Data Grid — Phase 8</h1>
        <p className="text-sm text-muted-foreground">
          Flat · Paginated · Infinite scroll · Tree
        </p>
      </div>

      <Tabs defaultValue="infinite">
        <TabsList className="mb-4">
          <TabsTrigger value="flat">Flat</TabsTrigger>
          <TabsTrigger value="paginated">Paginated</TabsTrigger>
          <TabsTrigger value="infinite">Infinite</TabsTrigger>
          <TabsTrigger value="tree">Tree (BOM)</TabsTrigger>
        </TabsList>

        <TabsContent value="flat">
          <DataGrid
            key="flat"
            data={flatData}
            columns={demoBomColumns as GridColumnDef<GridRow>[]}
            mode="flat"
            density="normal"
            features={{
              ...allFeatures,
              sorting: { enabled: true, mode: "client" },
              filtering: { enabled: true, mode: "client", filterRow: true },
              grouping: { enabled: true },
              virtualization: { enabled: true, rowHeight: 40, overscan: 5 },
            }}
          />
        </TabsContent>

        <TabsContent value="paginated">
          <DataGrid
            key="paginated"
            queryKey={["bom-paginated"]}
            queryFn={fetchBomPage as unknown as Parameters<typeof DataGrid>[0]["queryFn"]}
            columns={demoBomColumns as GridColumnDef<GridRow>[]}
            mode="paginated"
            density="normal"
            features={allFeatures}
          />
        </TabsContent>

        <TabsContent value="infinite">
          <DataGrid
            key="infinite"
            queryKey={["bom-infinite"]}
            queryFn={fetchBomInfinitePage as unknown as Parameters<typeof DataGrid>[0]["queryFn"]}
            columns={demoBomColumns as GridColumnDef<GridRow>[]}
            mode="infinite"
            density="normal"
            features={{
              ...allFeatures,
              virtualization: { enabled: true, rowHeight: 40, overscan: 5 },
            }}
          />
        </TabsContent>

        <TabsContent value="tree">
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
              ...allFeatures,
              sorting: { enabled: true, mode: "client" },
              filtering: { enabled: true, mode: "client", filterRow: true },
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
