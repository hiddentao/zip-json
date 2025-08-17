import { describe, expect, test } from "bun:test"
import { Compressor } from "../../src/core/compressor.js"

describe("Compressor", () => {
  const compressor = new Compressor()

  test("compresses and decompresses data correctly", async () => {
    const original = "Hello, world! This is test data for compression."
    const compressed = await compressor.compress(original)
    const decompressed = await compressor.decompress(compressed)

    expect(decompressed).toBe(original)
  })

  test("compresses empty string", async () => {
    const original = ""
    const compressed = await compressor.compress(original)
    const decompressed = await compressor.decompress(compressed)

    expect(decompressed).toBe(original)
  })

  test("compresses large text", async () => {
    const original = "x".repeat(10000)
    const compressed = await compressor.compress(original)
    const decompressed = await compressor.decompress(compressed)

    expect(decompressed).toBe(original)
    expect(compressed.length).toBeLessThan(original.length)
  })

  test("handles unicode characters", async () => {
    const original = "🚀 Hello 世界! Émojis and spëcial chars ñ"
    const compressed = await compressor.compress(original)
    const decompressed = await compressor.decompress(compressed)

    expect(decompressed).toBe(original)
  })

  test("handles compression errors", async () => {
    // Test with invalid base64 data to trigger decompression error
    await expect(
      compressor.decompress("invalid-base64-data!!!"),
    ).rejects.toThrow("Compression error")
  })

  test("handles decompression of malformed data", async () => {
    // Valid base64 but invalid gzip data
    const invalidGzipData = Buffer.from("not gzip data").toString("base64")

    await expect(compressor.decompress(invalidGzipData)).rejects.toThrow(
      "Compression error",
    )
  })
})
