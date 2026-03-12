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
