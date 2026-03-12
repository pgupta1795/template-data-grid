import { describe, it, expect } from "vitest"
import { ConfigError } from "./types"

describe("ConfigError", () => {
  it("is an instance of Error", () => {
    const err = new ConfigError("test message")
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe("ConfigError")
    expect(err.message).toBe("test message")
  })

  it("can be caught as Error", () => {
    const fn = () => { throw new ConfigError("bad config") }
    expect(fn).toThrow(Error)
    expect(fn).toThrow("bad config")
  })
})
