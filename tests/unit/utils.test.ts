import { describe, expect, test } from "bun:test"
import {
  formatBytes,
  formatDate,
  formatPath,
  formatPercentage,
  formatProgress,
  pluralize,
} from "../../src/utils/format.js"

describe("Format utilities", () => {
  describe("formatBytes", () => {
    test("formats bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 Bytes")
      expect(formatBytes(1024)).toBe("1.0 KB")
      expect(formatBytes(1536)).toBe("1.5 KB")
      expect(formatBytes(1048576)).toBe("1.0 MB")
      expect(formatBytes(1073741824)).toBe("1.0 GB")
    })

    test("handles large numbers", () => {
      expect(formatBytes(1099511627776)).toBe("1.0 TB")
    })
  })

  describe("formatPercentage", () => {
    test("formats percentages correctly", () => {
      expect(formatPercentage(0)).toBe("0%")
      expect(formatPercentage(50.7)).toBe("51%")
      expect(formatPercentage(100)).toBe("100%")
    })
  })

  describe("formatPath", () => {
    test("keeps short paths unchanged", () => {
      const path = "src/index.ts"
      expect(formatPath(path)).toBe(path)
    })

    test("truncates long paths", () => {
      const longPath =
        "very/long/path/with/many/segments/that/should/be/truncated/file.ts"
      const result = formatPath(longPath, 30)
      expect(result.length).toBeLessThanOrEqual(30)
      expect(result).toContain("...")
    })
  })

  describe("formatDate", () => {
    test("formats Date object", () => {
      const date = new Date("2024-01-15T10:30:00Z")
      const result = formatDate(date)

      expect(typeof result).toBe("string")
      expect(result.length).toBeGreaterThan(0)
    })

    test("formats ISO string", () => {
      const dateString = "2024-01-15T10:30:00Z"
      const result = formatDate(dateString)

      expect(typeof result).toBe("string")
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe("formatProgress", () => {
    test("creates progress bar with default prefix", () => {
      const result = formatProgress(50, 100)

      expect(result).toContain("50%")
      expect(result).toContain("50/100")
      expect(result).toContain("[")
      expect(result).toContain("]")
    })

    test("creates progress bar with custom prefix", () => {
      const result = formatProgress(25, 100, "Processing: ")

      expect(result).toContain("Processing:")
      expect(result).toContain("25%")
      expect(result).toContain("25/100")
    })

    test("handles zero total", () => {
      const result = formatProgress(0, 0)

      expect(result).toContain("0%")
      expect(result).toContain("0/0")
    })
  })

  describe("formatPath edge cases", () => {
    test("truncates paths with only two segments using ellipsis prefix", () => {
      const path =
        "very-long-directory-name/very-long-file-name-that-exceeds-limit.txt"
      const result = formatPath(path, 30)
      expect(result.length).toBeLessThanOrEqual(30)
      expect(result.startsWith("...")).toBe(true)
    })

    test("truncates complex multi-segment paths with ellipsis", () => {
      const path = "first/second/third/fourth/fifth/file.txt"
      const result = formatPath(path, 25)
      expect(result.length).toBeLessThanOrEqual(25)
      expect(result).toContain("...")
    })

    test("handles extremely long paths that exceed all truncation attempts", () => {
      const path =
        "very-long-first-directory/extremely-long-final-file-name-that-exceeds-limit.txt"
      const result = formatPath(path, 15)

      // Should contain ellipsis even when result might still be long
      expect(result).toContain("...")
      expect(result.length).toBeGreaterThan(10)
    })

    test("uses simple fallback format for very constrained length limits", () => {
      const path =
        "a/extremely-long-filename-that-will-exceed-maxlength-in-final-result.txt"
      const result = formatPath(path, 20)

      // Should use the fallback pattern: first/...last
      expect(result).toContain("...")
      expect(result).toContain("a")
      expect(result).toContain(".txt")
    })

    test("preserves optimal format when final result fits within limit", () => {
      const path = "longer-directory-name/second-directory/file.txt"
      const result = formatPath(path, 40)

      // Should use the optimal ellipsis format
      expect(result).toBe("longer-directory-name/.../file.txt")
      expect(result.length).toBeLessThanOrEqual(40)
    })

    test("uses ultimate fallback when even optimized format is too long", () => {
      const longFirst =
        "extremely-long-first-directory-name-that-makes-final-result-too-long"
      const longLast = "very-long-filename-with-extension.txt"
      const path = `${longFirst}/middle/${longLast}`
      const maxLength = 25

      const result = formatPath(path, maxLength)

      // Should use the most aggressive fallback format
      expect(result).toBe(`${longFirst}/.../${longLast}`)
      expect(result).toContain("...")
      expect(result).toContain(longFirst)
      expect(result).toContain(longLast)
    })

    test("successfully applies ellipsis format when it fits within constraints", () => {
      const path = "directory/subdirectory/another/deep/file.txt"
      const result = formatPath(path, 35)

      // Should successfully use the ellipsis format
      expect(result).toBe("directory/.../file.txt")
      expect(result.length).toBeLessThanOrEqual(35)
    })
  })

  describe("pluralize", () => {
    test("handles singular and plural forms", () => {
      expect(pluralize(1, "file")).toBe("file")
      expect(pluralize(0, "file")).toBe("files")
      expect(pluralize(2, "file")).toBe("files")
      expect(pluralize(1, "directory", "directories")).toBe("directory")
      expect(pluralize(2, "directory", "directories")).toBe("directories")
    })

    test("handles negative count", () => {
      expect(pluralize(-1, "item")).toBe("items")
    })
  })
})
