# Data Grid Docs + CLAUDE.md Update Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update CLAUDE.md to reflect consolidated data-grid structure and create comprehensive consumer-focused documentation in `src/components/data-grid/docs/` with progressive examples, config-driven patterns, and full feature walkthroughs.

**Architecture:**
- Update CLAUDE.md to accurately map the new consolidated `src/components/data-grid/` structure
- Create modular markdown docs with README index hub
- Build progressive walkthrough example showing feature layering
- Document all four data modes (flat, paginated, infinite, tree) with both raw props and config approaches
- Establish hyperlink nav strategy connecting all docs

**Tech Stack:** Markdown, React/TypeScript examples, mock data from `src/utils/mock-data.ts`

---

## File Structure

```
MODIFIED:
- CLAUDE.md (update paths and architecture description)

CREATE:
- src/components/data-grid/docs/README.md (index hub)
- src/components/data-grid/docs/01-quick-start.md
- src/components/data-grid/docs/02-progressive-walkthrough.md
- src/components/data-grid/docs/03-features/
  ├── sorting.md
  ├── filtering.md
  ├── selection.md
  ├── pinning.md
  ├── grouping.md
  ├── editing.md
  ├── tree-expansion.md
  └── virtualization.md
- src/components/data-grid/docs/04-data-modes-non-config/
  ├── flat-mode.md
  ├── paginated-mode.md
  ├── infinite-mode.md
  └── tree-mode.md
- src/components/data-grid/docs/05-config-driven-tables/
  ├── config-basics.md
  ├── jsonata-transforms.md
  ├── flat-table-config.md
  ├── infinite-table-config.md
  ├── tree-table-config.md
  └── config-api-reference.md
- src/components/data-grid/docs/06-customization/
  ├── custom-columns.md
  ├── custom-editors.md
  ├── styling-theming.md
  └── custom-features.md
- src/components/data-grid/docs/07-api-reference.md
```

---

## Chunk 1: Update CLAUDE.md with Consolidated Structure

### Task 1: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (lines 23-50, 131-239, 332-344)

**Purpose:** Reflect that core data-grid logic is now consolidated in `src/components/data-grid/` with subdirectories for columns, editors, features, hooks, types, utils, and table-engine.

- [ ] **Step 1: Update Top-Level Runtime Flow section**

Current (lines 27-36) shows `src/features/*` scattered. Update to show consolidated flow:

