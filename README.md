# Data Grid

**Guides** → [Documentation](src/components/data-grid/docs/README.md)

## Registry Setup for shadcn Users

This data grid is available as a **shadcn/ui registry**, allowing you to easily integrate all grid components, features, and utilities into your own shadcn projects.

### What is the Registry?

The registry is a declarative manifest of 112 production-ready files organized into 6 modular component groups:

- **Core**: Data grid component, hooks, types, and utilities
- **Columns**: Typed column factories for 7 data types
- **Editors**: 9 cell editors for inline editing
- **Features**: 25+ modular features (filtering, sorting, selection, pinning, grouping, editing, tree, virtualization)
- **Table Engine**: Config-driven table engine with DAG resolution and JSONata transforms
- **Docs**: Complete guides and API reference

### Quick Start

1. **Add the Registry to your `components.json`:**

```json
{
  "registries": [
    {
      "name": "shadcn-ui",
      "url": "https://raw.githubusercontent.com/pgupta1795/template-data-grid/main/registry/registry.json"
    }
  ]
}
```

2. **Install Data Grid Components:**

```bash
npx shadcn-ui@latest add https://raw.githubusercontent.com/pgupta1795/template-data-grid/main/registry/registry.json
```

3. **Use in Your Application:**

```tsx
import { DataGrid } from '@/components/data-grid'
import { stringColumn, numberColumn } from '@/components/data-grid/columns'

export function MyTable() {
  return (
    <DataGrid
      mode="flat"
      columns={[
        stringColumn({ id: 'name', header: 'Name' }),
        numberColumn({ id: 'age', header: 'Age' }),
      ]}
      data={myData}
      features={{
        sorting: true,
        filtering: true,
        selection: true,
      }}
    />
  )
}
```

### Full Documentation

For complete installation instructions, configuration details, and advanced usage patterns, see:

- **[Registry Setup & Installation Guide](registry/README.md)**
- **[Grid Documentation](src/components/data-grid/docs/README.md)**
- **[Architecture & Design Specs](docs/superpowers/specs/)**
