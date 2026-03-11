# Phase 12 — API Executor

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `api-executor.ts` — the fetch wrapper that handles retries, abort signals, dynamic URL/param evaluation via JSONata, row-level source batching with deduplication, and structured error handling.

**Architecture:** Plain `fetch` — no additional HTTP libraries. Designed as a collection of exported pure/async functions so each concern (URL building, single fetch, row-level batch) is independently testable. The executor is stateless; per-request deduplication is managed by the caller (useTableEngine passes a `Map` keyed on cacheKey).

**Tech Stack:** TypeScript, native `fetch`, `jsonata-evaluator.ts`, Vitest + `vi.stubGlobal` for fetch mocking

**Depends on:** Phase 10 (types), Phase 11 (jsonata-evaluator)

**Spec:** `docs/superpowers/specs/2026-03-12-table-engine-design.md`

---

## Chunk 1: API Executor

### Task 1: `src/lib/table-engine/api-executor.ts`

**Files:**
- Create: `src/lib/table-engine/api-executor.ts`
- Create: `src/lib/table-engine/api-executor.test.ts`

- [ ] **Step 1: Write failing tests first**

Create `src/lib/table-engine/api-executor.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  buildRequestUrl,
  fetchSource,
  fetchRowLevelSource,
} from "./api-executor"
import type { DataSourceConfig, SourceMap } from "./types"

// ─── buildRequestUrl ──────────────────────────────────────────────────────────

describe("buildRequestUrl", () => {
  it("returns a plain URL unchanged when no JSONata", async () => {
    const result = await buildRequestUrl("/api/bom", {})
    expect(result).toBe("/api/bom")
  })

  it("evaluates JSONata URL expression with $sources context", async () => {
    const expr = '"/api/suppliers?ids=" & $join($sources.bom.ids, ",")'
    const sources: SourceMap = { bom: { ids: ["1", "2", "3"] } }
    const result = await buildRequestUrl(expr, sources)
    expect(result).toBe("/api/suppliers?ids=1,2,3")
  })

  it("appends plain params as query string", async () => {
    const result = await buildRequestUrl("/api/items", {}, { limit: "10", page: "0" })
    expect(result).toContain("limit=10")
    expect(result).toContain("page=0")
  })
})

// ─── fetchSource ──────────────────────────────────────────────────────────────

describe("fetchSource", () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal("fetch", mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns parsed JSON data on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [1, 2] }),
    })

    const source: DataSourceConfig = { id: "bom", url: "/api/bom" }
    const result = await fetchSource(source, {})
    expect(result).toEqual({ data: { items: [1, 2] }, error: null })
  })

  it("returns error on non-ok response (no retry for 4xx)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    })

    const source: DataSourceConfig = { id: "bom", url: "/api/bom" }
    const result = await fetchSource(source, {})
    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toContain("404")
    // Only 1 call — no retry on 4xx
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("retries once on network error by default", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] }),
      })

    const source: DataSourceConfig = { id: "bom", url: "/api/bom" }
    const result = await fetchSource(source, {})
    expect(result.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("does NOT retry when retryOnNetworkError is false", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"))

    const source: DataSourceConfig = {
      id: "bom",
      url: "/api/bom",
      retryOnNetworkError: false,
    }
    const result = await fetchSource(source, {})
    expect(result.error).toBeInstanceOf(Error)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("returns error after retry also fails", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))

    const source: DataSourceConfig = { id: "bom", url: "/api/bom" }
    const result = await fetchSource(source, {})
    expect(result.error).toBeInstanceOf(Error)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it("applies transform JSONata expression to raw response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [{ id: 1 }, { id: 2 }] }),
    })

    const source: DataSourceConfig = {
      id: "bom",
      url: "/api/bom",
      transform: "$.items",
    }
    const result = await fetchSource(source, {})
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }])
  })

  it("sends POST with JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const source: DataSourceConfig = {
      id: "bom",
      url: "/api/bom",
      method: "POST",
      body: { filter: "active" },
    }
    await fetchSource(source, {})
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body as string)).toEqual({ filter: "active" })
  })

  it("forwards custom headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    const source: DataSourceConfig = {
      id: "bom",
      url: "/api/bom",
      headers: { Authorization: "Bearer token123" },
    }
    await fetchSource(source, {})
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer token123")
  })
})

// ─── fetchRowLevelSource ──────────────────────────────────────────────────────

describe("fetchRowLevelSource", () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal("fetch", mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("deduplicates calls with the same cacheKey", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ name: "Acme" }),
    })

    const source: DataSourceConfig = {
      id: "supplier",
      url: "/api/suppliers/1",
      rowLevel: true,
      cacheKey: "$string(supplierId)",
    }

    const dedupeMap = new Map<string, Promise<unknown>>()
    const rows = [
      { id: "r1", supplierId: "s1" },
      { id: "r2", supplierId: "s1" }, // same supplierId — should be deduped
      { id: "r3", supplierId: "s2" },
    ]

    const results = await Promise.all(
      rows.map((row) => fetchRowLevelSource(source, row, {}, dedupeMap))
    )

    // s1 was fetched once, s2 once — total 2 calls not 3
    expect(mockFetch).toHaveBeenCalledTimes(2)
    // Both s1 rows got the same result
    expect(results[0]).toEqual(results[1])
  })

  it("returns { data: null, error } when fetch fails, without affecting other rows", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: "Globex" }),
      })

    const source: DataSourceConfig = {
      id: "supplier",
      url: "/api/suppliers/1",
      rowLevel: true,
      cacheKey: "$string(supplierId)",
    }

    const dedupeMap = new Map<string, Promise<unknown>>()
    const rows = [
      { id: "r1", supplierId: "s1" }, // will fail
      { id: "r2", supplierId: "s2" }, // will succeed
    ]

    const results = await Promise.all(
      rows.map((row) => fetchRowLevelSource(source, row, {}, dedupeMap))
    )

    expect(results[0]).toMatchObject({ data: null, error: expect.any(Error) })
    expect(results[1]).toMatchObject({ data: { name: "Globex" }, error: null })
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/lib/table-engine/api-executor.test.ts
```

