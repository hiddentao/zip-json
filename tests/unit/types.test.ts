import { describe, expect, test } from "bun:test"
import {
  CompressionError,
  FileNotFoundError,
  InvalidArchiveError,
  OverwriteError,
  PermissionError,
} from "../../src/core/types.js"

describe("Error Types", () => {
  test("FileNotFoundError", () => {
    const error = new FileNotFoundError("/path/to/missing/file.txt")

    expect(error.name).toBe("FileNotFoundError")
    expect(error.message).toBe("File not found: /path/to/missing/file.txt")
    expect(error instanceof Error).toBe(true)
    expect(error instanceof FileNotFoundError).toBe(true)
  })

  test("PermissionError", () => {
    const error = new PermissionError("/protected/file.txt", "read")

    expect(error.name).toBe("PermissionError")
    expect(error.message).toBe(
      "Permission denied: Cannot read /protected/file.txt",
    )
    expect(error instanceof Error).toBe(true)
    expect(error instanceof PermissionError).toBe(true)
  })

  test("InvalidArchiveError", () => {
    const error = new InvalidArchiveError("malformed JSON structure")

    expect(error.name).toBe("InvalidArchiveError")
    expect(error.message).toBe("Invalid archive: malformed JSON structure")
    expect(error instanceof Error).toBe(true)
    expect(error instanceof InvalidArchiveError).toBe(true)
  })

  test("OverwriteError", () => {
    const error = new OverwriteError("/existing/file.txt")

    expect(error.name).toBe("OverwriteError")
    expect(error.message).toBe(
      "File already exists: /existing/file.txt\nUse --overwrite flag to replace existing files.",
    )
    expect(error instanceof Error).toBe(true)
    expect(error instanceof OverwriteError).toBe(true)
  })

  test("CompressionError", () => {
    const error = new CompressionError("gzip failed with unknown error")

    expect(error.name).toBe("CompressionError")
    expect(error.message).toBe(
      "Compression error: gzip failed with unknown error",
    )
    expect(error instanceof Error).toBe(true)
    expect(error instanceof CompressionError).toBe(true)
  })
})