```markdown
### Top-Level Runtime Flow

```text
src/main.tsx
  -> src/App.tsx
    -> src/demo/demo-page.tsx
      -> src/components/data-grid/data-grid.tsx
        -> src/components/data-grid/hooks/use-data-grid.ts
          -> src/components/data-grid/features/*
            -> TanStack Table + Query + Virtual state
              -> grid subcomponents render headers, rows, toolbar, pagination
```
```

- [ ] **Step 2: Update Core Architectural Idea section**

Current (lines 40-50) mentions `src/features/*` and `src/columns/*` separately. Update to reflect consolidated under data-grid:

```markdown
### Core Architectural Idea

The main architectural split is:

1. `src/components/data-grid/hooks/use-data-grid.ts` is the orchestration layer
2. `src/components/data-grid/features/*` contains isolated feature behavior hooks
3. `src/components/data-grid/` contains render-layer components
4. `src/components/data-grid/columns/*` contains typed column factory helpers
5. `src/components/data-grid/editors/*` contains inline editing UI by column type
6. `src/components/data-grid/types/*` defines the grid contracts that keep the layers aligned
7. `src/components/data-grid/table-engine/` contains the config-driven table engine (Phase 14+)

That separation lets the grid support many behaviors without collapsing all
logic into a single component.
```

- [ ] **Step 3: Update Folder Structure section**

Replace lines 133-240 with consolidated structure showing data-grid subdirectories:

```markdown
## Folder Structure

```text
.
|-- AGENTS.md
|-- CLAUDE.md
|-- README.md
|-- components.json
|-- eslint.config.js
|-- index.html
|-- package-lock.json
|-- package.json
|-- tsconfig.app.json
|-- tsconfig.json
|-- tsconfig.node.json
|-- vite.config.ts
|-- docs/
|   `-- superpowers/
|       |-- plans/
|       |   |-- phase-01-foundation.md
|       |   |-- ... (phases 2-14)
|       `-- specs/
|           |-- 2026-03-11-data-grid-design.md
|           |-- 2026-03-12-table-engine-design.md
|           `-- 2026-03-12-data-grid-docs-design.md
`-- src/
    |-- App.tsx
    |-- index.css
    |-- main.tsx
    |-- assets/
    |-- components/
    |   |-- theme-provider.tsx
    |   `-- data-grid/
    |       |-- data-grid.tsx
    |       |-- data-grid-context.tsx
    |       |-- data-grid-cell.tsx
    |       |-- data-grid-header.tsx
    |       |-- data-grid-row.tsx
    |       |-- data-grid-toolbar.tsx
    |       |-- data-grid-pagination.tsx
    |       |-- data-grid-skeleton.tsx
    |       |-- data-grid-row-skeleton.tsx
    |       |-- data-grid-empty.tsx
    |       |-- index.ts
    |       |-- columns/
    |       |   |-- string-column.tsx
    |       |   |-- number-column.tsx
    |       |   |-- boolean-column.tsx
    |       |   |-- date-column.tsx
    |       |   |-- select-column.tsx
    |       |   |-- multi-value-column.tsx
    |       |   |-- code-column.tsx
    |       |   `-- index.ts
    |       |-- editors/
    |       |   |-- text-editor.tsx
    |       |   |-- number-editor.tsx
    |       |   |-- boolean-editor.tsx
    |       |   |-- date-editor.tsx
    |       |   |-- select-editor.tsx
    |       |   |-- chip-editor.tsx
    |       |   |-- code-editor.tsx
    |       |   `-- get-editor.ts
    |       |-- features/
    |       |   |-- sorting/
    |       |   |-- filtering/
    |       |   |-- selection/
    |       |   |-- pinning/
    |       |   |-- grouping/
    |       |   |-- editing/
    |       |   |-- tree/
    |       |   |-- virtualization/
    |       |   |-- loading/
    |       |   `-- ordering/
    |       |-- hooks/
    |       |   |-- use-data-grid.ts
    |       |   `-- (other hooks as needed)
    |       |-- types/
    |       |   |-- grid-types.ts
    |       |   |-- column-types.ts
    |       |   |-- filter-types.ts
    |       |   |-- editor-types.ts
    |       |   |-- sort-types.ts
    |       |   |-- slot-types.ts
    |       |   `-- index.ts
    |       |-- table-engine/
    |       |   |-- configured-table.tsx
    |       |   `-- (config-driven engine files)
    |       |-- utils/
    |       |   |-- grid-utils.ts
    |       |   `-- (other utils)
    |       `-- docs/
    |           |-- README.md
    |           |-- 01-quick-start.md
    |           |-- 02-progressive-walkthrough.md
    |           |-- 03-features/
    |           |-- 04-data-modes-non-config/
    |           |-- 05-config-driven-tables/
    |           |-- 06-customization/
    |           `-- 07-api-reference.md
    |-- demo/
    |   |-- demo-columns.ts
    |   `-- demo-page.tsx
    |-- hooks/
    |   |-- use-column-resize.ts
    |   |-- use-infinite-data.ts
    |   `-- use-mobile.ts
    |-- lib/
    |   `-- utils.ts
    |-- types/
    |   `-- (global types if any)
    `-- utils/
        |-- csv-export.ts
        |-- formatters.ts
        |-- mock-data.ts
        `-- grid-utils.ts
```
```

- [ ] **Step 4: Update Directory Responsibilities section**

Update `src/components/data-grid/` description (lines 244-257) to reflect consolidated structure:

```markdown
### `src/components/data-grid/`

Core data-grid implementation. This folder contains everything needed for the grid:

**Core Components:**
- `data-grid.tsx`: public grid component, provider setup, body rendering, drag-and-drop column ordering, density variables
- `data-grid-context.tsx`: shared context contract between hook and UI
- `data-grid-header.tsx`: header rendering, sorting/filter UI
- `data-grid-row.tsx` and `data-grid-cell.tsx`: row/cell presentation
- `data-grid-toolbar.tsx`: global controls
- `data-grid-pagination.tsx`: pagination mode footer
- skeleton and empty-state files: loading and zero-data UX

**Subdirectories:**
- `hooks/`: `use-data-grid.ts` (main orchestration hook) and related hooks
- `features/`: Feature hooks for sorting, filtering, selection, pinning, grouping, editing, tree, virtualization, loading, ordering
- `columns/`: Typed column factories (string, number, boolean, date, select, multi-value, code)
- `editors/`: Inline edit components for each column type
- `types/`: TypeScript contracts for grid config, columns, filters, editors
- `table-engine/`: Config-driven table engine (Phase 14+)
- `utils/`: Grid utilities
- `docs/`: Consumer-focused documentation (quick start, features, examples, API reference)

This folder should be read as the complete grid system: render layer + business logic + configuration + documentation.
```

- [ ] **Step 5: Update Important Files To Read First section**

Update lines 334-344 to reflect new paths:

```markdown
## Important Files To Read First

If a new contributor wants the fastest high-signal reading order:

1. `package.json`
2. `src/demo/demo-page.tsx`
3. `src/components/data-grid/data-grid.tsx`
4. `src/components/data-grid/hooks/use-data-grid.ts`
5. `src/components/data-grid/types/grid-types.ts`
6. `src/components/data-grid/types/column-types.ts`
7. `src/demo/demo-columns.ts`
8. `src/components/data-grid/features/*` folders relevant to the behavior being changed
9. `docs/superpowers/specs/2026-03-12-table-engine-design.md`
10. `src/components/data-grid/docs/README.md` (for usage and integration)
```

- [ ] **Step 6: Update Practical Summary section**

Replace lines 369-379 with:

```markdown
## Practical Summary

This repo is best understood as:

- **Render layer** in `src/components/data-grid/*.tsx` — view and user interaction
- **Business logic** in `src/components/data-grid/features/*` and `src/components/data-grid/hooks/` — sorting, filtering, selection, etc.
- **Configuration** in `src/components/data-grid/types/*` — contracts that bind layers
- **Column factories** in `src/components/data-grid/columns/*` — ergonomic API for column definitions
- **Editors** in `src/components/data-grid/editors/*` — inline editing UI
- **Table engine** in `src/components/data-grid/table-engine/` — declarative, config-driven abstraction (Phase 14+)
- **Documentation** in `src/components/data-grid/docs/` — usage guide, examples, API reference

**Quick navigation:**
- Changing rendering? → `src/components/data-grid/*.tsx`
- Changing behavior? → `src/components/data-grid/features/*` and `src/components/data-grid/hooks/use-data-grid.ts`
- Changing public API? → `src/components/data-grid/types/*` and `src/components/data-grid/columns/*`
- Learning to use the grid? → `src/components/data-grid/docs/README.md`
```

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md to reflect consolidated data-grid structure"
```

---

## Chunk 2: Create Documentation Folder Structure and Index

### Task 2: Create docs folder and README index hub

**Files:**
- Create: `src/components/data-grid/docs/README.md`

**Purpose:** Single entry point with hyperlinks to all documentation paths.

- [ ] **Step 1: Create docs directory**

```bash
mkdir -p "src/components/data-grid/docs/03-features" "src/components/data-grid/docs/04-data-modes-non-config" "src/components/data-grid/docs/05-config-driven-tables" "src/components/data-grid/docs/06-customization"
```

- [ ] **Step 2: Create README.md**

Create `src/components/data-grid/docs/README.md`:

```markdown
# DataGrid Documentation

Welcome to the DataGrid documentation. Choose your path below:

## Quick Navigation

- **Just getting started?** → [Quick Start (5 min)](01-quick-start.md)
- **Learn by example?** → [Progressive Walkthrough](02-progressive-walkthrough.md) — watch features layer
- **Feature reference?** → [Features](#features) below
- **See all data modes?** → [Data Modes (Raw Props)](#data-modes-raw-props)
- **Config-driven approach?** → [Config & JSONata](#config-driven-tables)
- **Extend the grid?** → [Customization](#customization)
- **Full API?** → [API Reference](07-api-reference.md)

---

## What This DataGrid Does

The DataGrid is a headless-but-opinionated React table component for building sophisticated data experiences:

- **Local data**: Sort, filter, group, select across 10k+ rows with virtualization
- **Server-side data**: Paginated or cursor-based infinite loading
- **Hierarchical data**: Tree mode with lazy async expansion
- **Inline editing**: Optimistic mutations with error handling
- **Flexible columns**: String, number, boolean, date, select, multi-value, code types
- **Column control**: Reorder, pin, resize, hide/show

Choose your data mode (flat, paginated, infinite, tree) and feature set. Start simple, add complexity.

---

## Which Mode Should I Use?

| Mode | Best For | Example |
|------|----------|---------|
| **flat** | Local data, all rows in memory | 10k user records, client-side sort/filter |
| **paginated** | Server-driven pages | Users table, load 50/page from API |
| **infinite** | Cursor/offset based incremental load | Social feed, load more on scroll |
| **tree** | Hierarchical data, lazy children | Org chart, file explorer with async subfolders |

---

## Features

- [Sorting](03-features/sorting.md) — Click headers to sort ascending/descending/clear
- [Filtering](03-features/filtering.md) — Column-specific filters with operators
- [Selection](03-features/selection.md) — Checkbox rows, select all, track selected
- [Pinning](03-features/pinning.md) — Pin columns left/right, rows top/bottom
- [Grouping](03-features/grouping.md) — Group rows by column, expand/collapse groups
- [Editing](03-features/editing.md) — Inline edit cells, async mutations, optimistic updates
- [Tree Expansion](03-features/tree-expansion.md) — Hierarchical rows, lazy child load
- [Virtualization](03-features/virtualization.md) — Render 10k rows smoothly with row/col virtual scrolling

---

## Data Modes (Raw Props)

Full, runnable examples without config abstraction:

- [Flat Mode](04-data-modes-non-config/flat-mode.md) — Local data, all features
- [Paginated Mode](04-data-modes-non-config/paginated-mode.md) — Server-driven page loading
- [Infinite Mode](04-data-modes-non-config/infinite-mode.md) — Cursor-based incremental load
- [Tree Mode](04-data-modes-non-config/tree-mode.md) — Hierarchical rows with lazy expand

---

## Config-Driven Tables

Declarative approach using JSON config + JSONata transforms:

- [Config Basics](05-config-driven-tables/config-basics.md) — When to use config vs raw props
- [JSONata Transforms](05-config-driven-tables/jsonata-transforms.md) — Field mapping, conditions, transforms
- [Flat Table Config](05-config-driven-tables/flat-table-config.md) — Full config example
- [Infinite Table Config](05-config-driven-tables/infinite-table-config.md) — Config + cursor-based fetch
- [Tree Table Config](05-config-driven-tables/tree-table-config.md) — Config + lazy hierarchy
- [Config API Reference](05-config-driven-tables/config-api-reference.md) — Full config schema

---

## Customization

Extend the grid with your own columns, editors, features:

- [Custom Columns](06-customization/custom-columns.md) — Create column types beyond defaults
- [Custom Editors](06-customization/custom-editors.md) — Inline edit UX for your data types
- [Styling & Theming](06-customization/styling-theming.md) — CSS variables, dark mode, density
- [Custom Features](06-customization/custom-features.md) — Write feature hooks

---

## Full API Reference

[API Reference](07-api-reference.md) — DataGrid component props, column factories, types, hooks

---

## Example: Quick Start

```tsx
import { DataGrid } from "@/components/data-grid";
import { stringColumn, numberColumn } from "@/components/data-grid/columns";

const data = [
  { id: 1, name: "Alice", age: 30 },
  { id: 2, name: "Bob", age: 25 },
];

const columns = [
  stringColumn("name", "Name"),
  numberColumn("age", "Age"),
];

export default function App() {
  return <DataGrid data={data} columns={columns} mode="flat" />;
}
```

Rendered:

```
┌─────┬──────┬─────┐
│ ID  │ Name │ Age │
├─────┼──────┼─────┤
│ 1   │ Alice│ 30  │
│ 2   │ Bob  │ 25  │
└─────┴──────┴─────┘
```

Ready? Start with [Quick Start](01-quick-start.md) or [Progressive Walkthrough](02-progressive-walkthrough.md).

---

## Architecture

The DataGrid is organized as:

- **`data-grid.tsx`** — Public component, provider setup, rendering
- **`hooks/use-data-grid.ts`** — Orchestration hook, composes all features
- **`features/`** — Modular behavior: sorting, filtering, selection, etc.
- **`columns/`** — Typed column factories
- **`editors/`** — Inline edit components
- **`types/`** — TypeScript contracts
- **`table-engine/`** — Config-driven engine (Phase 14+)

[Learn more](../../README.md) about the overall codebase structure in CLAUDE.md.

---

## Need Help?

- **How do I use this?** → [Quick Start](01-quick-start.md)
- **I need to understand features** → Pick a [feature](03-features/) or see [Progressive Walkthrough](02-progressive-walkthrough.md)
- **I want to use config** → [Config Basics](05-config-driven-tables/config-basics.md)
- **I need to customize** → [Customization](06-customization/)
- **What are all the props?** → [API Reference](07-api-reference.md)

Last updated: 2026-03-12
```

- [ ] **Step 3: Commit**

```bash
git add src/components/data-grid/docs/README.md
git commit -m "docs: create data-grid docs index hub"
```

---

## Chunk 3: Quick Start and Progressive Walkthrough

### Task 3: Write Quick Start guide

**Files:**
- Create: `src/components/data-grid/docs/01-quick-start.md`

**Purpose:** 5-minute minimal example to get DataGrid rendering.

- [ ] **Step 1: Create 01-quick-start.md**

```markdown
# Quick Start (5 Minutes)

Get a DataGrid running in 5 minutes.

## 1. Import and Data

```tsx
import { DataGrid } from "@/components/data-grid";
import { stringColumn, numberColumn } from "@/components/data-grid/columns";

// Simple in-memory data
const data = [
  { id: 1, name: "Alice Chen", age: 30, department: "Engineering" },
  { id: 2, name: "Bob Smith", age: 25, department: "Design" },
  { id: 3, name: "Carol White", age: 35, department: "Sales" },
  { id: 4, name: "David Johnson", age: 28, department: "Engineering" },
  { id: 5, name: "Eve Brown", age: 32, department: "Marketing" },
];
```

## 2. Define Columns

```tsx
const columns = [
  stringColumn("name", "Name"),
  numberColumn("age", "Age"),
  stringColumn("department", "Department"),
];
```

## 3. Render

```tsx
export default function App() {
  return (
    <DataGrid
      data={data}
      columns={columns}
      mode="flat"
    />
  );
}
```

**That's it!** You now have:
- ✅ 5 rows rendering
- ✅ Column headers
- ✅ Sortable columns (click header)
- ✅ Scrollable body

## Next Steps

- **See all features?** → [Progressive Walkthrough](02-progressive-walkthrough.md)
- **Customize columns?** → [Sorting](03-features/sorting.md), [Filtering](03-features/filtering.md)
- **Use config?** → [Config Basics](05-config-driven-tables/config-basics.md)
- **All options?** → [API Reference](07-api-reference.md)

## Troubleshooting

**"DataGrid not found"** — Make sure you're importing from the right path:
```tsx
import { DataGrid } from "@/components/data-grid";
```

**"No data showing"** — Check that `data` is not empty and `columns` match your data keys.

**"Columns look wrong"** — Use the correct column factory for your data type:
```tsx
stringColumn("fieldName", "Display Label")  // text
numberColumn("fieldName", "Display Label")  // numbers
dateColumn("fieldName", "Display Label")    // dates
selectColumn("fieldName", "Display Label", options) // dropdowns
```

Ready to add more features? Continue to [Progressive Walkthrough](02-progressive-walkthrough.md).
```

- [ ] **Step 2: Commit**

```bash
git add src/components/data-grid/docs/01-quick-start.md
git commit -m "docs: add quick start guide"
```

### Task 4: Write Progressive Walkthrough

**Files:**
- Create: `src/components/data-grid/docs/02-progressive-walkthrough.md`

**Purpose:** Single evolving example showing feature layers.

- [ ] **Step 1: Create 02-progressive-walkthrough.md**

```markdown
# Progressive Walkthrough

Learn DataGrid by adding features one at a time. One example, six steps.

## Step 1: Flat Grid with Sorting

**What it is:** Local data, clickable headers to sort.

```tsx
import { DataGrid } from "@/components/data-grid";
import { stringColumn, numberColumn } from "@/components/data-grid/columns";

const data = [
  { id: 1, name: "Alice", age: 30, active: true },
  { id: 2, name: "Bob", age: 25, active: false },
  { id: 3, name: "Carol", age: 35, active: true },
];

const columns = [
  stringColumn("name", "Name"),
  numberColumn("age", "Age"),
];

export default function App() {
  return (
    <DataGrid
      data={data}
      columns={columns}
      mode="flat"
    />
  );
}
```

**Try:** Click "Name" or "Age" header to sort ascending/descending. Click again to reverse.

---

## Step 2: Add Filtering

**What changed:** Filter UI appears in column headers.

```tsx
<DataGrid
  data={data}
  columns={columns}
  mode="flat"
  features={{
    filtering: { enabled: true }
  }}
/>
```

**Try:** Click the filter icon in a header. Type a value to filter rows.

---

## Step 3: Add Selection

**What changed:** Checkboxes appear. Select rows with Ctrl+click.

```tsx
<DataGrid
  data={data}
  columns={columns}
  mode="flat"
  features={{
    filtering: { enabled: true },
    selection: { enabled: true }
  }}
/>
```

**Try:** Click row checkboxes. Click the header checkbox to select all.

---

## Step 4: Switch to Tree Mode

**What changed:** Add a hierarchy. Rows have expand buttons.

```tsx
const treeData = [
  {
    id: 1,
    name: "Alice",
    age: 30,
    children: [
      { id: 11, name: "Alice Child 1", age: 5 },
      { id: 12, name: "Alice Child 2", age: 3 },
    ],
  },
  {
    id: 2,
    name: "Bob",
    age: 25,
    children: [
      { id: 21, name: "Bob Child 1", age: 2 },
    ],
  },
];

<DataGrid
  data={treeData}
  columns={columns}
  mode="tree"
  getSubRows={(row) => row.children}
  features={{
    filtering: { enabled: true },
    selection: { enabled: true },
  }}
/>
```

**Try:** Click the expand arrow to show/hide children.

---

## Step 5: Switch to Infinite Mode

**What changed:** Rows load on demand as you scroll down.

```tsx
const fetchMore = async (pageParam = 0) => {
  // Simulate server fetch
  const offset = pageParam * 10;
  return {
    rows: data.slice(offset, offset + 10),
    nextPage: offset + 10 < data.length ? offset + 10 : null,
  };
};

<DataGrid
  queryFn={fetchMore}
  columns={columns}
  mode="infinite"
  features={{
    filtering: { enabled: true },
    selection: { enabled: true },
  }}
/>
```

**Try:** Scroll to the bottom; more rows load automatically.

---

## Step 6: Switch to Paginated Mode

**What changed:** Pagination controls appear at the bottom.

```tsx
const fetchPage = async (pageIndex = 0) => {
  const pageSize = 10;
  const offset = pageIndex * pageSize;
  return {
    rows: data.slice(offset, offset + pageSize),
    total: data.length,
  };
};

<DataGrid
  queryFn={fetchPage}
  columns={columns}
  mode="paginated"
  features={{
    filtering: { enabled: true },
    selection: { enabled: true },
  }}
/>
```

**Try:** Use the page controls to jump to different pages.

---

## What You Learned

- Step 1: Basic sorting
- Step 2: Column filtering
- Step 3: Row selection
- Step 4: Hierarchies with tree mode
- Step 5: Incremental loading with infinite mode
- Step 6: Page-based loading with paginated mode

Each feature layers on top. You can mix any features with any mode.

---

## Next: Learn Features in Depth

- [Sorting](03-features/sorting.md)
- [Filtering](03-features/filtering.md)
- [Selection](03-features/selection.md)
- [Tree Expansion](03-features/tree-expansion.md)
- [All features](README.md#features)

Or jump to your specific use case:

- [Flat Mode (full example)](04-data-modes-non-config/flat-mode.md)
- [Paginated Mode (full example)](04-data-modes-non-config/paginated-mode.md)
- [Infinite Mode (full example)](04-data-modes-non-config/infinite-mode.md)
- [Tree Mode (full example)](04-data-modes-non-config/tree-mode.md)

---

## Config Alternative

Don't like props? Use declarative config instead:

```tsx
const config = {
  name: "users",
  mode: "flat",
  columns: [
    { id: "name", type: "string", label: "Name" },
    { id: "age", type: "number", label: "Age" },
  ],
  features: {
    filtering: { enabled: true },
    selection: { enabled: true },
  },
  dataSource: {
    type: "local",
    data: data,
  },
};

<ConfiguredTable config={config} />
```

[Learn about config](05-config-driven-tables/config-basics.md).
```

- [ ] **Step 2: Commit**

```bash
git add src/components/data-grid/docs/02-progressive-walkthrough.md
git commit -m "docs: add progressive walkthrough example"
```

---

## Chunk 4: Feature Documentation

### Task 5: Create Feature Docs (Sorting, Filtering, Selection, etc.)

**Files:**
- Create: `src/components/data-grid/docs/03-features/sorting.md`
- Create: `src/components/data-grid/docs/03-features/filtering.md`
- Create: `src/components/data-grid/docs/03-features/selection.md`
- Create: `src/components/data-grid/docs/03-features/pinning.md`
- Create: `src/components/data-grid/docs/03-features/grouping.md`
- Create: `src/components/data-grid/docs/03-features/editing.md`
- Create: `src/components/data-grid/docs/03-features/tree-expansion.md`
- Create: `src/components/data-grid/docs/03-features/virtualization.md`

**Purpose:** One doc per feature, explaining use, config, raw props, API.

- [ ] **Step 1: Create sorting.md**

```markdown
# Sorting

Click column headers to sort ascending/descending/clear.

## What It Does

Sorting organizes rows by one or more columns. Click a header to:
- First click: Sort ascending
- Second click: Sort descending
- Third click: Clear sort

## When to Use

Always enabled by default. Use when rows need to be ordered by user choice (names A→Z, prices low→high, dates newest first, etc.).

## Config Example

```json
{
  "features": {
    "sorting": {
      "enabled": true,
      "defaultSort": [
        { "id": "name", "desc": false }
      ]
    }
  }
}
```

## Raw Props Example

```tsx
<DataGrid
  data={data}
  columns={columns}
  mode="flat"
  features={{
    sorting: {
      enabled: true,
      initialState: {
        sorting: [{ id: "name", desc: false }],
      },
    },
  }}
/>
```

## Behavior

- **Single-column sort** (default): Click a header to sort by that column. Clicking another header replaces the sort.
- **Multi-column sort** (with Shift): Hold Shift and click headers to add secondary sorts.
- **Sort direction**: Icon in header shows ↑ (ascending), ↓ (descending), or none (unsorted).
- **Reset**: Click a sorted header 3 times to clear the sort.

## See Also

- [Progressive Walkthrough](../02-progressive-walkthrough.md) — Step 1
- [API Reference](../07-api-reference.md) — Full sorting options

## Examples in Codebase

- `src/components/data-grid/features/sorting/` — Implementation
- `src/demo/demo-page.tsx` — Live example
```

- [ ] **Step 2: Create filtering.md**

```markdown
# Filtering

Column-specific filters narrow rows by criteria.

## What It Does

Each column can have a filter UI (text input, number range, date picker, etc.). Filter values are shown as badges. Clear a filter to reset.

## When to Use

Use filtering when you want users to narrow data:
- Search text fields (contains, starts with)
- Number ranges (between, greater than, less than)
- Date ranges (from/to)
- Dropdowns (single or multi-select)
- Boolean (true/false/all)

## Config Example

```json
{
  "features": {
    "filtering": {
      "enabled": true,
      "defaultFilters": [
        { "id": "name", "value": { "operator": "contains", "value": "Alice" } }
      ]
    }
  }
}
```

## Raw Props Example

```tsx
<DataGrid
  data={data}
  columns={columns}
  mode="flat"
  features={{
    filtering: {
      enabled: true,
      filterRow: true,  // Show filter inputs in header row
    },
  }}
/>
```

## Filter Value Shapes

- **String/Code**: `{ value: string, operator: 'contains' | 'startsWith' }`
- **Number**: `[min: number, max: number]` (range)
- **Date**: `{ from?: string, to?: string }` (ISO strings)
- **Multi-value**: `string[]` (array of tags)
- **Select**: `string[]` (array of option values)
- **Boolean**: `'true' | 'false'` (undefined = show all)

## See Also

- [Progressive Walkthrough](../02-progressive-walkthrough.md) — Step 2
- [API Reference](../07-api-reference.md) — Full filtering options

## Examples in Codebase

- `src/components/data-grid/features/filtering/` — Implementation
- `src/demo/demo-page.tsx` — Live example
```

- [ ] **Step 3: Create selection.md**

```markdown
# Selection

Checkbox rows to select, track selections for bulk actions.

## What It Does

Each row has a checkbox. Click to select/deselect. Click the header checkbox to select/deselect all visible rows. Selected row IDs are tracked and accessible.

## When to Use

Use selection when you need to:
- Perform bulk actions (delete, export, update multiple rows)
- Track which rows the user is interested in
- Combine with other features (delete selected, email selected contacts)

## Config Example

```json
{
  "features": {
    "selection": {
      "enabled": true,
      "initialSelected": ["1", "2"]
    }
  }
}
```

## Raw Props Example

```tsx
const [rowSelection, setRowSelection] = useState({});

<DataGrid
  data={data}
  columns={columns}
  mode="flat"
  features={{
    selection: {
      enabled: true,
      onSelectionChange: (selected) => setRowSelection(selected),
    },
  }}
/>
```

## Access Selected Rows

```tsx
const selectedIds = Object.keys(rowSelection).filter(
  (key) => rowSelection[key] === true
);
console.log("Selected row IDs:", selectedIds);
```

## See Also

- [Progressive Walkthrough](../02-progressive-walkthrough.md) — Step 3
- [API Reference](../07-api-reference.md) — Full selection options

## Examples in Codebase

- `src/components/data-grid/features/selection/` — Implementation
- `src/demo/demo-page.tsx` — Live example
```

- [ ] **Step 4: Create pinning.md**

```markdown
# Pinning

Pin columns left/right and rows top/bottom to keep them visible while scrolling.

## What It Does

- **Pin columns left**: Column stays visible when scrolling horizontally
- **Pin columns right**: Column stays visible on the right
- **Pin rows top**: Rows stay visible when scrolling vertically
- **Pin rows bottom**: Rows stay visible at bottom

Pinned areas have a subtle shadow border.

## When to Use

- Pin the ID or name column left so it's always visible
- Pin totals row at the bottom
- Pin header rows at top

## Config Example

```json
{
  "features": {
    "pinning": {
      "enabled": true,
      "defaultPinned": {
        "left": ["name"],
        "right": ["actions"]
      }
    }
  }
}
```

## Raw Props Example

```tsx
<DataGrid
  data={data}
  columns={columns}
  mode="flat"
  features={{
    pinning: {
      enabled: true,
      columnPinningRight: ["actions"],  // Pin actions column right
    },
  }}
/>
```

## See Also

- [API Reference](../07-api-reference.md) — Full pinning options

## Examples in Codebase

- `src/components/data-grid/features/pinning/` — Implementation
- `src/demo/demo-page.tsx` — Live example
```

- [ ] **Step 5: Create grouping.md**

```markdown
# Grouping

Group rows by column values, expand/collapse groups.

## What It Does

Rows are grouped by a column value. Each group has a header showing the group value and row count. Click to expand/collapse a group.

## When to Use

Use grouping when you want to organize rows by category:
- Group users by department
- Group transactions by date
- Group products by category

## Config Example

```json
{
  "features": {
    "grouping": {
      "enabled": true,
      "groupBy": ["department"]
    }
  }
}
```

## Raw Props Example

```tsx
<DataGrid
  data={data}
  columns={columns}
  mode="flat"
  features={{
    grouping: {
      enabled: true,
      groupBy: ["department"],
    },
  }}
/>
```

## See Also

- [API Reference](../07-api-reference.md) — Full grouping options

## Examples in Codebase

- `src/components/data-grid/features/grouping/` — Implementation
- `src/demo/demo-page.tsx` — Live example
```

- [ ] **Step 6: Create editing.md**

```markdown
# Editing

Inline edit cells with async mutation support.

## What It Does

Double-click a cell to edit. Press Enter to save or Escape to cancel. Changes are sent to your mutation handler. Pending/error states are shown.

## When to Use

Use editing when you want users to update data directly in the grid:
- Edit user names, emails, addresses
- Update product prices, quantities
- Change statuses

## Config Example

```json
{
  "features": {
    "editing": {
      "enabled": true,
      "onMutate": {
        "handler": "updateRow"
      }
    }
  }
}
```

## Raw Props Example

```tsx
const handleMutate = async (rowId, columnId, value) => {
  // Send to server
  const result = await updateApi(rowId, columnId, value);
  return result;
};

<DataGrid
  data={data}
  columns={columns}
  mode="flat"
  features={{
    editing: {
      enabled: true,
      onMutate: handleMutate,
    },
  }}
/>
```

## Editor Types

Each column type has a corresponding editor:
- `stringColumn` → text input
- `numberColumn` → number input
- `dateColumn` → date picker
- `selectColumn` → dropdown
- `booleanColumn` → toggle
- `multiValueColumn` → tag input
- `codeColumn` → code editor

## See Also

- [Custom Editors](../06-customization/custom-editors.md) — Create your own
- [API Reference](../07-api-reference.md) — Full editing options

## Examples in Codebase

- `src/components/data-grid/features/editing/` — Implementation
- `src/components/data-grid/editors/` — Editor components
- `src/demo/demo-page.tsx` — Live example
```

- [ ] **Step 7: Create tree-expansion.md**

```markdown
# Tree Expansion

Hierarchical rows with expand/collapse toggles and lazy async child loading.

## What It Does

Rows can have children. Click the expand arrow to show/hide children. Children can be:
- Pre-loaded in data
- Fetched asynchronously on expand

## When to Use

Use tree mode when data is hierarchical:
- Org charts (employees under managers)
- File explorers (folders and files)
- Category hierarchies

## Config Example

```json
{
  "mode": "tree",
  "features": {
    "tree": {
      "enabled": true,
      "getSubRows": "children",
      "onExpand": {
        "handler": "fetchChildren"
      }
    }
  }
}
```

## Raw Props Example

```tsx
const data = [
  {
    id: 1,
    name: "Alice",
    children: [
      { id: 11, name: "Alice Child 1" },
    ],
  },
];

const handleExpand = async (rowId) => {
  // Fetch children from server
  const children = await fetchChildren(rowId);
  return children;
};

<DataGrid
  data={data}
  columns={columns}
  mode="tree"
  getSubRows={(row) => row.children}
  onExpand={handleExpand}
/>
```

## Data Shape

Each row can have a `children` property (array of rows):

```tsx
{
  id: 1,
  name: "Parent",
  children: [
    { id: 11, name: "Child 1" },
    { id: 12, name: "Child 2" },
  ],
}
```

## See Also

- [Progressive Walkthrough](../02-progressive-walkthrough.md) — Step 4
- [Tree Mode (full example)](../04-data-modes-non-config/tree-mode.md)
- [API Reference](../07-api-reference.md) — Full tree options

## Examples in Codebase

- `src/components/data-grid/features/tree/` — Implementation
- `src/demo/demo-page.tsx` — Live example
```

- [ ] **Step 8: Create virtualization.md**

```markdown
# Virtualization

Render 10k+ rows smoothly with virtual scrolling. Only visible rows are in the DOM.

## What It Does

As you scroll, rows outside the viewport are removed from the DOM. Rows entering the viewport are added. This keeps memory low and scrolling smooth even with massive datasets.

## When to Use

Always enabled for flat mode by default. Essential when you have:
- 1k+ rows
- Large datasets
- Need smooth scrolling performance

## Config Example

```json
{
  "features": {
    "virtualization": {
      "enabled": true,
      "overscan": 10
    }
  }
}
```

## Raw Props Example

```tsx
<DataGrid
  data={data}
  columns={columns}
  mode="flat"
  features={{
    virtualization: {
      enabled: true,
      rowVirtualizeOptions: {
        overscan: 10,  // Render 10 rows beyond viewport
      },
    },
  }}
/>
```

## Performance

- **Flat mode with 10k rows**: Smooth scrolling, <50ms frame time
- **Column virtualization**: Also virtualizes columns for wide tables
- **Memory usage**: Constant (doesn't grow with row count)

## See Also

- [API Reference](../07-api-reference.md) — Full virtualization options

## Examples in Codebase

- `src/components/data-grid/features/virtualization/` — Implementation
- `src/demo/demo-page.tsx` — Live example
```

- [ ] **Step 9: Commit**

```bash
git add src/components/data-grid/docs/03-features/
git commit -m "docs: add feature documentation (sorting, filtering, selection, pinning, grouping, editing, tree, virtualization)"
```

---

## Chunk 5: Data Modes (Raw Props Examples)

### Task 6: Create Data Mode Examples

**Files:**
- Create: `src/components/data-grid/docs/04-data-modes-non-config/flat-mode.md`
- Create: `src/components/data-grid/docs/04-data-modes-non-config/paginated-mode.md`
- Create: `src/components/data-grid/docs/04-data-modes-non-config/infinite-mode.md`
- Create: `src/components/data-grid/docs/04-data-modes-non-config/tree-mode.md`

**Purpose:** Full working examples for each mode showing all features.

- [ ] **Step 1: Create flat-mode.md**

```markdown
# Flat Mode (All Features)

Local data, all features enabled. No server calls.

## Overview

Use flat mode when:
- All data fits in memory
- You want client-side sorting, filtering, grouping
- No pagination or lazy loading needed

## Full Example with All Features

```tsx
import { useState } from "react";
import { DataGrid } from "@/components/data-grid";
import {
  stringColumn,
  numberColumn,
  dateColumn,
  selectColumn,
  booleanColumn,
} from "@/components/data-grid/columns";

// Sample data
const users = [
  {
    id: "1",
    name: "Alice Chen",
    email: "alice@example.com",
    age: 30,
    department: "Engineering",
    role: "Senior Engineer",
    joinDate: "2020-03-15",
    active: true,
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    age: 25,
    department: "Design",
    role: "Designer",
    joinDate: "2022-01-10",
    active: true,
  },
  {
    id: "3",
    name: "Carol White",
    email: "carol@example.com",
    age: 35,
    department: "Sales",
    role: "Sales Lead",
    joinDate: "2019-06-01",
    active: false,
  },
  // ... more rows
];

// Define columns
const columns = [
  stringColumn("name", "Name"),
  stringColumn("email", "Email"),
  numberColumn("age", "Age"),
  selectColumn("department", "Department", [
    { label: "Engineering", value: "Engineering" },
    { label: "Design", value: "Design" },
    { label: "Sales", value: "Sales" },
  ]),
  selectColumn("role", "Role", [
    { label: "Senior Engineer", value: "Senior Engineer" },
    { label: "Engineer", value: "Engineer" },
    { label: "Designer", value: "Designer" },
    { label: "Sales Lead", value: "Sales Lead" },
  ]),
  dateColumn("joinDate", "Join Date"),
  booleanColumn("active", "Active"),
];

export default function FlatModeExample() {
  const [rowSelection, setRowSelection] = useState({});
  const [editingCell, setEditingCell] = useState(null);

  const handleMutate = async (rowId, columnId, value) => {
    // Simulate server mutation
    console.log(`Updating ${rowId}.${columnId} to ${value}`);
    return { success: true };
  };

  return (
    <div style={{ height: "600px" }}>
      <DataGrid
        data={users}
        columns={columns}
        mode="flat"
        features={{
          sorting: {
            enabled: true,
            initialState: { sorting: [{ id: "name", desc: false }] },
          },
          filtering: {
            enabled: true,
            filterRow: true,
          },
          selection: {
            enabled: true,
            onSelectionChange: setRowSelection,
          },
          pinning: {
            enabled: true,
            columnPinningLeft: ["name"],
          },
          grouping: {
            enabled: true,
          },
          editing: {
            enabled: true,
            onMutate: handleMutate,
          },
          virtualization: {
            enabled: true,
          },
        }}
      />
    </div>
  );
}
```

## Features Enabled

- ✅ **Sorting**: Click headers to sort
- ✅ **Filtering**: Filter inputs in header row
- ✅ **Selection**: Row checkboxes
- ✅ **Pinning**: Name column pinned left
- ✅ **Grouping**: Group by department
- ✅ **Editing**: Double-click cells to edit
- ✅ **Virtualization**: Smooth scrolling for large datasets

## Data Requirements

```tsx
// Each row is an object
{
  id: "1",           // Required: unique identifier
  name: "Alice",     // Match column field names
  age: 30,
  email: "...",
  // ... other fields
}
```

## See Also

- [Progressive Walkthrough](../02-progressive-walkthrough.md) — Step 1
- [Feature Reference](../03-features/)
- [API Reference](../07-api-reference.md)
```

- [ ] **Step 2: Create paginated-mode.md**

```markdown
# Paginated Mode (All Features)

Server-driven page loading. Request pages from API.

## Overview

Use paginated mode when:
- Data is too large for one request
- You want to control page size
- Server returns total row count
- You need page controls (first, prev, next, last)

## Full Example

```tsx
import { useState } from "react";
import { DataGrid } from "@/components/data-grid";
import { stringColumn, numberColumn } from "@/components/data-grid/columns";

export default function PaginatedModeExample() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const fetchPage = async (pageIndex = 0) => {
    // Call your API
    const pageSize = 10;
    const response = await fetch(
      `/api/users?page=${pageIndex}&limit=${pageSize}`
    );
    const { rows, total } = await response.json();

    return {
      rows,
      total,
    };
  };

  return (
    <div style={{ height: "600px" }}>
      <DataGrid
        queryFn={fetchPage}
        columns={[
          stringColumn("name", "Name"),
          stringColumn("email", "Email"),
          numberColumn("age", "Age"),
        ]}
        mode="paginated"
        features={{
          sorting: { enabled: true },
          filtering: { enabled: true, filterRow: true },
          selection: { enabled: true },
          virtualization: { enabled: true },
        }}
      />
    </div>
  );
}
```

## API Contract

Your `queryFn` should:

```tsx
async (pageIndex: number) => {
  return {
    rows: Array,      // Rows for this page
    total: number,    // Total row count across all pages
  };
}
```

## See Also

- [Progressive Walkthrough](../02-progressive-walkthrough.md) — Step 6
- [API Reference](../07-api-reference.md)
```

- [ ] **Step 3: Create infinite-mode.md**

```markdown
# Infinite Mode (All Features)

Cursor/offset-based incremental loading. Load as user scrolls.

## Overview

Use infinite mode when:
- Data arrives as a stream (social feed, comments)
- You don't want page controls
- You want to load more on scroll
- Server returns a cursor/next page identifier

## Full Example

```tsx
import { useState } from "react";
import { DataGrid } from "@/components/data-grid";
import { stringColumn, numberColumn } from "@/components/data-grid/columns";

export default function InfiniteModeExample() {
  const fetchMore = async (pageParam = 0) => {
    // Simulate server fetch
    // In real app, pageParam might be a cursor
    const offset = pageParam * 10;
    const limit = 10;

    const response = await fetch(`/api/users?offset=${offset}&limit=${limit}`);
    const { rows, hasMore } = await response.json();

    return {
      rows,
      nextPage: hasMore ? offset + limit : null,
    };
  };

  return (
    <div style={{ height: "600px" }}>
      <DataGrid
        queryFn={fetchMore}
        columns={[
          stringColumn("name", "Name"),
          stringColumn("email", "Email"),
          numberColumn("age", "Age"),
        ]}
        mode="infinite"
        features={{
          sorting: { enabled: true },
          filtering: { enabled: true },
          selection: { enabled: true },
          virtualization: { enabled: true },
        }}
      />
    </div>
  );
}
```

## API Contract

Your `queryFn` should:

```tsx
async (pageParam) => {
  return {
    rows: Array,        // Rows for this batch
    nextPage: any,      // Next page param (or null if done)
  };
}
```

## Scroll Behavior

- User scrolls to bottom
- `queryFn` is called with the `nextPage` value
- More rows are appended
- Repeat until `nextPage` is null

## See Also

- [Progressive Walkthrough](../02-progressive-walkthrough.md) — Step 5
- [API Reference](../07-api-reference.md)
```

- [ ] **Step 4: Create tree-mode.md**

```markdown
# Tree Mode (All Features)

Hierarchical rows with lazy async expansion.

## Overview

Use tree mode when:
- Data is hierarchical (org charts, file trees)
- Children are pre-loaded or fetched on expand
- You want expand/collapse toggles

## Full Example

```tsx
import { useState } from "react";
import { DataGrid } from "@/components/data-grid";
import { stringColumn, numberColumn } from "@/components/data-grid/columns";

// Sample hierarchical data
const departments = [
  {
    id: "eng",
    name: "Engineering",
    manager: "Alice Chen",
    headcount: 5,
    children: [
      { id: "eng-1", name: "John Doe", manager: "Alice", headcount: 0 },
      { id: "eng-2", name: "Jane Smith", manager: "Alice", headcount: 0 },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    manager: "Carol White",
    headcount: 3,
    children: [
      { id: "sales-1", name: "Bob Johnson", manager: "Carol", headcount: 0 },
    ],
  },
];

export default function TreeModeExample() {
  const [expanded, setExpanded] = useState({});

  const handleExpand = async (rowId) => {
    // Optionally fetch children from server
    console.log(`Fetching children for ${rowId}`);
    // return await fetchChildren(rowId);
    return [];  // Return empty if pre-loaded
  };

  return (
    <div style={{ height: "600px" }}>
      <DataGrid
        data={departments}
        columns={[
          stringColumn("name", "Name"),
          stringColumn("manager", "Manager"),
          numberColumn("headcount", "Headcount"),
        ]}
        mode="tree"
        getSubRows={(row) => row.children}
        onExpand={handleExpand}
        features={{
          sorting: { enabled: true },
          filtering: { enabled: true },
          selection: { enabled: true },
          editing: { enabled: true },
        }}
      />
    </div>
  );
}
```

## Data Shape

```tsx
{
  id: "eng",
  name: "Engineering",
  children: [
    { id: "eng-1", name: "John", children: [] },
    { id: "eng-2", name: "Jane", children: [] },
  ],
}
```

## Lazy Loading

To fetch children on expand:

```tsx
const handleExpand = async (rowId) => {
  const children = await fetchChildren(rowId);
  return children;
};

<DataGrid
  // ...
  onExpand={handleExpand}
/>
```

## See Also

- [Progressive Walkthrough](../02-progressive-walkthrough.md) — Step 4
- [Tree Expansion Feature](../03-features/tree-expansion.md)
- [API Reference](../07-api-reference.md)
```

- [ ] **Step 5: Commit**

```bash
git add src/components/data-grid/docs/04-data-modes-non-config/
git commit -m "docs: add data mode examples (flat, paginated, infinite, tree)"
```

---

## Chunk 6: Config-Driven Documentation

### Task 7: Create Config and JSONata Docs

**Files:**
- Create: `src/components/data-grid/docs/05-config-driven-tables/config-basics.md`
- Create: `src/components/data-grid/docs/05-config-driven-tables/jsonata-transforms.md`

**Purpose:** Explain config approach and JSONata for declarative tables.

- [ ] **Step 1: Create config-basics.md**

```markdown
# Config Basics

When to use config vs raw props. What is declarative table configuration?

## Raw Props vs Config

| Aspect | Raw Props | Config |
|--------|-----------|--------|
| **Control** | Maximum, component-first | Data-first, declarative |
| **Code** | Longer, imperative JSX | JSON, concise |
| **Learn** | Component API deep dive | JSON schema, easier onboarding |
| **Flexibility** | Anything goes | Structured schema |
| **Server-side** | Possible but complex | Natural, designed for it |

## What Is Config?

Configuration is a JSON object that declares:
1. **Columns** — What fields to show, types, labels
2. **Features** — Which features to enable (sorting, filtering, etc.)
3. **Data Source** — How to fetch data (local, paginated, infinite, tree)
4. **UI** — Density, column widths, defaults

Instead of writing JSX, you define a config object:

```json
{
  "name": "users",
  "mode": "flat",
  "columns": [
    { "id": "name", "type": "string", "label": "Name", "width": 150 },
    { "id": "age", "type": "number", "label": "Age", "width": 100 },
  ],
  "features": {
    "sorting": { "enabled": true },
    "filtering": { "enabled": true },
  },
  "dataSource": {
    "type": "local",
    "data": [
      { "id": "1", "name": "Alice", "age": 30 },
    ],
  },
}
```

Then pass it to the `ConfiguredTable`:

```tsx
import { ConfiguredTable } from "@/components/data-grid/table-engine";

<ConfiguredTable config={config} />
```

## When to Use Config

**Use config if:**
- Your table config comes from a server or database
- You want to reuse table definitions across apps
- You prefer declarative over imperative
- You want to enable/disable features via JSON

**Use raw props if:**
- You need maximum control and customization
- Your table structure is tightly coupled to business logic
- You're building a one-off feature

## Config Structure Overview

```json
{
  "name": "table-name",
  "description": "What this table does",
  "mode": "flat|paginated|infinite|tree",

  "columns": [
    { "id": "...", "type": "...", "label": "...", ... }
  ],

  "features": {
    "sorting": { "enabled": true },
    "filtering": { "enabled": true },
    ...
  },

  "dataSource": {
    "type": "local|paginated|infinite|tree",
    "data": [...] or "fetchFn": "...",
    ...
  },

  "ui": {
    "density": "default|compact|loose",
    "pageSize": 10,
    ...
  }
}
```

## Next Steps

- [JSONata Transforms](jsonata-transforms.md) — Learn how to map data to columns
- [Flat Table Config](flat-table-config.md) — Full working example
- [Infinite Table Config](infinite-table-config.md) — Cursor-based loading
- [Tree Table Config](tree-table-config.md) — Hierarchical data

## See Also

- [Raw Props: Flat Mode](../04-data-modes-non-config/flat-mode.md) — Compare with raw props
- [API Reference](../07-api-reference.md) — Full config schema

---

## Design Philosophy

Configuration-driven tables follow these principles:

1. **Data-first** — Table structure comes from config, not code
2. **Server-friendly** — Configs can be versioned and deployed independently
3. **Reusable** — Same config runs in multiple apps or contexts
4. **Validated** — Config schema ensures correctness
5. **Transformable** — JSONata expressions power dynamic field mapping

This enables use cases like:
- Server-side table definitions: API returns config, UI renders it
- Multi-tenant tables: Different configs per tenant
- Feature flagging: Enable/disable features via config
- A/B testing: Different configs for different users
```

- [ ] **Step 2: Create jsonata-transforms.md**

```markdown
# JSONata Transforms

Use JSONata to map and transform data fields in config.

## What Is JSONata?

JSONata is a lightweight query and transformation language for JSON. In tables, use it to:
- Rename fields
- Transform values (uppercase, format, calculate)
- Conditionally show/hide fields
- Compose new fields from existing ones

## Basic Syntax

### Simple Field Mapping

```jsonata
$name        // Access the 'name' field
$.age        // Explicit dot notation
```

### Field Renaming

```jsonata
{
  "fullName": $.firstName & " " & $.lastName,
  "email": $.emailAddress
}
```

Result:
```json
{
  "fullName": "Alice Chen",
  "email": "alice@example.com"
}
```

### String Concatenation

```jsonata
{
  "description": name & " is " & age & " years old"
}
```

### Numbers and Math

```jsonata
{
  "yearOfBirth": 2024 - age,
  "salaryAfterIncrease": salary * 1.1
}
```

### Conditionals

```jsonata
{
  "status": age >= 18 ? "Adult" : "Minor",
  "level": salary > 100000 ? "Senior" : "Junior"
}
```

### String Functions

```jsonata
{
  "nameUpper": $uppercase(name),
  "nameLength": $length(name),
  "firstLetter": $substring(name, 0, 1)
}
```

### Nested Field Access

```jsonata
{
  "department": company.department.name,
  "city": address.location.city
}
```

## Config Example with JSONata

```json
{
  "name": "users",
  "columns": [
    {
      "id": "fullName",
      "type": "string",
      "label": "Full Name",
      "expr": "firstName & ' ' & lastName"
    },
    {
      "id": "status",
      "type": "string",
      "label": "Status",
      "expr": "age >= 18 ? 'Adult' : 'Minor'"
    },
    {
      "id": "yearOfBirth",
      "type": "number",
      "label": "Birth Year",
      "expr": "2024 - age"
    }
  ],
  "dataSource": {
    "type": "local",
    "data": [
      { "firstName": "Alice", "lastName": "Chen", "age": 30 },
      { "firstName": "Bob", "lastName": "Smith", "age": 25 }
    ]
  }
}
```

Rendered columns:
- **Full Name**: "Alice Chen", "Bob Smith"
- **Status**: "Adult", "Adult"
- **Birth Year**: 1994, 1999

## Common Patterns

### Format Currency

```jsonata
{
  "salary": "$" & $string(salary)
}
```

→ "$100000"

### Format Date

```jsonata
{
  "joined": $substring(joinDate, 0, 10)  // YYYY-MM-DD from full ISO
}
```

→ "2020-03-15"

### Uppercase

```jsonata
{
  "department": $uppercase(department)
}
```

→ "ENGINEERING"

### Boolean to Text

```jsonata
{
  "isActive": active ? "Yes" : "No"
}
```

→ "Yes", "No"

### Nested Condition

```jsonata
{
  "level": salary > 150000 ? "Director" : salary > 100000 ? "Senior" : "Junior"
}
```

→ "Director", "Senior", or "Junior"

## Reference

Common JSONata functions:

| Function | Example | Result |
|----------|---------|--------|
| `$string(x)` | `$string(42)` | "42" |
| `$number(x)` | `$number("42")` | 42 |
| `$length(str)` | `$length("Alice")` | 5 |
| `$uppercase(str)` | `$uppercase("alice")` | "ALICE" |
| `$lowercase(str)` | `$lowercase("ALICE")` | "alice" |
| `$substring(str, start, length)` | `$substring("Alice", 0, 1)` | "A" |
| `&` (concat) | `"Hello" & " " & "World"` | "Hello World" |
| `?:` (ternary) | `x > 10 ? "big" : "small"` | depends on x |

## Next Steps

- [Flat Table Config](flat-table-config.md) — Full example with transforms
- [Infinite Table Config](infinite-table-config.md) — With server data
- [Tree Table Config](tree-table-config.md) — Hierarchies and transforms

---

## Further Learning

For advanced JSONata:
- Official docs: https://docs.jsonata.org/
- Try it: https://try.jsonata.org/
```

- [ ] **Step 3: Commit**

```bash
git add src/components/data-grid/docs/05-config-driven-tables/config-basics.md src/components/data-grid/docs/05-config-driven-tables/jsonata-transforms.md
git commit -m "docs: add config basics and JSONata transforms guide"
```

### Task 8: Create Config Mode Examples

**Files:**
- Create: `src/components/data-grid/docs/05-config-driven-tables/flat-table-config.md`
- Create: `src/components/data-grid/docs/05-config-driven-tables/infinite-table-config.md`
- Create: `src/components/data-grid/docs/05-config-driven-tables/tree-table-config.md`
- Create: `src/components/data-grid/docs/05-config-driven-tables/config-api-reference.md`

**Purpose:** Full config examples for each mode and API reference.

- [ ] **Step 1: Create flat-table-config.md**

```markdown
# Flat Table via Config

Define a flat table using JSON config.

## Overview

Flat mode: local data, client-side sorting/filtering/grouping.

## Full Config Example

```json
{
  "name": "users-flat",
  "description": "Employee directory with local data",
  "mode": "flat",

  "columns": [
    {
      "id": "name",
      "type": "string",
      "label": "Name",
      "width": 150,
      "sortable": true,
      "filterable": true
    },
    {
      "id": "email",
      "type": "string",
      "label": "Email",
      "width": 200,
      "sortable": true,
      "filterable": true
    },
    {
      "id": "age",
      "type": "number",
      "label": "Age",
      "width": 80,
      "sortable": true,
      "filterable": true
    },
    {
      "id": "department",
      "type": "select",
      "label": "Department",
      "width": 120,
      "options": [
        { "label": "Engineering", "value": "eng" },
        { "label": "Sales", "value": "sales" },
        { "label": "Marketing", "value": "marketing" }
      ]
    },
    {
      "id": "active",
      "type": "boolean",
      "label": "Active",
      "width": 80
    }
  ],

  "features": {
    "sorting": {
      "enabled": true,
      "defaultSort": [{ "id": "name", "desc": false }]
    },
    "filtering": {
      "enabled": true,
      "filterRow": true
    },
    "selection": {
      "enabled": true
    },
    "pinning": {
      "enabled": true,
      "columnPinningLeft": ["name"]
    },
    "grouping": {
      "enabled": true,
      "groupBy": []
    },
    "editing": {
      "enabled": true
    },
    "virtualization": {
      "enabled": true
    }
  },

  "dataSource": {
    "type": "local",
    "data": [
      {
        "id": "1",
        "name": "Alice Chen",
        "email": "alice@example.com",
        "age": 30,
        "department": "eng",
        "active": true
      },
      {
        "id": "2",
        "name": "Bob Smith",
        "email": "bob@example.com",
        "age": 25,
        "department": "sales",
        "active": true
      }
    ]
  },

  "ui": {
    "density": "default",
    "pageSize": 20
  }
}
```

## Using the Config

```tsx
import { ConfiguredTable } from "@/components/data-grid/table-engine";

const config = { /* as above */ };