Expected: module not found errors.

- [ ] **Step 3: Write `src/lib/table-engine/api-executor.ts`**

```ts
import { evaluateRowExpr, evaluateSourceExpr } from "./jsonata-evaluator"
import type { DataSourceConfig, SourceMap } from "./types"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FetchResult {
  data: unknown
  error: Error | null
}

// ─── URL Builder ─────────────────────────────────────────────────────────────

/**
 * Build the final request URL from a source's url field.
 * If the url contains JSONata (detected by presence of $ or operator chars),
 * it is evaluated with $sources context. Plain URLs are returned as-is.
 * Query params (already plain strings) are appended after URL construction.
 */
export async function buildRequestUrl(
  urlExpr: string,
  sources: SourceMap,
  params?: Record<string, string>
): Promise<string> {
  let url: string

  // Heuristic: if url contains JSONata chars, evaluate it; otherwise use as-is.
  // JSONata expressions typically contain $, &, (, ), or spaces.
  const looksLikeExpression = /[$&()"']/.test(urlExpr)

  if (looksLikeExpression) {
    const evaluated = await evaluateSourceExpr(urlExpr, { sources })
    url = String(evaluated ?? urlExpr)
  } else {
    url = urlExpr
  }

  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(params).toString()
    url = url.includes("?") ? `${url}&${qs}` : `${url}?${qs}`
  }

  return url
}

// ─── Single Source Fetch ──────────────────────────────────────────────────────

/**
 * Execute one DataSourceConfig fetch with retry on network error and optional
 * transform applied to the raw response.
 *
 * - Network errors (TypeError from fetch) trigger 1 retry if retryOnNetworkError !== false.
 * - HTTP errors (non-ok status) are NOT retried — returned as { data: null, error }.
 * - Transform JSONata is applied to the raw parsed response if configured.
 * - Never throws — errors are returned as values.
 */
export async function fetchSource(
  source: DataSourceConfig,
  resolvedSources: SourceMap,
  signal?: AbortSignal
): Promise<FetchResult> {
  const url = await buildRequestUrl(
    source.url,
    resolvedSources,
    source.params
  )

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...source.headers,
  }

  const init: RequestInit = {
    method: source.method ?? "GET",
    headers,
    signal,
    ...(source.body ? { body: JSON.stringify(source.body) } : {}),
  }

  const shouldRetry = source.retryOnNetworkError !== false
  const maxAttempts = shouldRetry ? 2 : 1

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, init)

      if (!response.ok) {
        return {
          data: null,
          error: new Error(
            `HTTP ${response.status} ${response.statusText} — ${source.id}: ${url}`
          ),
        }
      }

      const raw = await response.json()

      // Apply JSONata transform if configured
      const data = source.transform
        ? await evaluateSourceExpr(source.transform, {
            sources: { ...resolvedSources, [source.id]: raw },
          })
        : raw

      return { data, error: null }
    } catch (err) {
      const isLastAttempt = attempt === maxAttempts - 1
      const isAbort = err instanceof DOMException && err.name === "AbortError"

      if (isAbort || isLastAttempt) {
        return {
          data: null,
          error: err instanceof Error ? err : new Error(String(err)),
        }
      }
      // Continue to next attempt
    }
  }

  // Unreachable but satisfies TypeScript
  return { data: null, error: new Error(`fetchSource: unexpected exit for ${source.id}`) }
}

// ─── Row-Level Source Fetch ───────────────────────────────────────────────────

/**
 * Execute a row-level DataSourceConfig for one row with cacheKey-based deduplication.
 *
 * All rows with the same cacheKey value share one in-flight Promise stored in dedupeMap.
 * The dedupeMap is owned by the caller (useTableEngine) and cleared on refetch.
 *
 * @returns FetchResult — never throws. On error: { data: null, error }.
 */
export async function fetchRowLevelSource(
  source: DataSourceConfig,
  row: Record<string, unknown>,
  resolvedSources: SourceMap,
  dedupeMap: Map<string, Promise<FetchResult>>,
  signal?: AbortSignal
): Promise<FetchResult> {
  // Compute the cache key for this row
  let cacheKey: string

  if (source.cacheKey) {
    try {
      const keyValue = await evaluateRowExpr(source.cacheKey, { row })
      cacheKey = `${source.id}::${String(keyValue ?? "")}`
    } catch {
      // If cacheKey evaluation fails, use a unique key (no dedup for this row)
      cacheKey = `${source.id}::${Math.random()}`
    }
  } else {
    // No cacheKey — always fetch independently (no dedup)
    return fetchSource(source, resolvedSources, signal)
  }

  // Return existing in-flight promise if one exists for this cacheKey
  if (dedupeMap.has(cacheKey)) {
    return dedupeMap.get(cacheKey)!
  }

  // Start new fetch and register in dedup map
  const promise = fetchSource(source, resolvedSources, signal)
  dedupeMap.set(cacheKey, promise)
  return promise
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/lib/table-engine/api-executor.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Run all engine tests**

```bash
npx vitest run src/lib/table-engine/
```

Expected: all tests across all engine modules pass.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/table-engine/api-executor.ts src/lib/table-engine/api-executor.test.ts
git commit -m "feat(table-engine): add API executor with retry, deduplication, and JSONata URL building"
```

---

## Completion Criteria for Phase 12

- [ ] `buildRequestUrl` evaluates JSONata URL expressions with `$sources` context
- [ ] `buildRequestUrl` appends plain params as query string
- [ ] `fetchSource` returns `{ data, error: null }` on success
- [ ] `fetchSource` applies `transform` JSONata to raw response
- [ ] `fetchSource` returns `{ data: null, error }` on 4xx without retry
- [ ] `fetchSource` retries once on network error (TypeError), not on HTTP errors
- [ ] `fetchSource` respects `retryOnNetworkError: false`
- [ ] `fetchSource` sends POST with JSON body and correct Content-Type
- [ ] `fetchSource` forwards custom headers
- [ ] `fetchRowLevelSource` deduplicates calls with same `cacheKey` via `dedupeMap`
- [ ] `fetchRowLevelSource` returns `{ data: null, error }` on failure without crashing other rows
- [ ] All tests pass: `npx vitest run src/lib/table-engine/`
- [ ] `npx tsc --noEmit` passes
