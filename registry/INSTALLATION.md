# Data Grid Installation Guide

This guide provides detailed step-by-step instructions for installing the Data Grid components from the shadcn registry into your project. Choose the installation scenario that best fits your needs.

---

## Prerequisites

Before you begin, ensure your project meets these requirements:

- **Node.js**: v18.0 or higher
- **React**: v18.0 or higher
- **TypeScript**: v5.0 or higher
- **shadcn/cli**: v0.8.0 or higher (install with `npm install -g shadcn-cli@latest`)
- **Existing shadcn/ui Project**: A React + TypeScript project with:
  - Tailwind CSS configured
  - `components.json` in your project root
  - At least one shadcn component already installed (e.g., `button`)

### Verify Prerequisites

Check your setup:

```bash
# Verify Node.js version (should be 18+)
node --version

# Verify shadcn/cli is installed
shadcn-cli --version

# Verify your components.json exists
cat components.json
```

---

## Registry Setup

### Step 1: Update components.json

Add the Data Grid registry to your `components.json` file:

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
    "default": "https://ui.shadcn.com/r",
    "data-grid": "https://raw.githubusercontent.com/yourusername/data-grid-shadcn-tanstack/main/registry/registry.json"
  }
}
```

**Important:** Replace `yourusername` with the actual GitHub organization or username hosting the registry.

### Step 2: Verify Registry Access

Test that the registry is accessible:

```bash
# List available components in the data-grid registry
shadcn-cli list --registry data-grid
```

You should see output listing the available component groups:
- `data-grid-core`
- `data-grid-columns`
- `data-grid-editors`
- `data-grid-features`
- `data-grid-table-engine`
- `data-grid-docs`

### Step 3: Quick Test Install

Install the core component to verify the registry works:

```bash
npx shadcn-cli add --registry data-grid data-grid-core
```

Expected output:
```
✓ Installed successfully
✓ Updated components.json
```

Files will be installed to `src/components/data-grid/`.

---

## Installation Scenarios

Choose the scenario that matches your use case. Each includes the exact commands and explanation of what you're enabling.

### Scenario 1: Core Only

**Best for:** Basic table rendering with minimal dependencies. Perfect for simple read-only tables or prototypes.

**What You Get:**
- DataGrid component for table rendering
- useDataGrid hook for state orchestration
- TypeScript types and contracts
- Utility functions (CSV export, formatters, grid helpers)
- Context layer for component communication

**What You Cannot Do:**
- Use column factories (need data-grid-columns)
- Edit inline cells (need data-grid-editors)
- Access advanced features like filtering or sorting UI (need data-grid-features)

**Installation Steps:**

```bash
# Step 1: Install core component
npx shadcn-cli add --registry data-grid data-grid-core

# Step 2: Verify installation
ls src/components/data-grid/
```

**Expected Files Created:**
```
src/components/data-grid/
├── data-grid.tsx
├── data-grid-context.tsx
├── data-grid-header.tsx
├── data-grid-row.tsx
├── data-grid-cell.tsx
├── data-grid-toolbar.tsx
├── data-grid-pagination.tsx
├── data-grid-empty.tsx
├── data-grid-skeleton.tsx
├── data-grid-row-skeleton.tsx
├── index.ts
├── hooks/
│   ├── use-data-grid.ts
│   ├── use-column-resize.ts
│   ├── use-infinite-data.ts
│   └── use-mobile.ts
├── types/
│   ├── grid-types.ts
│   ├── column-types.ts
│   ├── filter-types.ts
│   ├── sort-types.ts
│   ├── editor-types.ts
│   └── slot-types.ts
└── utils/
    ├── grid-utils.ts
    ├── formatters.ts
    └── csv-export.ts
```

**Quick Test:**

Create `src/pages/test-grid.tsx`:

```tsx
import React from 'react'
import { DataGrid } from '@/components/data-grid'