export default function UserDirectory() {
  return <ConfiguredTable config={config} />;
}
```

## What Each Section Does

### Columns
- `id` — Field name in data
- `type` — Column type (string, number, boolean, select, date, etc.)
- `label` — Display header
- `width` — Column width in pixels
- `sortable` — Allow sorting
- `filterable` — Allow filtering

### Features
- `sorting` — Enable/disable sort by header click
- `filtering` — Enable/disable column filters
- `selection` — Enable/disable row checkboxes
- `pinning` — Pin columns left/right
- `grouping` — Group by columns
- `editing` — Inline edit cells
- `virtualization` — Virtual scroll for performance

### DataSource
- `type` — "local" for in-memory data
- `data` — Array of row objects

### UI
- `density` — "default", "compact", "loose"
- `pageSize` — Rows per view (for virtualization)

## See Also

- [Config Basics](config-basics.md)
- [Raw Props Alternative](../04-data-modes-non-config/flat-mode.md)
- [API Reference](config-api-reference.md)
```

- [ ] **Step 2: Create infinite-table-config.md**

```markdown
# Infinite Table via Config

Define an infinite-scroll table using JSON config and server fetch.

## Overview

Infinite mode: cursor/offset-based incremental loading.

## Full Config Example

```json
{
  "name": "feed-infinite",
  "description": "Social feed with infinite scroll",
  "mode": "infinite",

  "columns": [
    {
      "id": "author",
      "type": "string",
      "label": "Author",
      "width": 150
    },
    {
      "id": "content",
      "type": "string",
      "label": "Content",
      "width": 400
    },
    {
      "id": "timestamp",
      "type": "date",
      "label": "Posted",
      "width": 150
    },
    {
      "id": "likes",
      "type": "number",
      "label": "Likes",
      "width": 80
    }
  ],

  "features": {
    "sorting": { "enabled": true },
    "filtering": { "enabled": true },
    "selection": { "enabled": true },
    "virtualization": { "enabled": true }
  },

  "dataSource": {
    "type": "infinite",
    "fetchFn": "fetchFeed",
    "pageParamName": "cursor"
  },

  "ui": {
    "density": "default",
    "pageSize": 20
  }
}
```

## Fetch Function

Implement `fetchFeed` in your handler:

```tsx
const fetchFeed = async (cursor = null) => {
  const response = await fetch(`/api/feed?cursor=${cursor}&limit=20`);
  const { posts, nextCursor } = await response.json();

  return {
    rows: posts,
    nextPage: nextCursor || null,  // null when done
  };
};
```

## Data Structure

Each row in your response:
```json
{
  "id": "post-123",
  "author": "Alice",
  "content": "Great day today!",
  "timestamp": "2024-01-15T10:30:00Z",
  "likes": 42
}
```

## See Also

- [Config Basics](config-basics.md)
- [Raw Props Alternative](../04-data-modes-non-config/infinite-mode.md)
- [API Reference](config-api-reference.md)
```

