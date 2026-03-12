# Data Grid Documentation Design

**Date:** 2026-03-12
**Status:** Approved
**Scope:** Create consumer-focused modular docs with progressive examples and config-driven sections

---

## Overview

This design establishes a comprehensive documentation structure for the DataGrid component, organized for progressive learning: quick start → feature showcase → full implementation approaches (raw props vs config-driven) → customization.

**Target Audience:** React developers integrating DataGrid into applications. They range from "give me a quick example" to "show me how to configure this with JSONata."

**Delivery:** Hyperlinked markdown docs in `src/components/data-grid/docs/` with README index + modular feature docs + progressive walkthrough + dual-approach examples (raw props + config).

---

## Doc Structure

```
src/components/data-grid/docs/
├── README.md                          # Index/nav hub
├── 01-quick-start.md                  # 5-min install & minimal example
├── 02-progressive-walkthrough.md      # Layered example evolving across features & modes
├── 03-features/                       # Feature-specific docs
│   ├── sorting.md
│   ├── filtering.md
│   ├── selection.md
│   ├── pinning.md
│   ├── grouping.md
│   ├── editing.md
│   ├── tree-expansion.md
│   └── virtualization.md
├── 04-data-modes-non-config/          # Full raw-props examples per mode
│   ├── flat-mode.md
│   ├── paginated-mode.md
│   ├── infinite-mode.md
│   └── tree-mode.md
├── 05-config-driven-tables/           # Declarative config + JSONata
│   ├── config-basics.md               # What is config, when to use
│   ├── jsonata-transforms.md          # JSONata syntax & patterns
│   ├── flat-table-config.md           # Flat mode via config
│   ├── infinite-table-config.md       # Infinite mode via config
│   ├── tree-table-config.md           # Tree mode via config
│   └── config-api-reference.md        # Config schema & options
├── 06-customization/                  # Extension patterns
│   ├── custom-columns.md
│   ├── custom-editors.md
│   ├── styling-theming.md
│   └── custom-features.md
└── 07-api-reference.md                # Full prop/type reference
```

---

## Content Specifications

### 1. README.md (Index Hub)

**Purpose:** Single entry point. Readers choose their path based on need.

**Contents:**
- Brief project description (1 paragraph)
- Quick-path buttons: Getting started → Feature reference → Learn by example → Config approach → Extend → Full API
- Table of contents linking all docs
- "What mode should I use?" quick decision tree (flat for local data, paginated for server, infinite for streams, tree for hierarchies)

**Key Links:** Every section has hyperlinks to related docs.

---

### 2. Quick Start (01-quick-start.md)

**Purpose:** New developer installs and renders a grid in <5 minutes.

**Contents:**
- Minimal code: `<DataGrid data={rows} columns={cols} mode="flat" />`
- 10 sample rows (or link to mock-data.ts)
- Expected output screenshot
- "Next steps" links: progressive walkthrough, feature reference

**Example Style:**
```tsx
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

---

### 3. Progressive Walkthrough (02-progressive-walkthrough.md)

**Purpose:** Single evolving example showing how features layer atop each other.

**Structure:** One React component that progresses through 6 steps:

1. **Flat grid** — Basic columns, local data
2. **+ Sorting** — Click headers to sort
3. **+ Filtering** — Input fields filter columns
4. **→ Tree mode** — Switch to hierarchical rows with lazy expand
5. **→ Infinite mode** — Switch to cursor-based incremental load
6. **→ Paginated mode** — Switch to page-based server fetch

**Key:** Each step shows:
- Code change (what was added/modified)
- Behavior delta (what the user sees now)
- Config option (if applicable)

**Reader Benefit:** Understands feature dependencies and progression without context-jumping.

---

### 4. Feature Docs (03-features/*.md)

**Template per feature:**

```
# [Feature Name]

## What It Does
2-3 sentence explanation.

## When to Use
Scenarios where this feature is essential.

## Quick Config Example
```json
{
  "features": {
    "[feature]": {
      "enabled": true,
      "option1": "value"
    }
  }
}
```

## Raw Props Example
```tsx
<DataGrid
  features={{
    [feature]: {
      enabled: true,
      option1: "value"
    }
  }}
  {...otherProps}
/>
```