export function TestGrid() {
  const columns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' }
  ]

  const data = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ]

  return (
    <DataGrid
      columns={columns}
      data={data}
      mode="flat"
    />
  )
}
```

**Next Steps:** Add `data-grid-columns` when you need typed column factories, or add `data-grid-features` for filtering/sorting UI.

---

### Scenario 2: Core + Columns

**Best for:** Standard tables with common column types (text, numbers, dates, etc.). Most frequent use case.

**What You Get (in addition to Core):**
- `stringColumn()` factory for text columns with copy support
- `numberColumn()` factory for numeric columns with formatting
- `booleanColumn()` factory for boolean display
- `selectColumn()` factory for dropdown-based columns
- `multiValueColumn()` factory for tag/chip-based multi-select
- `dateColumn()` factory for date display and editing support
- `codeColumn()` factory for monospace text

**Installation Steps:**

```bash
# Step 1: Install core (if not already installed)
npx shadcn-cli add --registry data-grid data-grid-core

# Step 2: Install columns
npx shadcn-cli add --registry data-grid data-grid-columns

# Step 3: Verify installation
ls src/components/data-grid/columns/
```

**Expected Files Created:**
```
src/components/data-grid/
├── [core files from scenario 1]
└── columns/
    ├── string-column.tsx
    ├── number-column.tsx
    ├── boolean-column.tsx
    ├── select-column.tsx
    ├── multi-value-column.tsx
    ├── date-column.tsx
    ├── code-column.tsx
    └── index.ts
```

**Usage Example:**

Create `src/pages/typed-grid.tsx`:

```tsx
import React from 'react'
import { DataGrid } from '@/components/data-grid'
import {
  stringColumn,
  numberColumn,
  dateColumn,
  selectColumn
} from '@/components/data-grid/columns'

export function TypedGrid() {
  const columns = [
    stringColumn({ accessorKey: 'name', header: 'Name' }),
    numberColumn({ accessorKey: 'age', header: 'Age' }),
    dateColumn({ accessorKey: 'joinDate', header: 'Join Date' }),
    selectColumn({
      accessorKey: 'status',
      header: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    })
  ]

  const data = [
    { name: 'John', age: 30, joinDate: '2023-01-15', status: 'active' },
    { name: 'Jane', age: 28, joinDate: '2023-02-20', status: 'active' }
  ]

  return (
    <DataGrid
      columns={columns}
      data={data}
      mode="flat"
    />
  )
}
```

**What Column Factories Provide:**
- Type-safe column definitions
- Sensible default column sizing
- Built-in filtering metadata
- Display formatting rules
- Import lucide icons for column decorations

**Next Steps:** Add `data-grid-editors` to enable inline cell editing.

---

### Scenario 3: Core + Columns + Editors + Features

**Best for:** Feature-rich, interactive tables with inline editing, filtering, sorting, and advanced capabilities.

**What You Get (in addition to Core + Columns):**
- Cell editors for all column types
- Inline edit state management
- Optimistic update support
- Mutation hooks
- Filtering UI with column-level filter popovers
- Sorting indicators and sort UI
- Row selection with checkboxes
- Column and row pinning
- Row grouping
- Tree expansion with lazy loading
- Row and column virtualization
- Drag-and-drop column reordering
- Loading state management and skeletons

**Installation Steps:**

```bash
# Step 1: Install core
npx shadcn-cli add --registry data-grid data-grid-core

# Step 2: Install columns
npx shadcn-cli add --registry data-grid data-grid-columns

# Step 3: Install editors
npx shadcn-cli add --registry data-grid data-grid-editors

# Step 4: Install features
npx shadcn-cli add --registry data-grid data-grid-features

# Step 5: Verify all installed
ls -R src/components/data-grid/
```

**Expected Directory Structure:**
```
src/components/data-grid/
├── [core files]
├── columns/
│   ├── [column factories]
│   └── index.ts
├── editors/
│   ├── text-editor.tsx
│   ├── number-editor.tsx
│   ├── select-editor.tsx
│   ├── date-editor.tsx
│   ├── boolean-editor.tsx
│   ├── code-editor.tsx
│   ├── chip-editor.tsx
│   ├── get-editor.ts
│   └── index.ts
└── features/
    ├── filtering/
    │   ├── use-filtering.ts
    │   ├── column-filter-popover.tsx
    │   ├── filter-row.tsx
    │   └── [other filter files]
    ├── sorting/
    │   ├── use-sorting.ts
    │   └── sort-indicator.tsx
    ├── selection/
    │   ├── use-selection.ts
    │   └── selection-cell.tsx
    ├── pinning/
    │   ├── use-column-pinning.ts
    │   ├── use-row-pinning.ts
    │   └── pinned-shadow.tsx
    ├── grouping/
    │   ├── use-grouping.ts
    │   └── group-row.tsx
    ├── editing/
    │   ├── use-editing.ts
    │   └── optimistic-update.ts
    ├── tree/
    │   ├── use-lazy-expand.ts
    │   └── expand-toggle.tsx
    ├── virtualization/
    │   └── use-virtualization.ts
    ├── ordering/
    │   └── use-column-ordering.ts
    └── loading/
        ├── use-loading-state.ts
        └── [skeleton components]
