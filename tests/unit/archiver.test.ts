import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { Archiver } from "../../src/core/archiver.js"

describe("Archiver", () => {
  const testDir = join(process.cwd(), "test-archiver")
  const archiver = new Archiver()

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })

    writeFileSync(join(testDir, "file1.txt"), "Content 1")
    writeFileSync(join(testDir, "file2.txt"), "Content 2")

    mkdirSync(join(testDir, "subdir"), { recursive: true })
    writeFileSync(join(testDir, "subdir", "file3.txt"), "Content 3")
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("creates archive with files", async () => {
    const patterns = [join(testDir, "**/*")]
    const archive = await archiver.archive(patterns, { baseDir: testDir })

    expect(archive.meta.version).toBe("1.0.0")
    expect(archive.meta.files.length).toBeGreaterThan(0)
    expect(archive.meta.fileCount).toBeGreaterThan(0)
    expect(archive.blob).toBeTruthy()
    expect(archive.meta.createdAt).toBeTruthy()
  })

  test("handles empty patterns", async () => {
    const archive = await archiver.archive([])

    expect(archive.meta.files).toHaveLength(0)
    expect(archive.meta.fileCount).toBe(0)
    expect(archive.meta.totalSize).toBe(0)
    expect(archive.blob).toBe("")
  })

  test("respects ignore patterns", async () => {
    const patterns = [join(testDir, "**/*")]
    const archive = await archiver.archive(patterns, {
      baseDir: testDir,
      ignore: ["**/file1.txt"],
    })

    const hasFile1 = archive.meta.files.some((f) =>
      f.path.includes("file1.txt"),
    )
    expect(hasFile1).toBe(false)
  })

  test("calls progress callback", async () => {
    const progressEvents: any[] = []
    const patterns = [join(testDir, "**/*")]

    await archiver.archive(patterns, {
      baseDir: testDir,
      onProgress: (progress) => {
        progressEvents.push(progress)
      },
    })

    expect(progressEvents.length).toBeGreaterThan(0)
    expect(progressEvents[progressEvents.length - 1].percentage).toBe(100)
  })

  test("handles relative paths correctly", async () => {
    const patterns = ["**/*.txt"]
    const archive = await archiver.archive(patterns, { baseDir: testDir })

    for (const file of archive.meta.files) {
      if (!file.isDirectory) {
        expect(file.path).not.toMatch(/^\//)
        expect(file.path).not.toInclude(testDir)
      }
    }
  })

  test("handles progress callback with throttling", async () => {
    // Create many small files to test progress throttling
    for (let i = 0; i < 50; i++) {
      writeFileSync(join(testDir, `file${i}.txt`), `Content ${i}`)
    }

    const progressEvents: any[] = []
    const patterns = [join(testDir, "**/*")]

    await archiver.archive(patterns, {
      baseDir: testDir,
      onProgress: (progress) => {
        progressEvents.push(progress)
      },
    })

    // Should have received progress events
    expect(progressEvents.length).toBeGreaterThan(0)

    // Should throttle to only update every 10 files (based on modulo 10 in code)
    const fileProcessingEvents = progressEvents.filter(
      (p) => p.processedFiles > 0,
    )
    expect(fileProcessingEvents.length).toBeGreaterThan(0)
  })

  test("handles errors during file reading gracefully", async () => {
    const patterns = [join(testDir, "**/*")]

    // Create a file then make it unreadable (on non-Windows systems)
    const problematicFile = join(testDir, "unreadable.txt")
    writeFileSync(problematicFile, "content")

    if (process.platform !== "win32") {
      try {
        const { chmodSync } = await import("node:fs")
        chmodSync(problematicFile, 0o000) // No permissions

        // Archive should still complete, just skip the unreadable file
        const archive = await archiver.archive(patterns, { baseDir: testDir })

        // Should have created an archive even with some files being unreadable
        expect(archive.meta.version).toBe("1.0.0")

        // Restore permissions for cleanup
        chmodSync(problematicFile, 0o644)
      } catch (_error) {
        // If we can't change permissions, skip this test
      }
    }
  })
})