- [ ] **Step 3: Create tree-table-config.md**

```markdown
# Tree Table via Config

Define a hierarchical table using JSON config.

## Overview

Tree mode: hierarchical rows with expand/collapse and optional lazy-load.

## Full Config Example

```json
{
  "name": "org-tree",
  "description": "Organization chart with hierarchy",
  "mode": "tree",

  "columns": [
    {
      "id": "name",
      "type": "string",
      "label": "Name",
      "width": 150
    },
    {
      "id": "title",
      "type": "string",
      "label": "Title",
      "width": 150
    },
    {
      "id": "department",
      "type": "string",
      "label": "Department",
      "width": 120
    },
    {
      "id": "reports",
      "type": "number",
      "label": "Direct Reports",
      "width": 100
    }
  ],

  "features": {
    "sorting": { "enabled": true },
    "filtering": { "enabled": true },
    "selection": { "enabled": true }
  },

  "dataSource": {
    "type": "tree",
    "data": [
      {
        "id": "ceo",
        "name": "Alice Chen",
        "title": "CEO",
        "department": "Executive",
        "reports": 2,
        "children": [
          {
            "id": "cto",
            "name": "Bob Smith",
            "title": "CTO",
            "department": "Engineering",
            "reports": 3,
            "children": [
              {
                "id": "eng-lead",
                "name": "Carol White",
                "title": "Engineering Lead",
                "department": "Engineering",
                "reports": 5,
                "children": []
              }
            ]
          }
        ]
      }
    ],
    "getSubRows": "children",
    "onExpand": null
  },

  "ui": {
    "density": "default"
  }
}
```

## Data Structure

Hierarchical rows with `children`:

```json
{
  "id": "node-1",
  "name": "Parent",
  "title": "Manager",
  "children": [
    { "id": "node-2", "name": "Child 1", "title": "Engineer", "children": [] },
    { "id": "node-3", "name": "Child 2", "title": "Designer", "children": [] }
  ]
}
```

## Lazy Loading

To fetch children on expand:

```json
{
  "dataSource": {
    "type": "tree",
    "data": [ /* root nodes */ ],
    "getSubRows": "children",
    "onExpand": "fetchChildren"
  }
}
```

Then implement `fetchChildren`:

```tsx
const fetchChildren = async (parentId) => {
  const response = await fetch(`/api/org/${parentId}/children`);
  const children = await response.json();
  return children;
};
```

## See Also

- [Config Basics](config-basics.md)
- [Raw Props Alternative](../04-data-modes-non-config/tree-mode.md)
- [API Reference](config-api-reference.md)
```

