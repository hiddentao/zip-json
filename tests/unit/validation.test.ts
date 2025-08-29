import { describe, expect, test } from "bun:test"
import { validatePatterns } from "../../src/utils/validation.js"

describe("Validation utilities", () => {
  describe("validatePatterns", () => {
    test("passes for valid string array", () => {
      expect(() => validatePatterns(["*.js", "*.ts"])).not.toThrow()
    })

    test("passes for empty array", () => {
      expect(() => validatePatterns([])).not.toThrow()
    })

    test("throws for null/undefined", () => {
      expect(() => validatePatterns(null as any)).toThrow(
        "patterns must be an array of strings",
      )
      expect(() => validatePatterns(undefined as any)).toThrow(
        "patterns must be an array of strings",
      )
    })

    test("throws for non-array types", () => {
      expect(() => validatePatterns("*.js" as any)).toThrow(
        "patterns must be an array of strings",
      )
      expect(() => validatePatterns(123 as any)).toThrow(
        "patterns must be an array of strings",
      )
      expect(() => validatePatterns({} as any)).toThrow(
        "patterns must be an array of strings",
      )
    })

    test("throws for array with non-string elements", () => {
      expect(() => validatePatterns(["*.js", 123] as any)).toThrow(
        "patterns[1] must be a string, got number",
      )
      expect(() => validatePatterns([null, "*.js"] as any)).toThrow(
        "patterns[0] must be a string, got object",
      )
      expect(() => validatePatterns(["*.js", {}] as any)).toThrow(
        "patterns[1] must be a string, got object",
      )
    })

    test("throws for array with empty string elements", () => {
      expect(() => validatePatterns(["*.js", ""])).toThrow(
        "patterns[1] must be a non-empty string",
      )
      expect(() => validatePatterns(["", "*.js"])).toThrow(
        "patterns[0] must be a non-empty string",
      )
      expect(() => validatePatterns(["*.js", "   "])).toThrow(
        "patterns[1] must be a non-empty string",
      )
    })

    test("throws for array with whitespace-only string elements", () => {
      expect(() => validatePatterns(["\t\n  ", "*.js"])).toThrow(
        "patterns[0] must be a non-empty string",
      )
      expect(() => validatePatterns(["*.js", "\t"])).toThrow(
        "patterns[1] must be a non-empty string",
      )
    })

    test("passes for array with valid string patterns", () => {
      expect(() =>
        validatePatterns([
          "*.js",
          "src/**/*.ts",
          "!node_modules/**",
          "*.{json,yaml}",
        ]),
      ).not.toThrow()
    })
  })
})
