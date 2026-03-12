import type { TableConfig } from "@/components/data-grid/table-engine/types"

/**
 * Demo BOM table config using the table engine.
 * Demonstrates:
 * - Two API sources with a dependency (suppliers depends on bom)
 * - JSONata transform ($.items extracts the items array)
 * - Dynamic supplier URL built from bom data
 * - Derived column (totalCost = quantity * unitPrice, computed before render)
 * - Secondary source join (supplierName joined from suppliers source)
 * - Tree mode with subRowsField
 * - Per-column feature overrides (orderable:false, filterable:false, visible:false)
 * - DepthRule editable (description only editable at depth >= 1 / leaf rows)
 */
export const bomEngineConfig: TableConfig = {
  id: "bom-engine-demo",
  mode: "tree",
  dataSources: [
    {
      id: "bom",
      url: "/api/demo/bom",
      transform: "$.items",
    },
    {
      id: "suppliers",
      // Build URL using unique supplier IDs from bom rows
      url: '"/api/demo/suppliers?ids=" & $join($distinct($sources.bom.supplierId), ",")',
      dependsOn: ["bom"],
      transform: "$.suppliers",
    },
  ],
  columns: [
    {
      field: "partNumber",
      header: "Part #",
      type: "string",
      pinned: "left",
      orderable: false,
      resizable: false,
      copyable: true,
      editable: false,
    },
    {
      field: "description",
      header: "Description",
      type: "string",
      width: 260,
      editable: { minDepth: 1 }, // leaf rows only
    },
    {
      field: "quantity",
      header: "Qty",
      type: "number",
      width: 80,
      editable: true,
      filterable: false,
    },
    {
      field: "unitPrice",
      header: "Unit Price",
      type: "number",
      meta: { format: "currency" },
      editable: true,
    },
    {
      field: "totalCost",
      header: "Total Cost",
      type: "number",
      meta: { format: "currency" },
      valueExpr: "$row.quantity * $row.unitPrice",
      editable: false,
      sortable: false,
      filterable: false,
    },
    {
      field: "supplierName",
      header: "Supplier",
      type: "string",
      dataSource: "suppliers",
      joinOn: { rowField: "supplierId", sourceKey: "id", sourceField: "name" },
      filterable: true,
      editable: false,
      copyable: true,
    },
    {
      field: "supplierCountry",
      header: "Supplier Country",
      type: "string",
      dataSource: "suppliers",
      joinOn: {
        rowField: "supplierId",
        sourceKey: "id",
        sourceField: "country",
      },
      filterable: true,
      editable: false,
    },
    {
      field: "status",
      header: "Status",
      type: "select",
      meta: {
        options: [
          { value: "active", label: "Active" },
          { value: "draft", label: "Draft" },
          { value: "obsolete", label: "Obsolete" },
          { value: "review", label: "Review" },
        ],
      },
      editable: true,
    },
    {
      field: "isActive",
      header: "Active",
      type: "boolean",
      meta: { renderAs: "badge" },
      editable: true,
      width: 90,
    },
    {
      field: "internalCode",
      header: "Code",
      type: "code",
      visible: false, // hidden by default
      copyable: true,
      editable: false,
    },
    {
      field: "createdAt",
      header: "Created",
      type: "date",
      editable: false,
    },
  ],
  options: {
    subRowsField: "children",
  },
  features: {
    sorting: { enabled: true },
    filtering: { enabled: true, filterRow: true },
    editing: { enabled: true },
    selection: { enabled: true, mode: "multi" },
    columnPinning: { enabled: true },
    columnOrdering: { enabled: true },
    columnResizing: { enabled: true },
    columnVisibility: { enabled: true },
    loading: { enabled: true, skeletonRows: 6 },
  },
}