- [ ] **Step 4: Create config-api-reference.md**

```markdown
# Config API Reference

Complete schema for table configuration.

## Root Config

```typescript
{
  name: string;              // Unique table name
  description?: string;       // What this table does
  mode: "flat" | "paginated" | "infinite" | "tree";
  columns: ColumnConfig[];
  features: FeaturesConfig;
  dataSource: DataSourceConfig;
  ui?: UIConfig;
}
```

## ColumnConfig

```typescript
{
  id: string;                        // Field name in data
  type: "string" | "number" | "boolean" | "date" | "select" | "multi-value" | "code";
  label: string;                     // Display header
  width?: number;                    // Column width in pixels (default: auto)
  sortable?: boolean;                // Allow sort (default: true)
  filterable?: boolean;              // Allow filter (default: true)
  editable?: boolean;                // Allow inline edit (default: false)

  // For select columns:
  options?: Array<{
    label: string;
    value: string;
  }>;

  // For computed columns:
  expr?: string;                     // JSONata expression
}
```

## FeaturesConfig

```typescript
{
  sorting?: {
    enabled: boolean;
    defaultSort?: Array<{
      id: string;
      desc: boolean;
    }>;
  };

  filtering?: {
    enabled: boolean;
    filterRow?: boolean;  // Show filter inputs in header
    defaultFilters?: Array<{
      id: string;
      value: any;
    }>;
  };

  selection?: {
    enabled: boolean;
    initialSelected?: string[];
  };

  pinning?: {
    enabled: boolean;
    columnPinningLeft?: string[];
    columnPinningRight?: string[];
  };

  grouping?: {
    enabled: boolean;
    groupBy?: string[];
  };

  editing?: {
    enabled: boolean;
    onMutate?: (rowId: string, columnId: string, value: any) => Promise<any>;
  };

  virtualization?: {
    enabled: boolean;
    overscan?: number;  // Rows to render beyond viewport
  };
}
```

## DataSourceConfig

### Local Data

```typescript
{
  type: "local";
  data: Array<any>;
}
```

### Paginated

```typescript
{
  type: "paginated";
  fetchFn: (pageIndex: number) => Promise<{
    rows: Array<any>;
    total: number;
  }>;
}
```

### Infinite

```typescript
{
  type: "infinite";
  fetchFn: (pageParam?: any) => Promise<{
    rows: Array<any>;
    nextPage: any | null;
  }>;
}
```

### Tree

```typescript
{
  type: "tree";
  data: Array<any>;
  getSubRows?: string | ((row: any) => any[]);  // Path or function
  onExpand?: (rowId: string) => Promise<any[]>;  // Optional lazy load
}
```

## UIConfig

```typescript
{
  density?: "default" | "compact" | "loose";
  pageSize?: number;  // Rows per view (for virtualization)
}
```

---

## Usage Example

```tsx
import { ConfiguredTable } from "@/components/data-grid/table-engine";

