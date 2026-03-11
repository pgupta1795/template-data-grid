# Phase 11 — DAG Resolver + JSONata Evaluator

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the two pure-logic engine modules: the DAG resolver that orders and executes API source dependencies, and the JSONata evaluator wrapper that evaluates expressions with typed context objects.

**Architecture:** Both modules are framework-free TypeScript — no React, no fetch. The DAG resolver uses Kahn's algorithm to produce an ordered list of waves; the executor runs waves with `Promise.all`. The JSONata evaluator wraps the `jsonata` npm package with three typed evaluation modes. Both are fully unit-tested.

**Tech Stack:** TypeScript, `jsonata` npm package, Vitest

**Depends on:** Phase 10 complete (types defined, Vitest configured)

**Spec:** `docs/superpowers/specs/2026-03-12-table-engine-design.md`

---

## Chunk 1: JSONata Evaluator

### Task 1: `src/lib/table-engine/jsonata-evaluator.ts`

**Files:**
- Create: `src/lib/table-engine/jsonata-evaluator.ts`
- Create: `src/lib/table-engine/jsonata-evaluator.test.ts`

The evaluator is a thin, typed wrapper around the `jsonata` package. It provides three named evaluation modes so call sites always pass structured context, never raw objects.

- [ ] **Step 1: Write failing tests first**

Create `src/lib/table-engine/jsonata-evaluator.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import {
  evaluateSourceExpr,
  evaluateRowExpr,
  evaluateDepthRule,
} from "./jsonata-evaluator"
import type { DepthRule } from "./types"

describe("evaluateSourceExpr", () => {
  it("evaluates a plain string JSONata expression", async () => {
    const result = await evaluateSourceExpr("$.items", {
      sources: { bom: { items: [1, 2, 3] } },
    })
    expect(result).toEqual([1, 2, 3])
  })

  it("returns undefined for empty expression", async () => {
    const result = await evaluateSourceExpr("", { sources: {} })
    expect(result).toBeUndefined()
  })

  it("makes $sources available in the expression", async () => {
    const result = await evaluateSourceExpr(
      "$sources.inventory.count",
      { sources: { inventory: { count: 42 } } }
    )
    expect(result).toBe(42)
  })

  it("throws with expression context on error", async () => {
    await expect(
      evaluateSourceExpr("$unknownFunction()", { sources: {} })
    ).rejects.toThrow()
  })
})

describe("evaluateRowExpr", () => {
  it("evaluates a derived value expression using $row", async () => {
    const result = await evaluateRowExpr("$row.quantity * $row.unitPrice", {
      row: { quantity: 5, unitPrice: 10 },
    })
    expect(result).toBe(50)
  })

  it("returns null for undefined row fields", async () => {
    const result = await evaluateRowExpr("$row.missing", { row: {} })
    expect(result).toBeUndefined()
  })
})

describe("evaluateDepthRule", () => {
  it("depths: editable only at listed depths", () => {
    const rule: DepthRule = { depths: [1, 2] }
    expect(evaluateDepthRule(rule, 0)).toBe(false)
    expect(evaluateDepthRule(rule, 1)).toBe(true)
    expect(evaluateDepthRule(rule, 2)).toBe(true)
    expect(evaluateDepthRule(rule, 3)).toBe(false)
  })

  it("minDepth: editable at depth >= minDepth", () => {
    const rule: DepthRule = { minDepth: 2 }
    expect(evaluateDepthRule(rule, 1)).toBe(false)
    expect(evaluateDepthRule(rule, 2)).toBe(true)
    expect(evaluateDepthRule(rule, 5)).toBe(true)
  })

  it("maxDepth: editable at depth <= maxDepth", () => {
    const rule: DepthRule = { maxDepth: 1 }
    expect(evaluateDepthRule(rule, 0)).toBe(true)
    expect(evaluateDepthRule(rule, 1)).toBe(true)
    expect(evaluateDepthRule(rule, 2)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/lib/table-engine/jsonata-evaluator.test.ts
```

Expected: import errors / module not found.

- [ ] **Step 3: Write `src/lib/table-engine/jsonata-evaluator.ts`**

