# Data Grid Project Gist

## What This Repository Is

This project is a React + TypeScript demo and component workspace for a
headless-but-opinionated data grid built on top of:

- TanStack Table for row/column state and table modeling
- TanStack Query for paginated and infinite remote data flows
- TanStack Virtual for row and column virtualization
- shadcn/ui primitives for UI building blocks
- Vite for local development and bundling

At runtime, the app mounts a demo page that exercises the grid in four modes:

- `flat`: local data, client-side sorting/filtering/grouping
- `paginated`: server-style page loading through React Query
- `infinite`: cursor/page-based incremental loading
- `tree`: hierarchical rows with lazy async expansion

The current codebase is effectively a reusable grid engine plus a demo shell.

## Code Gist

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

### What `useDataGrid` Actually Does

`src/hooks/use-data-grid.ts` is the center of the system. It:

- normalizes config such as density, mode, and feature flags
- wires feature hooks for sorting, filtering, selection, grouping, pinning,
  editing, ordering, loading, tree expansion, and virtualization
- switches between local data, paginated queries, and infinite queries
- injects special columns like row selection and tree expand toggles
- builds the TanStack table instance
- exposes a single context value consumed by grid UI components

In practice, the grid component itself stays relatively thin because most
behavior is delegated into this hook.

### Data Modes

The grid supports four operational modes defined in `src/types/grid-types.ts`:

- `flat`
- `paginated`
- `infinite`
- `tree`

These modes change where data comes from and how rows are resolved:

- `flat` uses local arrays directly
- `paginated` uses a page-aware query function returning `{ rows, total }`
- `infinite` uses an incremental query function returning `{ rows, nextPage }`
- `tree` uses local rows plus `getSubRows` and `onExpand` for lazy children

### Column System

Columns are created through factory helpers in `src/columns/*`, not by writing
raw TanStack column definitions everywhere. Each factory adds:

- sensible sizing defaults
- type metadata
- filtering defaults
- editing metadata
- specialized cell rendering

Examples:

- `string-column.tsx`: copyable text cells
- `number-column.tsx`: numeric formatting and editing metadata
- `select-column.tsx`: option-based cells
- `multi-value-column.tsx`: tag/chip-like values
- `boolean-column.tsx`: badge or boolean-style display
- `code-column.tsx`: code-like text cells
- `date-column.tsx`: date rendering and editing support

### Editing Model

Editing is intentionally lightweight and async-friendly:

- active edit state is tracked in `src/features/editing/use-editing.ts`
- editors live in `src/editors/*`
- mutation flow is delegated through `features.editing.onMutate`
- mutating/error row ids are exposed so the UI can reflect pending/failure state

The demo simulates optimistic server mutation with occasional failure, which
makes the example useful for real-world UX behavior.

### Demo Scope

`src/demo/demo-page.tsx` is the main showcase. It demonstrates:

- 10k-row flat virtualization
- paginated loading
- infinite loading
- tree expansion with lazy child loading
- inline editing
- sorting, filtering, grouping
- selection and pinning