```

**Full-Featured Example:**

Create `src/pages/feature-rich-grid.tsx`:

```tsx
import React, { useState } from 'react'
import { DataGrid } from '@/components/data-grid'
import {
  stringColumn,
  numberColumn,
  selectColumn
} from '@/components/data-grid/columns'

export function FeatureRichGrid() {
  const [data, setData] = useState([
    { id: 1, name: 'John', role: 'Engineer', salary: 100000 },
    { id: 2, name: 'Jane', role: 'Designer', salary: 95000 }
  ])

  const columns = [
    stringColumn({ accessorKey: 'name', header: 'Name' }),
    selectColumn({
      accessorKey: 'role',
      header: 'Role',
      options: [
        { value: 'Engineer', label: 'Engineer' },
        { value: 'Designer', label: 'Designer' },
        { value: 'Manager', label: 'Manager' }
      ]
    }),
    numberColumn({ accessorKey: 'salary', header: 'Salary' })
  ]

  return (
    <DataGrid
      columns={columns}
      data={data}
      mode="flat"
      features={{
        filtering: { enabled: true },
        sorting: { enabled: true },
        selection: { enabled: true },
        editing: {
          enabled: true,
          onMutate: async (rowId, columnId, value) => {
            // Handle mutation (API call, state update, etc.)
            console.log(`Update row ${rowId}, column ${columnId} to ${value}`)
            return { success: true }
          }
        },
        pinning: { enabled: true },
        grouping: { enabled: true },
        ordering: { enabled: true },
        virtualization: { enabled: true }
      }}
      toolbar={{ enabled: true }}
    />
  )
}
```

**Key Features Enabled:**
- Click column header to sort or open filter popover
- Click row checkbox to select
- Double-click cell to edit inline
- Drag column header to reorder
- Right-click header to pin/unpin column
- Group by clicking group button in toolbar
- Export to CSV from toolbar

**Next Steps:** Consider adding `data-grid-table-engine` if you need config-driven table setup.

---

### Scenario 4: Everything (Full Stack)

**Best for:** Advanced use cases requiring declarative table configuration, data orchestration, and complex multi-step data workflows.

**What You Get (in addition to Scenarios 1-3):**
- `ConfiguredTable` component for rendering from configuration
- `useTableEngine` hook for config-driven state management
- DAG-based data source resolution
- JSONata-powered transform pipeline
- API executor for remote data operations
- Column builder for declarative column definitions
- Config validator for compile-time safety

**Installation Steps:**

```bash
# Step 1: Install all components in order
npx shadcn-cli add --registry data-grid data-grid-core
npx shadcn-cli add --registry data-grid data-grid-columns
npx shadcn-cli add --registry data-grid data-grid-editors
npx shadcn-cli add --registry data-grid data-grid-features
npx shadcn-cli add --registry data-grid data-grid-table-engine

# Step 2: Verify npm dependencies
npm list @tanstack/react-table @tanstack/react-query @tanstack/react-virtual

# Step 3: Build to verify everything compiles
npm run build
```

**Why This Installation Order:**
1. **Core first**: Foundation layer providing all base types and contracts
2. **Columns next**: Extends core with typed factories
3. **Editors third**: Depends on column types for routing
4. **Features fourth**: Advanced behavior depending on core + columns
5. **Table engine last**: High-level orchestration depending on all prior components

**Expected Directory Structure:**
```
src/components/data-grid/
├── [everything from previous scenarios]
└── table-engine/
    ├── configured-table.tsx
    ├── use-table-engine.ts
    ├── config-validator.ts
    ├── column-builder.ts
    ├── dag-resolver.ts
    ├── jsonata-transform.ts
    ├── api-executor.ts
    └── types.ts
```

**Config-Driven Example:**

Create `src/pages/configured-grid.tsx`:

```tsx
import React from 'react'
import { ConfiguredTable } from '@/components/data-grid/table-engine'

