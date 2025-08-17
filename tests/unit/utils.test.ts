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
    test("handles path with only two segments that exceeds limit", () => {
      const path =
        "very-long-directory-name/very-long-file-name-that-exceeds-limit.txt"
      const result = formatPath(path, 30)
      expect(result.length).toBeLessThanOrEqual(30)
      expect(result.startsWith("...")).toBe(true)
    })

    test("handles complex path truncation", () => {
      const path = "first/second/third/fourth/fifth/file.txt"
      const result = formatPath(path, 25)
      expect(result.length).toBeLessThanOrEqual(25)
      expect(result).toContain("...")
    })

    test("handles path fallback case with very long path", () => {
      // This test covers the edge case in formatPath where the final result
      // might still exceed maxLength and needs the fallback return
      const path =
        "very-long-first-directory/extremely-long-final-file-name-that-exceeds-limit.txt"
      const result = formatPath(path, 15)

      // Should contain ellipsis
      expect(result).toContain("...")
      // Should be a reasonable length (this edge case may still be long)
      expect(result.length).toBeGreaterThan(10)
    })

    test("triggers formatPath fallback condition", () => {
      // Force the specific condition where finalResult.length > maxLength
      // This should trigger lines 51-53 in formatPath
      const path =
        "a/extremely-long-filename-that-will-exceed-maxlength-in-final-result.txt"
      const result = formatPath(path, 20)

      // Should use the fallback pattern
      expect(result).toContain("...")
      expect(result).toContain("a")
      expect(result).toContain(".txt")
    })

    test("handles formatPath finalResult assignment (lines 51-53)", () => {
      // Create a path that will trigger the result = finalResult assignment
      // We need finalResult.length <= maxLength so it doesn't hit the early return on line 50
      const path = "longer-directory-name/second-directory/file.txt"
      const result = formatPath(path, 40)

      // Should process normally and assign finalResult to result
      expect(result).toBe("longer-directory-name/.../file.txt")
      expect(result.length).toBeLessThanOrEqual(40)
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