This means the project is not just a static component library; it is a working
reference implementation of the intended grid behavior.

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
|       |   |-- phase-02-core-rendering.md
|       |   |-- phase-03-sorting-filtering.md
|       |   |-- phase-04-selection-pinning-grouping.md
|       |   |-- phase-05-tree-virtualization.md
|       |   |-- phase-06-editing-mutations.md
|       |   |-- phase-07-toolbar-skeleton.md
|       |   |-- phase-08-data-modes.md
|       |   |-- phase-09-polish-demo.md
|       |   |-- phase-10-table-engine-foundation.md
|       |   |-- phase-11-dag-jsonata.md
|       |   |-- phase-12-api-executor.md
|       |   |-- phase-13-column-builder.md
|       |   `-- phase-14-hook-component-demo.md
|       `-- specs/
|           |-- 2026-03-11-data-grid-design.md
|           `-- 2026-03-12-table-engine-design.md
`-- src/
    |-- App.tsx
    |-- index.css
    |-- main.tsx
    |-- assets/
    |-- components/
    |   |-- theme-provider.tsx
    |   |-- data-grid/
    |   |   |-- data-grid-cell.tsx
    |   |   |-- data-grid-context.tsx
    |   |   |-- data-grid-empty.tsx
    |   |   |-- data-grid-header.tsx
    |   |   |-- data-grid-pagination.tsx
    |   |   |-- data-grid-row-skeleton.tsx
    |   |   |-- data-grid-row.tsx
    |   |   |-- data-grid-skeleton.tsx
    |   |   |-- data-grid-toolbar.tsx
    |   |   |-- data-grid.tsx
    |   |   |-- index.ts
    |   |   |-- columns/
    |   |   |   |-- boolean-column.tsx
    |   |   |   |-- code-column.tsx
    |   |   |   |-- date-column.tsx
    |   |   |   |-- index.ts
    |   |   |   |-- multi-value-column.tsx
    |   |   |   |-- number-column.tsx
    |   |   |   |-- select-column.tsx
    |   |   |   `-- string-column.tsx
    |   |   |-- editors/
    |   |   |   |-- boolean-editor.tsx
    |   |   |   |-- chip-editor.tsx
    |   |   |   |-- code-editor.tsx
    |   |   |   |-- date-editor.tsx
    |   |   |   |-- get-editor.ts
    |   |   |   |-- number-editor.tsx
    |   |   |   |-- select-editor.tsx
    |   |   |   `-- text-editor.tsx
    |   |   |-- features/
    |   |   |   |-- editing/
    |   |   |   |-- filtering/
    |   |   |   |-- grouping/
    |   |   |   |-- loading/
    |   |   |   |-- ordering/
    |   |   |   |-- pinning/
    |   |   |   |-- selection/
    |   |   |   |-- sorting/
    |   |   |   |-- tree/
    |   |   |   `-- virtualization/
    |   |   |-- hooks/
    |   |   |   |-- use-column-resize.ts
    |   |   |   |-- use-data-grid.ts
    |   |   |   |-- use-infinite-data.ts
    |   |   |   `-- use-mobile.ts
    |   |   |-- types/
    |   |   |   |-- column-types.ts
    |   |   |   |-- editor-types.ts
    |   |   |   |-- filter-types.ts
    |   |   |   |-- grid-types.ts
    |   |   |   |-- index.ts
    |   |   |   |-- slot-types.ts
    |   |   |   `-- sort-types.ts
    |   |   |-- utils/
    |   |   |   |-- csv-export.ts
    |   |   |   |-- formatters.ts
    |   |   |   |-- grid-utils.ts
    |   |   |   `-- mock-data.ts
    |   |   |-- table-engine/
    |   |   |   |-- README.md
    |   |   |   |-- (table engine implementation files)
    |   |   |   `-- (continued below)
    |   |   |-- docs/
    |   |   |   |-- README.md
    |   |   |   |-- 01-quick-start.md
    |   |   |   |-- 02-progressive-walkthrough.md
    |   |   |   |-- 03-features/
    |   |   |   |-- 04-data-modes-non-config/
    |   |   |   |-- 05-config-driven-tables/
    |   |   |   |-- 06-customization/
    |   |   |   `-- 07-api-reference.md
    |   |   `-- ui/
    |   |       `-- shadcn/ui primitives and wrappers
    |-- demo/
    |   |-- demo-columns.ts
    |   `-- demo-page.tsx
    |-- lib/
    |   `-- utils.ts
