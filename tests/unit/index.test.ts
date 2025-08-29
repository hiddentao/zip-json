import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import {
  ZipJson,
  listFromFile,
  unzipFromFile,
  zip,
  zipToFile,
} from "../../src/index.js"

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

describe("Pattern Validation Tests", () => {
  const testDir = join(process.cwd(), "test-validation")
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

  describe("ZipJson class methods", () => {
    test("zip() validates patterns parameter", async () => {
      // Valid cases
      await expect(zipJson.zip([])).resolves.toBeDefined()
      await expect(zipJson.zip(["*.txt"])).resolves.toBeDefined()

      // Invalid cases
      await expect(zipJson.zip(null as any)).rejects.toThrow(
        "patterns must be an array of strings",
      )
      await expect(zipJson.zip(undefined as any)).rejects.toThrow(
        "patterns must be an array of strings",
      )
      await expect(zipJson.zip("*.txt" as any)).rejects.toThrow(
        "patterns must be an array of strings",
      )
      await expect(zipJson.zip([123] as any)).rejects.toThrow(
        "patterns[0] must be a string, got number",
      )
      await expect(zipJson.zip([""])).rejects.toThrow(
        "patterns[0] must be a non-empty string",
      )
      await expect(zipJson.zip(["   "])).rejects.toThrow(
        "patterns[0] must be a non-empty string",
      )
    })

    test("zipToFile() validates patterns parameter", async () => {
      const outputPath = join(testDir, "test.json")

      // Valid cases
      await expect(zipJson.zipToFile([], outputPath)).resolves.toBeUndefined()
      await expect(
        zipJson.zipToFile(["*.txt"], outputPath),
      ).resolves.toBeUndefined()

      // Invalid cases
      await expect(zipJson.zipToFile(null as any, outputPath)).rejects.toThrow(
        "patterns must be an array of strings",
      )
      await expect(
        zipJson.zipToFile(undefined as any, outputPath),
      ).rejects.toThrow("patterns must be an array of strings")
      await expect(
        zipJson.zipToFile("*.txt" as any, outputPath),
      ).rejects.toThrow("patterns must be an array of strings")
      await expect(
        zipJson.zipToFile([null] as any, outputPath),
      ).rejects.toThrow("patterns[0] must be a string, got object")
      await expect(zipJson.zipToFile([""], outputPath)).rejects.toThrow(
        "patterns[0] must be a non-empty string",
      )
    })
  })

  describe("Standalone functions", () => {
    test("zip() function validates patterns parameter", async () => {
      // Valid cases
      await expect(zip([])).resolves.toBeDefined()
      await expect(zip(["*.txt"])).resolves.toBeDefined()

      // Invalid cases
      await expect(zip(null as any)).rejects.toThrow(
        "patterns must be an array of strings",
      )
      await expect(zip(undefined as any)).rejects.toThrow(
        "patterns must be an array of strings",
      )
      await expect(zip({} as any)).rejects.toThrow(
        "patterns must be an array of strings",
      )
      await expect(zip([{}] as any)).rejects.toThrow(
        "patterns[0] must be a string, got object",
      )
      await expect(zip(["\t\n"])).rejects.toThrow(
        "patterns[0] must be a non-empty string",
      )
    })

    test("zipToFile() function validates patterns parameter", async () => {
      const outputPath = join(testDir, "standalone.json")

      // Valid cases
      await expect(zipToFile([], outputPath)).resolves.toBeUndefined()
      await expect(zipToFile(["*.txt"], outputPath)).resolves.toBeUndefined()

      // Invalid cases
      await expect(zipToFile(123 as any, outputPath)).rejects.toThrow(
        "patterns must be an array of strings",
      )
      await expect(
        zipToFile(["valid", 456] as any, outputPath),
      ).rejects.toThrow("patterns[1] must be a string, got number")
      await expect(zipToFile(["valid", ""], outputPath)).rejects.toThrow(
        "patterns[1] must be a non-empty string",
      )
    })
  })

  describe("Mixed valid and invalid patterns", () => {
    test("identifies first invalid pattern in mixed array", async () => {
      await expect(zip(["*.js", "", "*.ts"])).rejects.toThrow(
        "patterns[1] must be a non-empty string",
      )
      await expect(zip(["*.js", 123, "*.ts"] as any)).rejects.toThrow(
        "patterns[1] must be a string, got number",
      )
      await expect(zip(["*.js", "*.ts", null] as any)).rejects.toThrow(
        "patterns[2] must be a string, got object",
      )
    })

    test("passes for all valid patterns", async () => {
      await expect(
        zip(["*.js", "src/**/*.ts", "!node_modules/**", "*.{json,yml}"]),
      ).resolves.toBeDefined()
    })
  })
})
