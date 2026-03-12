# shadcn Registry: Data Grid Components (v1.0.0)

Welcome to the official shadcn registry for the **Data Grid** component library—a powerful, headless-but-opinionated data grid built on TanStack Table, TanStack Query, and TanStack Virtual.

This registry makes it easy to add the Data Grid and all its supporting components to your shadcn/ui projects using the `shadcn-cli` with a single command.

**Quick Links:**
- [Demo](https://data-grid-demo.example.com) — See the grid in action
- [GitHub Repository](https://github.com/yourusername/data-grid-shadcn-tanstack)
- [Main Documentation](../src/components/data-grid/docs/README.md)

---

## Quick Setup

### 1. Add the Registry to Your Project

Update your `components.json` to include the Data Grid registry:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-lyra",
  "rsc": false,
  "tsx": true,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  },
  "registries": {
    "data-grid": "https://raw.githubusercontent.com/yourusername/data-grid-shadcn-tanstack/main/registry/registry.json"
  }
}
```

### 2. Install Components

Use the shadcn CLI to add components from the registry:

```bash
npx shadcn-cli add --registry data-grid data-grid-core
```

That's it! The core grid component and all its dependencies will be installed.

---

## Component Groups

The Data Grid registry is organized into 6 logical groups. Install only what you need, or stack them together for the full experience.

### data-grid-core ⭐ (Required)

The essential grid component. Contains the DataGrid component, orchestration hooks, types, and utilities.

**What it includes:**
- `DataGrid` component for rendering tables
- `useDataGrid` hook for state orchestration
- Feature hooks (sorting, filtering, selection, etc.)
- Type definitions and contracts
- Utility functions (formatters, CSV export, grid helpers)
- Context layer for data sharing

**Main NPM dependencies:**
- `@tanstack/react-table@^8.21.3`
- `@tanstack/react-query@^5.90.21`
- `@tanstack/react-virtual@^3.13.21`
- `@dnd-kit/core@^6.3.1`
- `@dnd-kit/sortable@^10.0.0`
- `date-fns@^4.1.0`
- `match-sorter@^8.2.0`

**shadcn/ui primitives needed:**
- `button`
- `table`
- `popover`
- `dropdown-menu`
- `select`
- `dialog`
- `calendar`
- `input`

**When to use:**
- Always—this is the foundation for any Data Grid implementation.

**Install:**
```bash
npx shadcn-cli add --registry data-grid data-grid-core
```

---

### data-grid-columns

Typed column factory helpers for building columns with sensible defaults and metadata.

**What it includes:**
- `stringColumn()` — Text columns with copy support
- `numberColumn()` — Numeric columns with formatting
- `booleanColumn()` — Boolean display and editing
- `selectColumn()` — Dropdown/option-based columns
- `multiValueColumn()` — Tag/chip-based multi-select columns
- `dateColumn()` — Date display and editing
- `codeColumn()` — Monospace text rendering

**Main NPM dependencies:**
- `lucide-react@^0.577.0`

**shadcn/ui primitives needed:**
- `input`
- `badge`
- `button`
- `select`

**When to use:**
- Building tables with standard column types
- Want strongly-typed column definitions
- Need sensible defaults for sizing and filtering

**Install:**
```bash
npx shadcn-cli add --registry data-grid data-grid-columns
```

---

### data-grid-editors

Cell editor components for inline editing and mutation support.

**What it includes:**
- `TextEditor` — Text input cells
- `NumberEditor` — Numeric input cells
- `SelectEditor` — Dropdown selector cells
- `DateEditor` — Date picker cells
- `BooleanEditor` — Toggle/checkbox cells
- `CodeEditor` — Code-style text input
- `ChipEditor` — Multi-value tag input
- `getEditor()` — Router to select correct editor by column type

**Main NPM dependencies:**
- `lucide-react@^0.577.0`

**shadcn/ui primitives needed:**
- `input`
- `select`
- `checkbox`
- `popover`
- `button`
- `calendar`

**When to use:**
- Enabling inline editing on your grid
- Need type-specific edit UX
- Building mutation workflows

**Install:**
```bash
npx shadcn-cli add --registry data-grid data-grid-editors
```

---

### data-grid-features

Modular feature implementations covering advanced table behavior.

**What it includes:**
- **Filtering** — Column-level filters, faceted value display, fuzzy search
- **Sorting** — Multi-column sort with sort indicators
- **Selection** — Row checkboxes and selection state management
- **Pinning** — Column and row pinning with sticky positioning
- **Grouping** — Row grouping and grouped row rendering
- **Editing** — Inline edit state, optimistic updates, mutation hooks
- **Tree Expansion** — Lazy child loading and tree mode support
- **Virtualization** — Row and column virtualizers for performance
- **Column Ordering** — Drag-and-drop column reordering
- **Loading States** — Skeleton components and loading indicators

**Main NPM dependencies:**
- `@dnd-kit/core@^6.3.1`
- `@dnd-kit/sortable@^10.0.0`
- `@dnd-kit/utilities@^3.2.2`
- `lucide-react@^0.577.0`

**shadcn/ui primitives needed:**
- `popover`
- `button`
- `input`
- `checkbox`
- `calendar`
- `select`

**When to use:**
- Implementing any advanced table feature
- Want modular, composable feature logic
- Building feature-rich data experiences

**Install:**
```bash
npx shadcn-cli add --registry data-grid data-grid-features
```

---

### data-grid-table-engine

Config-driven table abstraction layer for declarative table setup.

**What it includes:**
- `ConfiguredTable` component for rendering from configuration
- `useTableEngine` hook for config-driven state
- DAG-based data source resolution
- JSONata-powered transform pipeline
- API executor for remote data
- Column builder for declarative column definitions
- Config validator for compile-time safety

**Main NPM dependencies:**
- `jsonata@^2.1.0`

**shadcn/ui primitives needed:**
- (Inherited from core and features)

**When to use:**
- Building tables from declarative configuration
- Need data source orchestration and transforms
- Implementing complex multi-step data workflows
- Want a higher-level API than direct `DataGrid` usage

**Install:**
```bash
npx shadcn-cli add --registry data-grid data-grid-table-engine
```

---

### data-grid-docs

Complete documentation and guides (reference only—not installable via `shadcn add`).

**What it includes:**
- Architecture and design specifications
- Quick-start guides
- Progressive feature walkthroughs
- In-depth feature documentation
- Data mode guides (flat, paginated, infinite, tree)
- Config-driven table guides
- Customization and extension guides
- Complete API reference

**When to use:**
- Learning the Data Grid API
- Understanding architecture decisions
- Extending or customizing behavior

**Access:**
Documentation is bundled with the repo and available at:
- `/docs/superpowers/specs/` — Design specifications
- `/docs/superpowers/plans/` — Phase plans and implementation notes
- `/src/components/data-grid/docs/` — Grid documentation and guides

---

## Installation Examples

### Install Core Only

Start minimal and add features as needed:

```bash
npx shadcn-cli add --registry data-grid data-grid-core
```

This gives you the DataGrid component, hooks, and types—everything you need for basic table rendering.

### Install Core + Columns

Add typed column factories for common column types:

```bash
npx shadcn-cli add --registry data-grid data-grid-core
npx shadcn-cli add --registry data-grid data-grid-columns
```

Now you can use `stringColumn()`, `numberColumn()`, etc. to define columns.

### Install Full Stack

Get everything except the table engine:

```bash
npx shadcn-cli add --registry data-grid data-grid-core
npx shadcn-cli add --registry data-grid data-grid-columns
npx shadcn-cli add --registry data-grid data-grid-editors
npx shadcn-cli add --registry data-grid data-grid-features
```

This is the recommended setup for feature-rich, interactive tables with inline editing.

### Install Everything

Add the config-driven table engine for declarative setup:

```bash
npx shadcn-cli add --registry data-grid data-grid-core
npx shadcn-cli add --registry data-grid data-grid-columns
npx shadcn-cli add --registry data-grid data-grid-editors
npx shadcn-cli add --registry data-grid data-grid-features
npx shadcn-cli add --registry data-grid data-grid-table-engine
```

Use this if you want declarative table configuration with data source orchestration.

---

## File Structure After Installation

After installing components, your project structure will look like:

```
src/
  components/
    data-grid/
      data-grid.tsx                  # Main DataGrid component
      data-grid-*.tsx                # Supporting components
      context.tsx                    # Context providers
      index.ts                       # Public API
      hooks/
        use-data-grid.ts            # Main orchestration hook
        use-column-resize.ts
        use-infinite-data.ts
        use-mobile.ts
      types/
        grid-types.ts               # Configuration types
        column-types.ts
        filter-types.ts
        sort-types.ts
        editor-types.ts
        slot-types.ts
      utils/
        grid-utils.ts               # Helper functions
        formatters.ts
        csv-export.ts
      columns/
        string-column.tsx           # Column factories
        number-column.tsx
        boolean-column.tsx
        select-column.tsx
        multi-value-column.tsx
        date-column.tsx
        code-column.tsx
        index.ts
      editors/
        text-editor.tsx             # Cell editors
        number-editor.tsx
        select-editor.tsx
        date-editor.tsx
        boolean-editor.tsx
        code-editor.tsx
        chip-editor.tsx
        get-editor.ts
        index.ts
      features/
        filtering/                  # Feature modules
        sorting/
        selection/
        pinning/
        grouping/
        editing/
        tree/
        virtualization/
        ordering/
        loading/
      table-engine/                 # Config-driven system (optional)
        configured-table.tsx
        use-table-engine.ts
        types.ts
        ...
