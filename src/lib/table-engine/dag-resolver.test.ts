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

  it("throws ConfigError on duplicate dependency entries", () => {
    const sources: DataSourceConfig[] = [
      { id: "bom", url: "/api/bom" },
      { id: "a", url: "/api/a", dependsOn: ["bom", "bom"] },
    ]
    expect(() => buildWaves(sources)).toThrow(ConfigError)
    expect(() => buildWaves(sources)).toThrow(/bom/)
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