export function ConfiguredGrid() {
  const config = {
    name: 'employees',
    description: 'Employee directory',
    mode: 'flat',
    dataSources: {
      employees: {
        type: 'api',
        endpoint: 'https://api.example.com/employees',
        method: 'GET'
      }
    },
    columns: [
      {
        key: 'name',
        header: 'Name',
        type: 'string',
        visible: true
      },
      {
        key: 'email',
        header: 'Email',
        type: 'string',
        visible: true
      },
      {
        key: 'salary',
        header: 'Salary',
        type: 'number',
        visible: true,
        formatting: { decimals: 0, prefix: '$' }
      }
    ],
    features: {
      filtering: { enabled: true },
      sorting: { enabled: true },
      selection: { enabled: true },
      editing: { enabled: true },
      virtualization: { enabled: true }
    }
  }

  return <ConfiguredTable config={config} />
}
```

**When to Use Table Engine:**
- Building tables from JSON configuration files
- Need complex data source orchestration
- Want to apply transforms to multiple sources
- Building a visual table builder or admin panel
- Need environment-based configuration

---

### Scenario 5: Incremental Installation

**Best for:** Projects that want to start small and add capabilities gradually as needed.

**Phase 1 - Foundation (Week 1):**
Get a working table rendering data.

```bash
npx shadcn-cli add --registry data-grid data-grid-core
```

Deploy and test in staging. Size: ~8KB gzipped.

**Phase 2 - Column Factories (Week 2):**
Enable typed column definitions with sensible defaults.

```bash
npx shadcn-cli add --registry data-grid data-grid-columns
```

Update your column definitions to use factories. Size increase: ~2KB.

**Phase 3 - Sorting & Filtering (Week 3):**
Add interactive sorting and filtering UI.

```bash
npx shadcn-cli add --registry data-grid data-grid-features
```

Enable `features.sorting` and `features.filtering` in your config. Size increase: ~12KB.

**Phase 4 - Editing (Week 4):**
Enable inline cell editing.

```bash
npx shadcn-cli add --registry data-grid data-grid-editors
```

Add mutation handler to editing feature config. Size increase: ~8KB.

**Phase 5 - Advanced Features (Week 5):**
When users request pinning, grouping, or selection.

All features are already included in `data-grid-features`. Just enable them in your config:

```tsx
<DataGrid
  features={{
    pinning: { enabled: true },
    grouping: { enabled: true },
    selection: { enabled: true }
  }}
/>
```

**Phase 6 - Config-Driven Tables (Month 2):**
Only if you need declarative configuration.

```bash
npx shadcn-cli add --registry data-grid data-grid-table-engine
```

Total installed: ~35KB gzipped (all phases).

---

## Verification Steps

After installation, verify everything is working correctly.

### Check TypeScript Compilation

```bash
# Verify types are correct
npx tsc --noEmit

# Should output: "Successfully compiled X files"
```

### Verify Imports Work

Create a test file to check imports:

```tsx
// src/__tests__/imports.test.tsx
import { DataGrid } from '@/components/data-grid'
import { useDataGrid } from '@/components/data-grid/hooks/use-data-grid'
import type { GridConfig } from '@/components/data-grid/types'

// If using columns
import { stringColumn, numberColumn } from '@/components/data-grid/columns'

// If using editors
import { getEditor } from '@/components/data-grid/editors'

// If using features
import { useFiltering } from '@/components/data-grid/features/filtering'

export function ImportsCheck() {
  return <div>Imports working</div>
}
```

Compile to verify:

```bash
npx tsc --noEmit
```

### Check npm Dependencies

```bash
# List installed versions
npm list @tanstack/react-table
npm list @tanstack/react-query
npm list @tanstack/react-virtual

# Should show:
# @tanstack/react-table@8.21.3
# @tanstack/react-query@5.90.21
# @tanstack/react-virtual@3.13.21
```

### Verify shadcn/ui Primitives

Check that required primitives are installed:

```bash
# For core
ls src/components/ui/ | grep -E 'button|table|popover|dropdown|select|dialog|calendar|input'

# Should list all the above components
```

If any are missing:

```bash
# Install missing primitives
npx shadcn-cli add button
npx shadcn-cli add table
npx shadcn-cli add popover
npx shadcn-cli add dropdown-menu
npx shadcn-cli add select
npx shadcn-cli add dialog
npx shadcn-cli add calendar
npx shadcn-cli add input
```

### Run a Quick Component Test

Create `src/__tests__/basic-grid.tsx`:

```tsx
import React from 'react'
import { DataGrid } from '@/components/data-grid'

