import { DataGrid } from '../components/data-grid'
import { generateMockBomData } from '../utils/mock-data'
import { demoBomColumns } from './demo-columns'
import type { GridColumnDef } from '../types/column-types'
import type { GridRow } from '../types/grid-types'

const data = generateMockBomData(200)

export function DemoPage() {
  return (
    <div className="p-6 min-h-screen bg-background">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">BOM Data Grid — Phase 2</h1>
        <p className="text-sm text-muted-foreground">Flat mode · 200 rows · All 9 column types</p>
      </div>
      <DataGrid
        data={data}
        columns={demoBomColumns as GridColumnDef<GridRow>[]}
        mode="flat"
        density="normal"
      />
    </div>
  )
}