```

## Directory Responsibilities

### `src/components/data-grid/`

The complete grid system consolidated under a single directory. This folder
contains all grid-related logic, components, features, types, and utilities:

#### Core Components
- `data-grid.tsx`: public grid component, provider setup, body rendering,
  drag-and-drop column ordering, density variables
- `data-grid-context.tsx`: shared context contract between hook and UI
- `data-grid-header.tsx`: header rendering, sorting/filter UI hooks
- `data-grid-row.tsx` and `data-grid-cell.tsx`: row/cell presentation
- `data-grid-toolbar.tsx`: global controls
- `data-grid-pagination.tsx`: pagination mode footer
- skeleton and empty-state files: loading and zero-data UX

#### `hooks/` Subdirectory

Orchestration and integration logic:

- `use-data-grid.ts`: main orchestration hook, composes all features, manages table state
- `use-column-resize.ts`: column resizing behavior
- `use-infinite-data.ts`: infinite scroll data loading
- `use-mobile.ts`: responsive/mobile detection

#### `features/` Subdirectory

Feature behavior decomposed by concern:

- `editing/`: inline edit state and mutation support
- `filtering/`: filter state, popovers, fuzzy filter helpers, filter row UI
- `grouping/`: TanStack grouping behavior and grouped row rendering
- `loading/`: derived loading state and skeleton fragments
- `ordering/`: column reordering state
- `pinning/`: row and column pinning behavior
- `selection/`: checkbox/selection state and selection column
- `sorting/`: sorting state and sort indicators
- `tree/`: expand toggle and lazy child loading
- `virtualization/`: row and column virtualizer hooks

This is the most important subdirectory for understanding how the grid gains
capabilities without becoming monolithic.

#### `columns/` Subdirectory

Typed column factories. Gives consumers a higher-level API than manual
TanStack `ColumnDef` authoring. Main extension point for new column behaviors.

- `string-column.tsx`, `number-column.tsx`, `boolean-column.tsx`: basic types
- `select-column.tsx`, `multi-value-column.tsx`: enumeration-based columns
- `date-column.tsx`, `code-column.tsx`: specialized display/edit types

#### `editors/` Subdirectory

Renderer/editor counterparts for editable cells:

- `get-editor.ts`: maps column metadata to the correct editing component
- Individual editors: `text-editor.tsx`, `number-editor.tsx`, `select-editor.tsx`,
  `date-editor.tsx`, `boolean-editor.tsx`, `code-editor.tsx`, `chip-editor.tsx`

#### `types/` Subdirectory

Shared contracts that anchor the system:

- `grid-types.ts`: grid mode and feature configuration
- `column-types.ts`: column metadata
- `filter-types.ts`: filtering state contracts
- `sort-types.ts`: sorting state
- `editor-types.ts`: editor component props
- `slot-types.ts`: extensibility slots

If extending the grid, start here before changing behavior elsewhere.

#### `utils/` Subdirectory

Utility functions and helpers:

- `mock-data.ts`: simulates real-world local, paginated, infinite, and tree data
- `formatters.ts`: centralizes value display rules
- `csv-export.ts`: export support
- `grid-utils.ts`: shared grid helper logic

#### `table-engine/` Subdirectory

Config-driven table engine (Phase 14+):

- Declarative table configuration abstraction
- DAG-based data source resolution
- JSONata-powered transforms
- API executor

#### `docs/` Subdirectory

Grid documentation and usage guides:

- `README.md`: grid overview and quick start
- `01-quick-start.md`: getting started with DataGrid
- `02-progressive-walkthrough.md`: feature walkthrough
- `03-features/`: deep dives into specific features
- `04-data-modes-non-config/`: local, paginated, infinite, tree modes
- `05-config-driven-tables/`: table engine configuration
- `06-customization/`: extending the grid
- `07-api-reference.md`: complete API reference

### `src/demo/`

A consumer-style example of the grid API. This is the best onboarding path for
understanding how the public component is supposed to be used.

### `docs/superpowers/plans/`

The project’s phased implementation history. Phases 1 through 14 describe the
intended rollout of foundation, rendering, interactivity, data modes, and the
table-engine abstraction.

### `docs/superpowers/specs/`

Higher-level design docs:

- `2026-03-11-data-grid-design.md`: grid architecture/design
- `2026-03-12-table-engine-design.md`: approved config-driven table engine

The second spec makes it clear the repo is evolving from a direct `DataGrid`
API toward a declarative table engine layer.

## Important Files To Read First

If a new contributor wants the fastest high-signal reading order:

1. `package.json`
2. `src/components/data-grid/docs/README.md` (grid overview and integration guide)
3. `src/demo/demo-page.tsx` (working example usage)
4. `src/components/data-grid/data-grid.tsx` (main component)
5. `src/components/data-grid/hooks/use-data-grid.ts` (orchestration logic)
6. `src/components/data-grid/types/grid-types.ts` (configuration contracts)
7. `src/components/data-grid/types/column-types.ts` (column metadata)
8. `src/demo/demo-columns.ts` (column factory usage)
9. `src/components/data-grid/features/*` (specific feature implementation)
10. `docs/superpowers/specs/2026-03-12-table-engine-design.md` (next-phase table engine)

## Current Capability Snapshot

Implemented in the current repo:

- reusable `DataGrid` component
- client-side sorting and filtering
- row selection
- column and row pinning
- grouping
- row virtualization
- tree mode with lazy expansion
- inline editing and async mutation hooks
- toolbar and loading states
- paginated and infinite remote-data patterns
- typed column factories and editors

Planned/ongoing direction:

- config-driven table engine under `src/lib/table-engine/`
- DAG-based data source resolution
- JSONata-powered transforms
- declarative table configuration layer on top of existing grid rendering

## Practical Summary

This repo is best understood as two layers:

- a mature grid runtime already capable of rendering complex table behavior
- a next-step design effort to wrap that runtime in a declarative table engine

All grid-related code is now consolidated under `src/components/data-grid/`.

### Navigation by Task

**Learning the grid:**
- Start with `src/components/data-grid/docs/README.md`
- Review `src/demo/demo-page.tsx` for usage examples
- Explore `docs/superpowers/specs/` for architectural intent

**Changing rendering:**
- `src/components/data-grid/data-grid*.tsx` files (main component and subcomponents)
- `src/components/data-grid/types/` for contracts

**Changing behavior:**
- `src/components/data-grid/hooks/use-data-grid.ts` (orchestration)
- `src/components/data-grid/features/*` (feature-specific logic)

**Extending the API:**
- `src/components/data-grid/columns/*` (column factories)
- `src/components/data-grid/editors/*` (cell editors)
- `src/components/data-grid/types/*` (contracts and configuration)

**Next-phase development:**
- `src/components/data-grid/table-engine/` (config-driven tables)
- `docs/superpowers/specs/2026-03-12-table-engine-design.md` (design specification)