```ts
import jsonata from "jsonata"
import type { DepthRule, SourceMap } from "./types"

// ─── Context types ────────────────────────────────────────────────────────────

export interface SourceEvalContext {
  /** All resolved source data, accessible as $sources.<id> in expressions. */
  sources: SourceMap
}

export interface RowEvalContext {
  /** The current row object, accessible as $row in expressions. */
  row: Record<string, unknown>
}

// ─── Source mode ─────────────────────────────────────────────────────────────

/**
 * Evaluate a JSONata expression in "source" mode.
 * Available bindings: $sources (the resolved source map).
 * Used for: transform, url, params, body expressions.
 *
 * @returns The evaluated result, or undefined if expression is empty.
 * @throws With expression string + context appended on evaluation error.
 */
export async function evaluateSourceExpr(
  expression: string,
  context: SourceEvalContext
): Promise<unknown> {
  if (!expression.trim()) return undefined

  try {
    const expr = jsonata(expression)
    // Bind $sources so expressions can reference $sources.<id>
    const result = await expr.evaluate(
      { $sources: context.sources },
      { $sources: context.sources }
    )
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `JSONata source expression failed: ${msg}\nExpression: ${expression}`
    )
  }
}

// ─── Row mode ─────────────────────────────────────────────────────────────────

/**
 * Evaluate a JSONata expression in "row" mode.
 * Available bindings: $row (the current row object).
 * Used for: valueExpr derived column computation.
 *
 * @returns The evaluated result.
 */
export async function evaluateRowExpr(
  expression: string,
  context: RowEvalContext
): Promise<unknown> {
  if (!expression.trim()) return undefined

  try {
    const expr = jsonata(expression)
    const result = await expr.evaluate(
      { $row: context.row },
      { $row: context.row }
    )
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `JSONata row expression failed: ${msg}\nExpression: ${expression}\nRow: ${JSON.stringify(context.row)}`
    )
  }
}

// ─── Depth rule (synchronous — no JSONata needed) ─────────────────────────────

/**
 * Evaluate a DepthRule synchronously against a tree node's depth.
 * This is pure boolean logic — no JSONata involved.
 * Used by column-builder to produce the editableFn stored on TableColumnMeta.
 */
export function evaluateDepthRule(rule: DepthRule, depth: number): boolean {
  if ("depths" in rule) return rule.depths.includes(depth)
  if ("minDepth" in rule) return depth >= rule.minDepth
  if ("maxDepth" in rule) return depth <= rule.maxDepth
  return false
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/lib/table-engine/jsonata-evaluator.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/table-engine/jsonata-evaluator.ts src/lib/table-engine/jsonata-evaluator.test.ts
git commit -m "feat(table-engine): add JSONata evaluator with source/row/depth modes"
```

---

## Chunk 2: DAG Resolver

### Task 2: `src/lib/table-engine/dag-resolver.ts`

**Files:**
- Create: `src/lib/table-engine/dag-resolver.ts`
- Create: `src/lib/table-engine/dag-resolver.test.ts`

Two separate responsibilities kept in one file because they always change together:
1. `buildWaves(sources)` — pure graph algorithm (no I/O, fully testable)
2. `executeWaves(waves, executeFn, signal)` — async wave executor

- [ ] **Step 1: Write failing tests first**