export function BasicGridTest() {
  const columns = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' }
  ]

  const data = [
    { id: 1, name: 'Test Row 1' },
    { id: 2, name: 'Test Row 2' },
    { id: 3, name: 'Test Row 3' }
  ]

  return (
    <div>
      <h1>Basic Grid Test</h1>
      <DataGrid
        columns={columns}
        data={data}
        mode="flat"
      />
    </div>
  )
}
```

Verify in browser:
1. Render the component in your app
2. Check that a table with 3 rows renders
3. Verify no console errors

---

## TypeScript Setup

### Ensure Type Definitions Are Available

After installation, TypeScript should automatically pick up types. Verify by checking for declaration files:

```bash
# Should exist
ls src/components/data-grid/types/
ls src/components/data-grid/hooks/use-data-grid.ts
```

### Configure tsconfig if Needed

Your `tsconfig.json` should include:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Import All Available Types

Use TypeScript's type inference wherever possible, but you can also import types explicitly:

```tsx
import type {
  GridConfig,
  GridMode,
  ColumnDef,
  FilterValue,
  SortingState,
  SelectionState
} from '@/components/data-grid/types'
```

### Enable Strict Type Checking

For best results, use strict TypeScript:

```tsx
// Good: Type-safe column factory usage
import { stringColumn } from '@/components/data-grid/columns'

const columns = [
  stringColumn({
    accessorKey: 'name',
    header: 'Name',
    size: 200
  })
]

// TypeScript will catch:
// - Missing required accessorKey
// - Type mismatches
// - Unknown property names
```

---

## Common Installation Issues

### Issue: Registry Not Found

**Error:**
```
Error: registry not found: data-grid
```

**Solution:**
1. Verify `components.json` has the registry entry:
   ```bash
   cat components.json | grep data-grid
   ```
2. Ensure the GitHub URL is correct:
   ```bash
   curl https://raw.githubusercontent.com/yourusername/data-grid-shadcn-tanstack/main/registry/registry.json
   ```
3. Update shadcn/cli to latest:
   ```bash
   npm install -g shadcn-cli@latest
   ```

### Issue: Missing Dependencies

**Error:**
```
Cannot find module '@tanstack/react-table'
```

**Solution:**
```bash
# Install all core dependencies
npm install @tanstack/react-table@^8.21.3 \
  @tanstack/react-query@^5.90.21 \
  @tanstack/react-virtual@^3.13.21 \
  @dnd-kit/core@^6.3.1 \
  @dnd-kit/sortable@^10.0.0 \
  @dnd-kit/utilities@^3.2.2 \
  date-fns@^4.1.0 \
  clsx@^2.1.1 \
  match-sorter@^8.2.0 \
  @tanstack/match-sorter-utils@^8.19.4
```

Verify installation:
```bash
npm list @tanstack/react-table
```

### Issue: Missing shadcn/ui Primitives

**Error:**
```
Cannot find module '@/components/ui/button'
```

**Solution:**
Install missing primitives. The registry declares all required ones in `registryDependencies`. Install them:

```bash
# Core primitives
npx shadcn-cli add button
npx shadcn-cli add table
npx shadcn-cli add input
npx shadcn-cli add popover
npx shadcn-cli add dropdown-menu
npx shadcn-cli add select
npx shadcn-cli add dialog
npx shadcn-cli add calendar
npx shadcn-cli add checkbox
npx shadcn-cli add badge
```

Verify:
```bash
ls src/components/ui/ | wc -l
# Should be at least 10 files
```

### Issue: Conflicting TanStack Versions

**Error:**
```
peer dependency warning: @tanstack/react-table@8.15.0 not met
```

**Solution:**
Update to the correct versions:

```bash
npm install @tanstack/react-table@^8.21.3 \
  @tanstack/react-query@^5.90.21 \
  @tanstack/react-virtual@^3.13.21