const config = {
  name: "users",
  description: "User directory",
  mode: "flat",
  columns: [
    { id: "name", type: "string", label: "Name" },
    { id: "age", type: "number", label: "Age" },
  ],
  features: {
    sorting: { enabled: true },
    filtering: { enabled: true },
  },
  dataSource: {
    type: "local",
    data: [
      { id: "1", name: "Alice", age: 30 },
      { id: "2", name: "Bob", age: 25 },
    ],
  },
};

export default function App() {
  return <ConfiguredTable config={config} />;
}
```

---

## See Also

- [Config Basics](config-basics.md)
- [JSONata Transforms](jsonata-transforms.md)
- [Flat Table Config](flat-table-config.md)
- [Infinite Table Config](infinite-table-config.md)
- [Tree Table Config](tree-table-config.md)
```

- [ ] **Step 5: Commit**

```bash
git add src/components/data-grid/docs/05-config-driven-tables/
git commit -m "docs: add config-driven table examples (flat, infinite, tree) and API reference"
```

---

## Chunk 7: Customization and API Reference

### Task 9: Create Customization Docs

**Files:**
- Create: `src/components/data-grid/docs/06-customization/custom-columns.md`
- Create: `src/components/data-grid/docs/06-customization/custom-editors.md`
- Create: `src/components/data-grid/docs/06-customization/styling-theming.md`
- Create: `src/components/data-grid/docs/06-customization/custom-features.md`