```

---

## Next Steps

### Learn the API

Start with the quick-start guide:
- [INSTALLATION.md](./INSTALLATION.md) — Detailed setup and integration guide
- [Grid Docs](../src/components/data-grid/docs/README.md) — Complete API reference

### See It In Action

Visit the demo to explore all features:
- [Live Demo](https://data-grid-demo.example.com)

### Dive Into Documentation

Progressive learning path:
1. **Quick Start** — Get rendering data in 5 minutes
2. **Progressive Walkthrough** — Understand each feature layer
3. **Feature Docs** — Deep dives into sorting, filtering, editing, etc.
4. **Data Modes** — Learn flat, paginated, infinite, and tree modes
5. **Config-Driven Tables** — Build tables from declarative configuration
6. **Customization** — Extend with custom columns, editors, and features
7. **API Reference** — Complete type and function reference

---

## Troubleshooting

### `shadcn-cli` Can't Find the Registry

**Problem:** `Error: registry not found`

**Solution:** Make sure your `components.json` includes the registry URL:

```json
{
  "registries": {
    "data-grid": "https://raw.githubusercontent.com/yourusername/data-grid-shadcn-tanstack/main/registry/registry.json"
  }
}
```

### Missing shadcn/ui Primitives

**Problem:** TypeScript errors about missing components like `<Button>` or `<Table>`

**Solution:** The registry declares all required primitives in `registryDependencies`. Install missing ones:

```bash
npx shadcn-cli add button
npx shadcn-cli add table
npx shadcn-cli add popover
```

### Import Errors After Installation

**Problem:** `Cannot find module '@/components/data-grid'`

**Solution:** Check your `components.json` aliases match your actual project structure:

```json
{
  "aliases": {
    "components": "@/components",  // Match your src/components path
    "utils": "@/lib/utils"
  }
}
```

### Conflicting TanStack Versions

**Problem:** Peer dependency warnings about `@tanstack/react-table`

**Solution:** The registry specifies exact TanStack versions. If your project has different versions, update to:

```bash
npm install @tanstack/react-table@^8.21.3 @tanstack/react-query@^5.90.21 @tanstack/react-virtual@^3.13.21
```

### Column Factory Not Working

**Problem:** `stringColumn()` returns `any` instead of typed column

**Solution:** Make sure you've installed `data-grid-columns` and are importing from the right module:

```typescript
import { stringColumn, numberColumn } from '@/components/data-grid/columns'
```

### Features Not Available

**Problem:** Filtering or editing UI doesn't show up

**Solution:** Install the `data-grid-features` and `data-grid-editors` groups:

```bash
npx shadcn-cli add --registry data-grid data-grid-features
npx shadcn-cli add --registry data-grid data-grid-editors
```

Then enable features in your DataGrid config:

```tsx
<DataGrid
  data={data}
  columns={columns}
  features={{
    filtering: { enabled: true },
    editing: { enabled: true }
  }}
/>
```

---

## Support & Contributing

For issues, feature requests, or contributions:
- Open an issue on [GitHub](https://github.com/yourusername/data-grid-shadcn-tanstack)
- Check the [docs](../src/components/data-grid/docs/README.md) for common questions
- Review the [design specs](../docs/superpowers/specs/) for architectural context

---

## Version Info

- **Registry Version:** 1.0.0
- **Data Grid Version:** 1.0.0
- **TanStack React Table:** ^8.21.3
- **TanStack React Query:** ^5.90.21
- **TanStack React Virtual:** ^3.13.21
- **shadcn/ui:** Latest (base-lyra style)

---

**Happy gridding!** 🚀
