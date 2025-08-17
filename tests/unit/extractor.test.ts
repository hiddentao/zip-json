import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"
import { Archiver } from "../../src/core/archiver.js"
import { Extractor } from "../../src/core/extractor.js"
import type { ZipJsonData } from "../../src/core/types.js"

describe("Extractor", () => {
  const testDir = join(process.cwd(), "test-extractor")
  const sourceDir = join(testDir, "source")
  const extractDir = join(testDir, "extract")

  const archiver = new Archiver()
  const extractor = new Extractor()
  let testArchive: ZipJsonData

  beforeEach(async () => {
    mkdirSync(sourceDir, { recursive: true })
    mkdirSync(extractDir, { recursive: true })

    writeFileSync(join(sourceDir, "file1.txt"), "Source content 1")
    writeFileSync(join(sourceDir, "file2.txt"), "Source content 2")

    mkdirSync(join(sourceDir, "subdir"), { recursive: true })
    writeFileSync(join(sourceDir, "subdir", "file3.txt"), "Source content 3")

    testArchive = await archiver.archive([join(sourceDir, "**/*")], {
      baseDir: testDir,
    })
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("extracts files correctly", async () => {
    const extractedFiles = await extractor.extract(testArchive, {
      outputDir: extractDir,
    })

    expect(extractedFiles.length).toBeGreaterThan(0)
    expect(existsSync(join(extractDir, "source", "file1.txt"))).toBe(true)
    expect(existsSync(join(extractDir, "source", "subdir", "file3.txt"))).toBe(
      true,
    )

    const content = readFileSync(
      join(extractDir, "source", "file1.txt"),
      "utf-8",
    )
    expect(content).toBe("Source content 1")
  })

  test("handles empty archive", async () => {
    const emptyArchive: ZipJsonData = {
      meta: {
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        files: [],
        totalSize: 0,
        fileCount: 0,
      },
      blob: "",
    }

    const extractedFiles = await extractor.extract(emptyArchive, {
      outputDir: extractDir,
    })
    expect(extractedFiles).toHaveLength(0)
  })

  test("throws error when file exists without overwrite", async () => {
    mkdirSync(join(extractDir, "source"), { recursive: true })
    writeFileSync(join(extractDir, "source", "file1.txt"), "existing content")

    await expect(
      extractor.extract(testArchive, {
        outputDir: extractDir,
        overwrite: false,
      }),
    ).rejects.toThrow("File already exists")
  })

  test("overwrites files when overwrite is true", async () => {
    mkdirSync(join(extractDir, "source"), { recursive: true })
    writeFileSync(join(extractDir, "source", "file1.txt"), "existing content")

    const extractedFiles = await extractor.extract(testArchive, {
      outputDir: extractDir,
      overwrite: true,
    })

    expect(extractedFiles.length).toBeGreaterThan(0)
    const content = readFileSync(
      join(extractDir, "source", "file1.txt"),
      "utf-8",
    )
    expect(content).toBe("Source content 1")
  })

  test("calls progress callback", async () => {
    const progressEvents: any[] = []

    await extractor.extract(testArchive, {
      outputDir: extractDir,
      onProgress: (progress) => {
        progressEvents.push(progress)
      },
    })

    expect(progressEvents.length).toBeGreaterThan(0)
    expect(progressEvents[progressEvents.length - 1].percentage).toBe(100)
  })

  test("validates archive structure", async () => {
    const invalidArchive = {
      meta: null,
      blob: "invalid",
    } as any

    await expect(
      extractor.extract(invalidArchive, { outputDir: extractDir }),
    ).rejects.toThrow("Invalid archive")
  })

  test("handles invalid blob data", async () => {
    const invalidArchive: ZipJsonData = {
      meta: {
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        files: [
          {
            path: "test.txt",
            size: 10,
            mode: 33188,
            isDirectory: false,
            modifiedAt: new Date().toISOString(),
          },
        ],
        totalSize: 10,
        fileCount: 1,
      },
      blob: "invalid-base64-data",
    }

    await expect(
      extractor.extract(invalidArchive, { outputDir: extractDir }),
    ).rejects.toThrow("Invalid archive")
  })

  test("handles permission setting failures gracefully", async () => {
    const extractedFiles = await extractor.extract(testArchive, {
      outputDir: extractDir,
      preservePermissions: true,
    })

    // Should still extract files even if permission setting fails
    expect(extractedFiles.length).toBeGreaterThan(0)
  })

  test("handles missing files in blob gracefully", async () => {
    // Create an archive where the blob is missing some files listed in meta
    const archiveWithMissingFiles = await archiver.archive(
      [join(sourceDir, "**/*")],
      { baseDir: testDir },
    )

    // Modify the archive to remove a file from the blob but keep it in meta
    const decompressed = await new (
      await import("../../src/core/compressor.js")
    ).Compressor().decompress(archiveWithMissingFiles.blob)
    const fileContents = JSON.parse(decompressed)

    // Remove one file from the contents
    const firstFileKey = Object.keys(fileContents)[0]
    if (firstFileKey) {
      delete fileContents[firstFileKey]
    }

    // Recompress
    const modifiedBlob = await new (
      await import("../../src/core/compressor.js")
    ).Compressor().compress(JSON.stringify(fileContents))
    const modifiedArchive = {
      ...archiveWithMissingFiles,
      blob: modifiedBlob,
    }

    // Should handle missing files gracefully
    const extractedFiles = await extractor.extract(modifiedArchive, {
      outputDir: extractDir,
    })
    expect(Array.isArray(extractedFiles)).toBe(true)
  })

  test("validates all archive structure edge cases", async () => {
    // Test missing version
    await expect(
      extractor.extract({ meta: { files: [] } } as any, {
        outputDir: extractDir,
      }),
    ).rejects.toThrow("Invalid archive")

    // Test invalid files array
    await expect(
      extractor.extract(
        {
          meta: { version: "1.0.0", files: "not-an-array" },
          blob: "test",
        } as any,
        { outputDir: extractDir },
      ),
    ).rejects.toThrow("Invalid archive")

    // Test non-string blob
    await expect(
      extractor.extract(
        {
          meta: { version: "1.0.0", files: [] },
          blob: 123,
        } as any,
        { outputDir: extractDir },
      ),
    ).rejects.toThrow("Invalid archive")
  })
})