**Purpose:** Guide for extending the grid with custom components and features.

- [ ] **Step 1: Create custom-columns.md**

```markdown
# Custom Columns

Create column types beyond the built-in defaults.

## Overview

Built-in types: string, number, boolean, date, select, multi-value, code.

Need something custom? Extend the column factory pattern.

## Example: Password Column (Masked Text)

```tsx
// src/components/data-grid/columns/password-column.tsx
import { ColumnDef } from "@tanstack/react-table";
import { PasswordCell } from "./password-cell";

export function passwordColumn(
  id: string,
  header: string
): ColumnDef<any> {
  return {
    accessorKey: id,
    header,
    cell: (info) => <PasswordCell value={info.getValue()} />,
    size: 180,
    meta: {
      type: "password",
      filterable: false,  // Don't filter passwords
      editable: false,    // Can't edit inline
    },
  };
}

// src/components/data-grid/columns/password-cell.tsx
export function PasswordCell({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <span>{show ? value : "●●●●●●●●"}</span>
      <button onClick={() => setShow(!show)}>
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
```

Then use it:

```tsx
const columns = [
  stringColumn("username", "Username"),
  passwordColumn("password", "Password"),  // Custom!
];

<DataGrid data={data} columns={columns} mode="flat" />
```

## Example: Star Rating Column

```tsx
// src/components/data-grid/columns/rating-column.tsx
import { ColumnDef } from "@tanstack/react-table";

export function ratingColumn(id: string, header: string): ColumnDef<any> {
  return {
    accessorKey: id,
    header,
    cell: (info) => <RatingCell value={info.getValue()} />,
    size: 100,
    meta: {
      type: "rating",
      editable: true,  // Can edit the rating
    },
  };
}

// src/components/data-grid/columns/rating-cell.tsx
export function RatingCell({ value }: { value: number }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ cursor: "pointer", fontSize: "20px" }}>
          {star <= value ? "⭐" : "☆"}
        </span>
      ))}
    </div>
  );
}
```

## Key Concepts

1. **Column Definition** — TanStack `ColumnDef<TData>` object
2. **Accessors** — How to get the value from row data
3. **Cell Renderer** — React component to display the cell
4. **Meta** — Grid-specific metadata (type, editable, filterable, etc.)
5. **Size** — Column width in pixels

## See Also

- [API Reference](../07-api-reference.md) — ColumnDef contract
- [Custom Editors](custom-editors.md) — Pair with custom editor for inline edit
- [Raw Props Alternative](../04-data-modes-non-config/flat-mode.md) — See columns in action
```

- [ ] **Step 2: Create custom-editors.md**

```markdown
# Custom Editors

Create inline edit UI for custom column types.

## Overview

When a user double-clicks a cell to edit, the grid uses an editor component. Built-in editors exist for string, number, date, select, boolean, etc.

For custom columns, create a custom editor.

## Example: Star Rating Editor

```tsx
// src/components/data-grid/editors/rating-editor.tsx
import { useState } from "react";

export interface RatingEditorProps {
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
}