Create `src/lib/table-engine/dag-resolver.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest"
import { buildWaves, executeWaves } from "./dag-resolver"
import { ConfigError } from "./types"
import type { DataSourceConfig } from "./types"

// ─── buildWaves ───────────────────────────────────────────────────────────────

describe("buildWaves", () => {
  it("single source with no deps goes in wave 0", () => {
    const sources: DataSourceConfig[] = [
      { id: "bom", url: "/api/bom" },
    ]
    const waves = buildWaves(sources)
    expect(waves).toEqual([["bom"]])
  })

  it("independent sources are grouped in the same wave", () => {
    const sources: DataSourceConfig[] = [
      { id: "bom", url: "/api/bom" },
      { id: "inventory", url: "/api/inventory" },
    ]
    const waves = buildWaves(sources)
    expect(waves).toHaveLength(1)
    expect(waves[0]).toContain("bom")
    expect(waves[0]).toContain("inventory")
  })

  it("dependent source goes in a later wave", () => {
    const sources: DataSourceConfig[] = [
      { id: "bom", url: "/api/bom" },
      { id: "suppliers", url: "/api/suppliers", dependsOn: ["bom"] },
    ]
    const waves = buildWaves(sources)
    expect(waves[0]).toEqual(["bom"])
    expect(waves[1]).toEqual(["suppliers"])
  })

  it("diamond dependency resolves correctly", () => {
    // bom → [suppliers, pricing] → enriched
    const sources: DataSourceConfig[] = [
      { id: "bom", url: "/api/bom" },
      { id: "suppliers", url: "/api/suppliers", dependsOn: ["bom"] },
      { id: "pricing", url: "/api/pricing", dependsOn: ["bom"] },
      { id: "enriched", url: "/api/enriched", dependsOn: ["suppliers", "pricing"] },
    ]
    const waves = buildWaves(sources)
    expect(waves[0]).toEqual(["bom"])
    expect(waves[1]).toContain("suppliers")
    expect(waves[1]).toContain("pricing")
    expect(waves[2]).toEqual(["enriched"])
  })

  it("throws ConfigError on direct circular dependency", () => {
    const sources: DataSourceConfig[] = [
      { id: "a", url: "/api/a", dependsOn: ["b"] },
      { id: "b", url: "/api/b", dependsOn: ["a"] },
    ]
    expect(() => buildWaves(sources)).toThrow(ConfigError)
    expect(() => buildWaves(sources)).toThrow(/circular/i)
  })

  it("throws ConfigError on self-dependency", () => {
    const sources: DataSourceConfig[] = [
      { id: "a", url: "/api/a", dependsOn: ["a"] },
    ]
    expect(() => buildWaves(sources)).toThrow(ConfigError)
  })

  it("throws ConfigError referencing unknown dependency id", () => {
    const sources: DataSourceConfig[] = [
      { id: "a", url: "/api/a", dependsOn: ["nonexistent"] },
    ]
    expect(() => buildWaves(sources)).toThrow(ConfigError)
    expect(() => buildWaves(sources)).toThrow(/nonexistent/)
  })

  it("throws ConfigError with cycle path in message", () => {
    const sources: DataSourceConfig[] = [
      { id: "x", url: "/x", dependsOn: ["y"] },
      { id: "y", url: "/y", dependsOn: ["z"] },
      { id: "z", url: "/z", dependsOn: ["x"] },
    ]
    try {
      buildWaves(sources)
      expect.fail("should have thrown")
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError)
      const msg = (err as ConfigError).message
      // Message should mention all nodes in cycle
      expect(msg).toMatch(/x|y|z/)
    }
  })
})

// ─── executeWaves ─────────────────────────────────────────────────────────────

describe("executeWaves", () => {
  it("executes each source and accumulates results", async () => {
    const waves = [["bom"], ["suppliers"]]
    const executeFn = vi.fn(async (id: string, _sources: Record<string, unknown>) => {
      return id === "bom" ? [{ id: 1 }] : [{ name: "Acme" }]
    })

    const result = await executeWaves(waves, executeFn)
    expect(result).toEqual({
      bom: [{ id: 1 }],
      suppliers: [{ name: "Acme" }],
    })
  })

  it("passes accumulated sources to each wave's executeFn", async () => {
    const waves = [["bom"], ["suppliers"]]
    const capturedSources: Record<string, Record<string, unknown>> = {}

    const executeFn = vi.fn(async (id: string, sources: Record<string, unknown>) => {
      capturedSources[id] = { ...sources }
      return `data-${id}`
    })

    await executeWaves(waves, executeFn)
    // Wave 0: bom sees empty sources
    expect(capturedSources["bom"]).toEqual({})
    // Wave 1: suppliers sees bom result
    expect(capturedSources["suppliers"]).toEqual({ bom: "data-bom" })
  })

  it("runs sources in the same wave in parallel", async () => {
    const order: string[] = []
    const waves = [["a", "b"]]

    const executeFn = vi.fn(async (id: string) => {
      order.push(`start-${id}`)
      await new Promise((r) => setTimeout(r, id === "a" ? 10 : 5))
      order.push(`end-${id}`)
      return id
    })

    await executeWaves(waves, executeFn)
    // Both should start before either ends (parallel)
    expect(order[0]).toBe("start-a")
    expect(order[1]).toBe("start-b")
  })

  it("throws if any source in a wave throws", async () => {
    const waves = [["ok", "fail"]]
    const executeFn = vi.fn(async (id: string) => {
      if (id === "fail") throw new Error("fetch failed")
      return "ok-data"
    })

    await expect(executeWaves(waves, executeFn)).rejects.toThrow("fetch failed")
  })

  it("returns empty object for empty waves array", async () => {
    const result = await executeWaves([], vi.fn())
    expect(result).toEqual({})
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/lib/table-engine/dag-resolver.test.ts
```

Expected: import error / not found.

- [ ] **Step 3: Write `src/lib/table-engine/dag-resolver.ts`**

