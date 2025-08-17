import { describe, expect, test } from "bun:test"
import { addDefaultIgnores, normalizePattern } from "../../src/utils/glob.js"

describe("Glob utilities", () => {
  describe("normalizePattern", () => {
    test("converts backslashes to forward slashes", () => {
      const pattern = "src\\components\\*.tsx"
      const result = normalizePattern(pattern)

      expect(result).toBe("src/components/*.tsx")
    })

    test("handles already normalized patterns", () => {
      const pattern = "src/components/*.tsx"
      const result = normalizePattern(pattern)

      expect(result).toBe("src/components/*.tsx")
    })

    test("handles mixed slashes", () => {
      const pattern = "src\\utils/helpers\\*.ts"
      const result = normalizePattern(pattern)

      expect(result).toBe("src/utils/helpers/*.ts")
    })

    test("handles empty pattern", () => {
      const pattern = ""
      const result = normalizePattern(pattern)

      expect(result).toBe("")
    })
  })

  describe("addDefaultIgnores", () => {
    test("adds default ignore patterns to empty array", () => {
      const result = addDefaultIgnores([])

      expect(result).toContain("**/node_modules/**")
      expect(result).toContain("**/.git/**")
      expect(result).toContain("**/.DS_Store")
      expect(result).toContain("**/Thumbs.db")
      expect(result).toContain("**/*.tmp")
      expect(result).toContain("**/*.temp")
    })

    test("adds default patterns to existing patterns", () => {
      const existingIgnores = ["*.log", "*.test.ts"]
      const result = addDefaultIgnores(existingIgnores)

      // Should include both default and existing patterns
      expect(result).toContain("**/node_modules/**")
      expect(result).toContain("*.log")
      expect(result).toContain("*.test.ts")
      expect(result.length).toBeGreaterThan(existingIgnores.length)
    })

    test("preserves custom patterns order", () => {
      const existingIgnores = ["custom1", "custom2"]
      const result = addDefaultIgnores(existingIgnores)

      // Custom patterns should appear after default ones
      const custom1Index = result.indexOf("custom1")
      const custom2Index = result.indexOf("custom2")
      const nodeModulesIndex = result.indexOf("**/node_modules/**")

      expect(custom1Index).toBeGreaterThan(nodeModulesIndex)
      expect(custom2Index).toBeGreaterThan(custom1Index)
    })
  })
})