export function RatingEditor({ value, onChange, onBlur }: RatingEditorProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      style={{ display: "flex", gap: "4px" }}
      onBlur={onBlur}
      tabIndex={0}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            cursor: "pointer",
            fontSize: "24px",
            opacity: star <= (hovered || value) ? 1 : 0.5,
          }}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => {
            onChange(star);
            onBlur();
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
```

## Register in getEditor

```tsx
// src/components/data-grid/editors/get-editor.ts
import { RatingEditor } from "./rating-editor";

export function getEditor(columnMeta: any) {
  const type = columnMeta?.type;

  switch (type) {
    case "rating":
      return RatingEditor;
    // ... other editors
  }
}
```

## Editor Contract

Custom editor must accept:

```tsx
{
  value: any;           // Current cell value
  onChange: (value: any) => void;
  onBlur: () => void;
  onEscape?: () => void;  // Optional: cancel edit
}
```

## See Also

- [Custom Columns](custom-columns.md) — Pair with custom column renderer
- [Editing Feature](../03-features/editing.md) — How editing works
- [API Reference](../07-api-reference.md) — Editor contract
```

- [ ] **Step 3: Create styling-theming.md**

```markdown
# Styling & Theming

Customize DataGrid look and feel with CSS variables and density presets.

## CSS Variables

The grid exposes CSS variables for theming:

```css
/* Colors */
--grid-background: #ffffff;
--grid-border: #e5e7eb;
--grid-text: #1f2937;
--grid-text-secondary: #6b7280;

/* Spacing */
--grid-padding: 12px;
--grid-gap: 8px;

/* Density (set via feature flag) */
--grid-row-height: 40px;  /* compact: 32px, loose: 48px */
```

## Dark Mode

```css
@media (prefers-color-scheme: dark) {
  --grid-background: #1f2937;
  --grid-border: #374151;
  --grid-text: #f3f4f6;
  --grid-text-secondary: #d1d5db;
}
```

## Density Presets

```tsx
<DataGrid
  density="compact"   // 32px rows, tight spacing
  // or
  density="default"   // 40px rows, normal spacing (default)
  // or
  density="loose"     // 48px rows, spacious
  {...otherProps}
/>
```

## Custom Styles

Override with CSS:

```css
/* Wider columns */
.data-grid-header {
  --grid-padding: 16px;
}

/* Larger fonts */
.data-grid-cell {
  font-size: 16px;
}

/* Custom header background */
.data-grid-header {
  background-color: #3b82f6;
  color: white;
}
```

## See Also

- [API Reference](../07-api-reference.md) — Full styling options
```

- [ ] **Step 4: Create custom-features.md**

```markdown
# Custom Features

Write feature hooks to extend grid behavior.

## Overview

Features are modular hooks that add behavior:
- Sorting, filtering, selection (built-in)
- Custom aggregation, export, validation (your code)

## Example: Export to CSV Feature

```tsx
// src/components/data-grid/features/export/use-export.ts
import { Table } from "@tanstack/react-table";

export function useExport<TData extends Record<string, any>>(
  table: Table<TData>
) {
  const exportCSV = () => {
    const rows = table.getRowModel().rows;
    const columns = table.getVisibleLeafColumns();

    // Build CSV header
    const header = columns.map((col) => col.columnDef.header).join(",");

    // Build CSV rows
    const csv = rows
      .map((row) =>
        columns
          .map((col) => {
            const value = row.getValue(col.id);
            return typeof value === "string" ? `"${value}"` : value;
          })
          .join(",")
      )
      .join("\n");

    // Download
    const blob = new Blob([header + "\n" + csv], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data.csv";
    link.click();
  };

  return { exportCSV };
}
```

Then use it in your component:

```tsx
import { useExport } from "@/components/data-grid/features/export/use-export";

export function MyGrid() {
  const table = useDataGrid(/* ... */);
  const { exportCSV } = useExport(table.table);

  return (
    <div>
      <button onClick={exportCSV}>Export CSV</button>
      <DataGrid table={table} />
    </div>
  );
}
```

## Key Concepts

1. **Hook Pattern** — Features are React hooks
2. **Table Instance** — Hooks receive the TanStack `Table` instance
3. **Row/Column Access** — Use `table.getRowModel()`, `table.getVisibleLeafColumns()`, etc.
4. **State Management** — Manage feature state locally or in context

## See Also

- [Editing Feature](../03-features/editing.md) — Example of a built-in feature
- [API Reference](../07-api-reference.md) — Table instance methods
```

- [ ] **Step 5: Commit**

```bash
git add src/components/data-grid/docs/06-customization/
git commit -m "docs: add customization guides (custom columns, editors, styling, features)"
```

### Task 10: Create API Reference

**Files:**
- Create: `src/components/data-grid/docs/07-api-reference.md`

**Purpose:** Complete prop and type reference for DataGrid component.

- [ ] **Step 1: Create 07-api-reference.md**

```markdown
# API Reference

Complete reference for DataGrid component, columns, types, and hooks.

## DataGrid Component

```tsx
<DataGrid<TData>
  // Data (choose one)
  data?: TData[];                    // Local data (flat mode)
  queryFn?: (pageParam?: any) => Promise<{  // Server data (paginated/infinite/tree)
    rows: TData[];
    total?: number;                  // For paginated
    nextPage?: any;                  // For infinite
  }>;

  // Column Definition
  columns: ColumnDef<TData>[];       // TanStack column definitions

  // Mode
  mode?: "flat" | "paginated" | "infinite" | "tree";

  // Tree Options (tree mode only)
  getSubRows?: (row: TData) => TData[] | undefined;
  onExpand?: (rowId: string) => Promise<TData[]>;

  // Features
  features?: {
    sorting?: { enabled?: boolean; initialState?: SortingState };
    filtering?: { enabled?: boolean; filterRow?: boolean };
    selection?: { enabled?: boolean };
    pinning?: { enabled?: boolean };
    grouping?: { enabled?: boolean; groupBy?: string[] };
    editing?: { enabled?: boolean; onMutate?: (rowId: string, columnId: string, value: any) => Promise<any> };
    virtualization?: { enabled?: boolean };
  };

  // UI
  density?: "default" | "compact" | "loose";
  className?: string;
  style?: CSSProperties;
/>
```

## Column Factories

### stringColumn

```tsx
stringColumn(id: string, header: string, options?: {
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
})
```

### numberColumn

```tsx
numberColumn(id: string, header: string, options?: {
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  format?: (value: number) => string;
})
```

### dateColumn

```tsx
dateColumn(id: string, header: string, options?: {
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  format?: (date: Date | string) => string;
})
```

### selectColumn

```tsx
selectColumn(
  id: string,
  header: string,
  options: Array<{ label: string; value: string }>,
  columnOptions?: {
    width?: number;
    sortable?: boolean;
    filterable?: boolean;
    editable?: boolean;
  }
)
```

### booleanColumn

```tsx
booleanColumn(id: string, header: string, options?: {
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
})
```

### multiValueColumn

```tsx
multiValueColumn(id: string, header: string, options?: {
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
})
```

### codeColumn

```tsx
codeColumn(id: string, header: string, options?: {
  width?: number;
  language?: string;
  sortable?: boolean;
  filterable?: boolean;
})
```

## Hooks

### useDataGrid

```tsx
const gridInstance = useDataGrid<TData>({
  data?: TData[];
  queryFn?: (pageParam?: any) => Promise<...>;
  columns: ColumnDef<TData>[];
  mode?: "flat" | "paginated" | "infinite" | "tree";
  features?: FeaturesConfig;
  // ... other options
});

// Returns:
{
  table: Table<TData>;          // TanStack Table instance
  features: {
    sorting: SortingState;
    filtering: FilterValue;
    selection: RowSelectionState;
    // ... other feature state
  };
  isLoading: boolean;
  error: Error | null;
}
```

## Types

### SortingState

```tsx
Array<{ id: string; desc: boolean }>
```

### ColumnVisibilityState

```tsx
Record<string, boolean>
```

### RowSelectionState

```tsx
Record<string, boolean>
```

### FilterValue

```tsx
// Depends on column type
string | number | [number, number] | { from?: string; to?: string } | string[]
```

## ConfiguredTable (Config-Driven)

```tsx
import { ConfiguredTable } from "@/components/data-grid/table-engine";

<ConfiguredTable
  config={{
    name: string;
    mode: "flat" | "paginated" | "infinite" | "tree";
    columns: ColumnConfig[];
    features: FeaturesConfig;
    dataSource: DataSourceConfig;
  }}
/>
```

See [Config API Reference](05-config-driven-tables/config-api-reference.md) for full schema.

---

## Complete Example

```tsx
import { DataGrid } from "@/components/data-grid";
import { stringColumn, numberColumn } from "@/components/data-grid/columns";
import { useState } from "react";

const users = [
  { id: "1", name: "Alice", age: 30 },
  { id: "2", name: "Bob", age: 25 },
];

const columns = [
  stringColumn("name", "Name"),
  numberColumn("age", "Age"),
];

export default function App() {
  const [selection, setSelection] = useState({});

  return (
    <DataGrid
      data={users}
      columns={columns}
      mode="flat"
      features={{
        sorting: { enabled: true },
        filtering: { enabled: true, filterRow: true },
        selection: { enabled: true },
        editing: { enabled: true },
        virtualization: { enabled: true },
      }}
      onSelectionChange={setSelection}
    />
  );
}
```

---

## See Also

- [Quick Start](01-quick-start.md)
- [Features](03-features/)
- [Data Modes](04-data-modes-non-config/)
- [Config-Driven](05-config-driven-tables/)
- [Customization](06-customization/)
```

- [ ] **Step 2: Commit**

```bash
git add src/components/data-grid/docs/07-api-reference.md
git commit -m "docs: add comprehensive API reference"
```

---

## Chunk 8: Final Commit and Summary

### Task 11: Verify and Final Commit

**Purpose:** Ensure all docs are created and cross-linked correctly.

- [ ] **Step 1: Verify docs structure**

```bash
find "src/components/data-grid/docs" -type f -name "*.md" | sort
```

Expected:
```
src/components/data-grid/docs/README.md
src/components/data-grid/docs/01-quick-start.md
src/components/data-grid/docs/02-progressive-walkthrough.md
src/components/data-grid/docs/03-features/editing.md
src/components/data-grid/docs/03-features/filtering.md
src/components/data-grid/docs/03-features/grouping.md
src/components/data-grid/docs/03-features/pinning.md
src/components/data-grid/docs/03-features/selection.md
src/components/data-grid/docs/03-features/sorting.md
src/components/data-grid/docs/03-features/tree-expansion.md
src/components/data-grid/docs/03-features/virtualization.md
src/components/data-grid/docs/04-data-modes-non-config/flat-mode.md
src/components/data-grid/docs/04-data-modes-non-config/infinite-mode.md
src/components/data-grid/docs/04-data-modes-non-config/paginated-mode.md
src/components/data-grid/docs/04-data-modes-non-config/tree-mode.md
src/components/data-grid/docs/05-config-driven-tables/config-api-reference.md
src/components/data-grid/docs/05-config-driven-tables/config-basics.md
src/components/data-grid/docs/05-config-driven-tables/flat-table-config.md
src/components/data-grid/docs/05-config-driven-tables/infinite-table-config.md
src/components/data-grid/docs/05-config-driven-tables/jsonata-transforms.md
src/components/data-grid/docs/05-config-driven-tables/tree-table-config.md
src/components/data-grid/docs/06-customization/custom-columns.md
src/components/data-grid/docs/06-customization/custom-editors.md
src/components/data-grid/docs/06-customization/custom-features.md
src/components/data-grid/docs/06-customization/styling-theming.md
src/components/data-grid/docs/07-api-reference.md
```

- [ ] **Step 2: Verify all hyperlinks are correct**

Spot-check:
- README links to all sections
- Each feature doc links back to README
- Progressive walkthrough is referenced from README and features
- Config docs link to raw props alternatives
- All links use relative markdown paths (`[text](path.md)`)

- [ ] **Step 3: Final comprehensive commit**

```bash
git add docs/superpowers/specs/2026-03-12-data-grid-docs-design.md
git commit -m "docs: design for data-grid documentation and CLAUDE.md update"
```

Then:

```bash
git log --oneline -10
```

Expected to see:
- `docs: update CLAUDE.md to reflect consolidated data-grid structure`
- `docs: create data-grid docs index hub`
- `docs: add quick start guide`
- `docs: add progressive walkthrough example`
- `docs: add feature documentation (...)`
- `docs: add data mode examples (...)`
- `docs: add config basics and JSONata transforms guide`
- `docs: add config-driven table examples (...)`
- `docs: add customization guides (...)`
- `docs: add comprehensive API reference`
- `docs: design for data-grid documentation and CLAUDE.md update`

---

## Summary

✅ **CLAUDE.md Updated**
- Reflect consolidated `src/components/data-grid/` structure
- Update folder tree and directory responsibilities
- Update import paths in "Important Files to Read First"

✅ **Documentation Complete**
- **README.md**: Index hub with quick navigation (8 sections)
- **01-quick-start.md**: 5-minute minimal example
- **02-progressive-walkthrough.md**: 6-step feature layering
- **03-features/**: 8 feature guides (sorting, filtering, selection, pinning, grouping, editing, tree, virtualization)
- **04-data-modes-non-config/**: 4 full raw-props examples (flat, paginated, infinite, tree)
- **05-config-driven-tables/**: 6 docs on config approach + JSONata + examples for 3 modes
- **06-customization/**: 4 guides (custom columns, editors, styling, features)
- **07-api-reference.md**: Complete component, column, hook, and type reference

✅ **Navigation**
- All docs hyperlinked
- Every feature doc → feature reference + config example + API reference
- Every mode doc → feature docs + config alternative
- README serves as hub with "Quick Navigation" section

✅ **Examples**
- All examples include both **config-based** and **raw props** approaches
- Full working code for flat, paginated, infinite, tree modes
- JSONata patterns with practical examples
- Custom components (password column, star rating editor, export feature)

---

## Next Steps After Implementation

1. Review all docs in `src/components/data-grid/docs/`
2. Test all hyperlinks are functional
3. Consider adding screenshots or diagrams if helpful
4. Plan doc updates as DataGrid API evolves
```