## See Also
- [Progressive Walkthrough](#) (step X)
- [API Reference](#) ([feature] options)
```

**Example Features:** Sorting, Filtering, Selection, Pinning, Grouping, Editing, Tree Expansion, Virtualization.

---

### 5. Data Modes (04-data-modes-non-config/*.md)

**Purpose:** Full, runnable examples for each mode. No config abstraction—just DataGrid props.

**Contents per mode:**

- **Flat Mode** — 10k rows, client-side sorting/filtering/grouping, no server call
- **Paginated Mode** — Server-driven page loading, 100 rows/page, total count
- **Infinite Mode** — Cursor-based incremental fetch, lazy-load on scroll
- **Tree Mode** — Hierarchical rows, lazy expand, async child fetch

**Each example includes:**
- Full working code (copy-paste ready)
- Mock data setup or fetch simulation
- All features enabled (sorting, filtering, editing, selection, grouping, etc.)
- Comments explaining the "why" of each prop

**Reader Benefit:** See the grid in action for their specific use case, understand the full prop surface.

---

### 6. Config-Driven Tables (05-config-driven-tables/*.md)

#### 6a. Config Basics (config-basics.md)

**Purpose:** Explain when/why to use config vs raw props.

**Contents:**
- What is config? (Declarative JSON defining table structure, columns, features, data source)
- Raw props vs config trade-offs table:
  | Aspect | Raw Props | Config |
  |--------|-----------|--------|
  | Control | Maximum | Good |
  | Verbosity | Longer code | Declarative |
  | Server-side | Possible | Easier |
  | Learning curve | Steeper | Gentle |
- When to pick each approach
- JSONata intro (1 paragraph)

---

#### 6b. JSONata Transforms (jsonata-transforms.md)

**Purpose:** Teach JSONata syntax for field mapping and transforms.

**Contents:**
- JSONata basics: paths, functions, conditionals
- Common patterns:
  - Field rename: `{ firstName: $."first name", age: $age }`
  - Conditional: `{ status: age > 18 ? "adult" : "minor" }`
  - String concat: `{ full_name: firstName & " " & lastName }`
  - Nested access: `{ dept: company.department.name }`
- Practical examples from real grids

---

#### 6c. Config Mode Examples (flat-table-config.md, infinite-table-config.md, tree-table-config.md)

**Template per mode:**

```
# [Mode] Table via Config

## Overview
What makes this mode special; why you'd use it.

## Full Config Example
```json
{
  "name": "[mode]-example",
  "description": "...",
  "mode": "[flat|paginated|infinite|tree]",
  "columns": [
    { "id": "name", "type": "string", "label": "Name" },
    ...
  ],
  "features": {
    "sorting": { "enabled": true },
    "filtering": { "enabled": true },
    ...
  },
  "dataSource": {
    "type": "[local|paginated|infinite|tree]",
    "data": [...] or "fetchFn": "..."
  }
}
```

## What Each Part Does
- Columns section explanation
- Features section explanation
- DataSource section explanation
- JSONata transforms (if applicable)

## Rendered Output
Code snippet showing how this config becomes a React component.

## See Also
- [Raw Props Version](#)
- [Feature Details](#)
```

---

#### 6d. Config API Reference (config-api-reference.md)

**Purpose:** Schema reference for config objects.

**Contents:**
- Column config shape (id, type, label, width, editable, filterable, sortable, etc.)
- Features config shape (sorting, filtering, selection, pinning, grouping, editing, tree, virtualization, etc.)
- DataSource config shape (mode, data, fetchFn, getSubRows, etc.)
- Type definitions for each config section

---

### 7. Customization (06-customization/*.md)

**Template per section:**

#### Custom Columns (custom-columns.md)
- How to create a custom column type
- Extend base column factory
- Inline editing + custom editor
- Example: password column (masked text)

#### Custom Editors (custom-editors.md)
- Inline edit flow
- Editor component contract
- Example: date picker editor, autocomplete editor

#### Styling & Theming (styling-theming.md)
- CSS variables used by DataGrid
- Dark mode setup
- Density presets
- Custom styles without breaking layout

#### Custom Features (custom-features.md)
- Writing a custom feature hook
- Slot contracts (if any)
- Example: custom aggregation feature

---

### 8. API Reference (07-api-reference.md)

**Contents:**
- DataGrid component props (all)
- Column factory types
- Feature configuration types
- Hook signatures (useDataGrid, useEditing, etc.)
- Editor component contract
- Context shape

**Format:** TypeScript signatures + short descriptions.

---

## Navigation Strategy

**Hyperlink Principles:**
1. Every feature doc → links to progressive walkthrough + config example + API reference
2. Every mode doc → links to feature docs + config alternative
3. Every config doc → links to raw props alternative
4. README → links to all sections

**Reader Entry Points:**
- "Quick example" → README → Quick Start → Progressive Walkthrough
- "I need sorting" → README → Features → Sorting
- "Show me tree mode" → README → Data Modes → Tree
- "Use JSONata" → README → Config-Driven → JSONata + Flat/Infinite/Tree config examples

---

## Code Example Philosophy

**All examples must be:**
- Real, copy-paste ready
- TypeScript with inline comments explaining the "why"
- Linked to mock data or inline data
- Runnable in the demo without external API calls

**Config Examples:**
- Full JSON shown first
- Then explanation of each section
- Then code showing how to pass config to DataGrid

**Raw Props Examples:**
- JSX/TSX code
- Comments on non-obvious props
- Data sourcing inline or linked

---

## Updates to CLAUDE.md

The main CLAUDE.md file will be updated to reflect the restructured codebase:

1. **Folder Structure section:** Update to show that `src/components/data-grid/` now contains columns, editors, features, hooks, types, utils, and table-engine subdirectories (instead of being scattered across `src/`).
2. **Directory Responsibilities:** Clarify that core data-grid logic is consolidated under `src/components/data-grid/`.
3. **Top-Level Runtime Flow:** Update to reflect consolidated structure.
4. **Important Files To Read First:** Update paths to point into `src/components/data-grid/`.

---

## Success Criteria

- [ ] Docs are complete and hyperlinked
- [ ] New developer can quick-start in <5 minutes
- [ ] Progressive walkthrough teaches feature layers
- [ ] Both raw props and config approaches are shown
- [ ] JSONata patterns are documented with examples
- [ ] All four data modes have full working examples
- [ ] Feature reference is self-contained
- [ ] API reference is comprehensive
- [ ] CLAUDE.md accurately reflects new structure

---

## Notes

- Docs live in `src/components/data-grid/docs/` to co-locate with the component source
- All examples link to or reference `src/demo/demo-page.tsx` and `src/utils/mock-data.ts` where applicable
- Config examples reference the table-engine design (2026-03-12-table-engine-design.md)
- Future updates to DataGrid API should keep docs in sync