```ts
import { ConfigError } from "./types"
import type { DataSourceConfig, SourceMap } from "./types"

// ─── Types ────────────────────────────────────────────────────────────────────

/** A wave is a list of source IDs that can all execute in parallel. */
export type Wave = string[]

/**
 * Function that executes a single source given its ID and all prior resolved sources.
 * The DAG executor calls this for every node; the caller provides the actual fetch logic.
 */
export type SourceExecutorFn = (
  sourceId: string,
  resolvedSources: SourceMap,
  signal?: AbortSignal
) => Promise<unknown>

// ─── Graph Building ───────────────────────────────────────────────────────────

/**
 * Validate dependency references and build adjacency structures.
 * Throws ConfigError if any dependsOn references an unknown source id.
 */
function buildGraph(sources: DataSourceConfig[]): {
  inDegree: Map<string, number>
  dependents: Map<string, string[]>
} {
  const ids = new Set(sources.map((s) => s.id))

  // Validate all deps reference known ids
  for (const source of sources) {
    for (const dep of source.dependsOn ?? []) {
      if (!ids.has(dep)) {
        throw new ConfigError(
          `DataSource "${source.id}" depends on unknown source "${dep}". ` +
            `Available ids: ${[...ids].join(", ")}`
        )
      }
      if (dep === source.id) {
        throw new ConfigError(
          `DataSource "${source.id}" has a self-dependency.`
        )
      }
    }
  }

  // Build in-degree map and reverse adjacency (who depends on me?)
  const inDegree = new Map<string, number>()
  const dependents = new Map<string, string[]>()

  for (const source of sources) {
    inDegree.set(source.id, source.dependsOn?.length ?? 0)
    dependents.set(source.id, [])
  }

  for (const source of sources) {
    for (const dep of source.dependsOn ?? []) {
      dependents.get(dep)!.push(source.id)
    }
  }

  return { inDegree, dependents }
}

// ─── Kahn's Algorithm ─────────────────────────────────────────────────────────

/**
 * Topologically sort DataSourceConfig[] into ordered waves using Kahn's algorithm.
 *
 * - Sources with no dependencies go into Wave 0.
 * - When a wave completes, nodes whose in-degree drops to 0 form the next wave.
 * - If nodes remain after the algorithm (cycle detected), throws ConfigError.
 *
 * @throws ConfigError on circular dependencies or unknown dependency ids.
 * @returns Ordered array of waves; each wave is a list of source IDs to run in parallel.
 */
export function buildWaves(sources: DataSourceConfig[]): Wave[] {
  if (sources.length === 0) return []

  const { inDegree, dependents } = buildGraph(sources)
  const waves: Wave[] = []
  let remaining = new Set(inDegree.keys())

  while (remaining.size > 0) {
    // Find all nodes with in-degree 0 (ready to execute)
    const wave: string[] = []
    for (const id of remaining) {
      if (inDegree.get(id) === 0) wave.push(id)
    }

    if (wave.length === 0) {
      // Nodes remain but none have in-degree 0 — circular dependency
      const cycleNodes = [...remaining]
      throw new ConfigError(
        `Circular dependency detected among DataSources: ${cycleNodes.join(" → ")}. ` +
          `Check the dependsOn fields for a cycle.`
      )
    }

    waves.push(wave)

    // Remove this wave's nodes and decrement in-degrees of their dependents
    for (const id of wave) {
      remaining.delete(id)
      for (const dependent of dependents.get(id) ?? []) {
        inDegree.set(dependent, (inDegree.get(dependent) ?? 0) - 1)
      }
    }
  }

  return waves
}

// ─── Wave Executor ────────────────────────────────────────────────────────────

/**
 * Execute a list of waves in order. Within each wave, all sources run in parallel
 * via Promise.all. Between waves, execution is sequential (next wave waits for previous).
 *
 * Each call to executeFn receives:
 * - The source ID
 * - All sources resolved so far (accumulated across prior waves)
 * - An optional AbortSignal
 *
 * @returns A SourceMap: { [sourceId]: resolvedData }
 */
export async function executeWaves(
  waves: Wave[],
  executeFn: SourceExecutorFn,
  signal?: AbortSignal
): Promise<SourceMap> {
  const resolved: SourceMap = {}

  for (const wave of waves) {
    // All sources in this wave run in parallel with a snapshot of resolved so far
    const waveResults = await Promise.all(
      wave.map(async (id) => {
        const data = await executeFn(id, { ...resolved }, signal)
        return { id, data }
      })
    )

    // Merge wave results into resolved map for the next wave
    for (const { id, data } of waveResults) {
      resolved[id] = data
    }
  }

  return resolved
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/lib/table-engine/dag-resolver.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Run all engine tests together**

```bash
npx vitest run src/lib/table-engine/
```

Expected: all tests in the engine module pass.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/table-engine/dag-resolver.ts src/lib/table-engine/dag-resolver.test.ts
git commit -m "feat(table-engine): add DAG resolver with Kahn's algorithm and wave executor"
```

---

## Completion Criteria for Phase 11

- [ ] `evaluateSourceExpr` evaluates JSONata with `$sources` context
- [ ] `evaluateRowExpr` evaluates JSONata with `$row` context
- [ ] `evaluateDepthRule` correctly evaluates all three DepthRule shapes (synchronous)
- [ ] `buildWaves` produces correct wave order for linear, parallel, and diamond dependency graphs
- [ ] `buildWaves` throws `ConfigError` with descriptive message for: cycle, self-dependency, unknown dep id
- [ ] `executeWaves` runs same-wave sources in parallel, sequentially between waves
- [ ] `executeWaves` passes accumulated `SourceMap` to each executeFn
- [ ] All tests pass: `npx vitest run src/lib/table-engine/`
- [ ] `npx tsc --noEmit` passes
