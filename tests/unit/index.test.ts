import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { ZipJson, listFromFile, unzipFromFile } from "../../src/index.js"

describe("Index API Tests", () => {
  const testDir = join(process.cwd(), "test-index")
  const zipJson = new ZipJson()

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
    writeFileSync(join(testDir, "test.txt"), "test content")
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("unzipFromFile throws error for invalid JSON", async () => {
    const invalidJsonPath = join(testDir, "invalid.json")
    writeFileSync(invalidJsonPath, "invalid json content")

    await expect(unzipFromFile(invalidJsonPath)).rejects.toThrow()
  })

  test("unzipFromFile throws error for non-existent file", async () => {
    const nonExistentPath = join(testDir, "missing.json")

    await expect(unzipFromFile(nonExistentPath)).rejects.toThrow()
  })

  test("listFromFile throws error for invalid JSON", async () => {
    const invalidJsonPath = join(testDir, "invalid.json")
    writeFileSync(invalidJsonPath, "not valid json")

    await expect(listFromFile(invalidJsonPath)).rejects.toThrow()
  })

  test("listFromFile throws error for non-existent file", async () => {
    const nonExistentPath = join(testDir, "missing.json")

    await expect(listFromFile(nonExistentPath)).rejects.toThrow()
  })

  test("zipToFile and unzipFromFile integration", async () => {
    const archivePath = join(testDir, "integration.json")
    const extractDir = join(testDir, "extract")
    const patterns = [join(testDir, "*.txt")]

    // Create archive file
    await zipJson.zipToFile(patterns, archivePath, { baseDir: testDir })

    expect(existsSync(archivePath)).toBe(true)

    // Extract from file
    const extractedFiles = await zipJson.unzipFromFile(archivePath, {
      outputDir: extractDir,
    })

    expect(extractedFiles.length).toBeGreaterThan(0)
    expect(existsSync(join(extractDir, "test.txt"))).toBe(true)
  })

  test("listFromFile returns correct file entries", async () => {
    const archivePath = join(testDir, "list-test.json")
    const patterns = [join(testDir, "*.txt")]

    // Create archive
    await zipJson.zipToFile(patterns, archivePath, { baseDir: testDir })

    // List from file
    const files = await zipJson.listFromFile(archivePath)

    expect(files.length).toBeGreaterThan(0)
    expect(files[0].path).toBe("test.txt")
    expect(files[0].isDirectory).toBe(false)
  })
})