```

Check package.json:
```bash
grep "@tanstack" package.json
```

Should show:
```json
"@tanstack/react-table": "^8.21.3",
"@tanstack/react-query": "^5.90.21",
"@tanstack/react-virtual": "^3.13.21"
```

### Issue: Import Path Errors

**Error:**
```
Cannot find module '@/components/data-grid'
```

**Solution:**
1. Check your `components.json` aliases:
   ```bash
   cat components.json | grep aliases
   ```
2. Should show:
   ```json
   "aliases": {
     "components": "@/components",
     "utils": "@/lib/utils",
     "ui": "@/components/ui"
   }
   ```
3. Verify file exists:
   ```bash
   ls src/components/data-grid/index.ts
   ```
4. Restart your dev server:
   ```bash
   npm run dev
   ```

### Issue: Column Factory Returning `any`

**Error:**
```typescript
const col = stringColumn({ accessorKey: 'name', header: 'Name' })
// Type is 'any' instead of ColumnDef<T>
```

**Solution:**
1. Verify data-grid-columns is installed:
   ```bash
   ls src/components/data-grid/columns/
   ```
2. Check import path:
   ```typescript
   // Correct
   import { stringColumn } from '@/components/data-grid/columns'

   // Wrong
   import { stringColumn } from '@/components/data-grid'
   ```
3. Verify TypeScript strictness is enabled in tsconfig.json
4. Restart language server in your IDE (VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")

### Issue: Filtering/Editing Not Showing

**Error:**
Filter popovers or edit UI don't appear when expected.

**Solution:**
1. Verify `data-grid-features` and `data-grid-editors` are installed:
   ```bash
   ls src/components/data-grid/features/filtering/
   ls src/components/data-grid/editors/
   ```
2. Enable features in your grid config:
   ```tsx
   <DataGrid
     features={{
       filtering: { enabled: true },
       editing: { enabled: true }
     }}
   />
   ```
3. Verify column metadata supports filtering:
   ```typescript
   const col = stringColumn({
     accessorKey: 'name',
     header: 'Name',
     enableFiltering: true  // Explicitly enable if needed
   })
   ```

### Issue: Build Fails After Installation

**Error:**
```
error TS2688: Cannot find type definition file
```

**Solution:**
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Rebuild TypeScript:
   ```bash
   npx tsc --noEmit
   ```
3. Check for circular dependencies:
   ```bash
   npm audit
   ```

---

## Uninstalling / Updating

### Remove a Component Group

If you need to remove a component group:

```bash
# Remove the files manually
rm -rf src/components/data-grid/editors/

# Update package.json if any exclusive dependencies were added
# (The registry will not automatically remove npm packages)
```

### Update to New Registry Version

When a new version of the registry is released:

```bash
# Update specific component
npx shadcn-cli add --registry data-grid data-grid-core

# Will prompt to overwrite existing files
# Choose "Y" to update

# Update npm dependencies if versions changed
npm install
```

### Update TanStack Versions

If TanStack releases new major versions:

```bash
# Check current versions
npm list @tanstack/react-table

# Install new versions
npm install @tanstack/react-table@latest \
  @tanstack/react-query@latest \
  @tanstack/react-virtual@latest

# Test your grid still works
npm run dev
npm run build
```

---

## Next Steps

After successful installation:

1. **Read the Quick Start Guide**: See [Grid Documentation](../src/components/data-grid/docs/README.md)
2. **Explore the Demo**: Visit the [Demo Page](../src/demo/demo-page.tsx) for working examples
3. **Review Feature Docs**: Check [Feature Guides](../src/components/data-grid/docs/03-features/) for specific features
4. **Understand Data Modes**: Read [Data Modes](../src/components/data-grid/docs/04-data-modes-non-config/) for different loading patterns

### Progressive Learning Path

1. **Week 1**: Get a basic table rendering with `data-grid-core`
2. **Week 2**: Use typed column factories from `data-grid-columns`
3. **Week 3**: Add filtering and sorting with `data-grid-features`
4. **Week 4**: Enable editing with `data-grid-editors`
5. **Week 5+**: Explore advanced features (pinning, grouping, tree expansion, virtualization)
6. **Month 2**: Consider `data-grid-table-engine` for declarative configuration

---

## Support

For issues or questions:

1. Check the [Troubleshooting](#common-installation-issues) section above
2. Review [Grid Documentation](../src/components/data-grid/docs/)
3. Check [GitHub Issues](https://github.com/yourusername/data-grid-shadcn-tanstack/issues)
4. See [Architecture Specs](../docs/superpowers/specs/) for design context

---

**Happy gridding!** Start with Scenario 1 and progressively add capabilities as needed.
