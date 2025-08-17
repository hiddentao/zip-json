import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { $ } from "bun"
import { createSimpleCLIProject } from "../fixtures/test-setup.js"

describe("CLI Integration Tests", () => {
  const testDir = join(process.cwd(), "test-cli")
  const outputDir = join(testDir, "output")
  let sourceDir: string

  beforeEach(() => {
    mkdirSync(outputDir, { recursive: true })
    sourceDir = createSimpleCLIProject(testDir)
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("zip command creates archive with glob patterns", async () => {
    const archivePath = join(outputDir, "test.json")

    const result =
      await $`bun run src/cli.ts zip ${archivePath} ${sourceDir}/**/* --base-dir ${testDir} --no-progress`.quiet()

    expect(result.exitCode).toBe(0)
    expect(existsSync(archivePath)).toBe(true)

    const archiveContent = readFileSync(archivePath, "utf-8")
    const archive = JSON.parse(archiveContent)

    expect(archive.meta).toBeTruthy()
    expect(archive.meta.files.length).toBeGreaterThan(10)
    expect(archive.blob).toBeTruthy()

    // Verify various file types are included
    const filePaths = archive.meta.files.map((f: any) => f.path)
    expect(filePaths.some((p: string) => p.includes("README.md"))).toBe(true)
    expect(filePaths.some((p: string) => p.includes("src/index.ts"))).toBe(true)
    expect(
      filePaths.some((p: string) => p.includes("components/App.tsx")),
    ).toBe(true)
  })

  test("zip command with specific file type patterns", async () => {
    const archivePath = join(outputDir, "typescript.json")

    const result =
      await $`bun run src/cli.ts zip ${archivePath} ${sourceDir}/**/*.ts ${sourceDir}/**/*.tsx --base-dir ${testDir} --no-progress`.quiet()

    expect(result.exitCode).toBe(0)
    expect(existsSync(archivePath)).toBe(true)

    const archiveContent = readFileSync(archivePath, "utf-8")
    const archive = JSON.parse(archiveContent)

    // Should only contain TypeScript files
    const fileExtensions = archive.meta.files
      .filter((f: any) => !f.isDirectory)
      .map((f: any) => f.path.split(".").pop())

    for (const ext of fileExtensions) {
      expect(["ts", "tsx"].includes(ext)).toBe(true)
    }
  })

  test("unzip command extracts archive", async () => {
    const archivePath = join(outputDir, "test.json")
    const extractDir = join(outputDir, "extracted")

    // First create an archive
    await $`bun run src/cli.ts zip ${archivePath} ${sourceDir}/**/* --base-dir ${testDir} --no-progress`.quiet()

    // Then extract it
    const result =
      await $`bun run src/cli.ts unzip ${archivePath} --output-dir ${extractDir} --no-progress`.quiet()

    expect(result.exitCode).toBe(0)
    expect(existsSync(join(extractDir, "source", "README.md"))).toBe(true)
    expect(existsSync(join(extractDir, "source", "src", "index.ts"))).toBe(true)

    const content = readFileSync(
      join(extractDir, "source", "README.md"),
      "utf-8",
    )
    expect(content).toBe("# CLI Test Project")
  })

  test("list command shows archive contents", async () => {
    const archivePath = join(outputDir, "test.json")

    // Create an archive first
    await $`bun run src/cli.ts zip ${archivePath} ${sourceDir}/**/* --base-dir ${testDir} --no-progress`.quiet()

    // List contents
    const result = await $`bun run src/cli.ts list ${archivePath}`.quiet()

    expect(result.exitCode).toBe(0)
    const output = result.stdout.toString()
    expect(output).toContain("source/README.md")
    expect(output).toContain("source/src")
  })

  test("zip command with ignore patterns", async () => {
    const archivePath = join(outputDir, "test.json")

    const result =
      await $`bun run src/cli.ts zip ${archivePath} ${sourceDir}/**/* --base-dir ${testDir} --ignore "**/file1.txt" --no-progress`.quiet()

    expect(result.exitCode).toBe(0)

    const archiveContent = readFileSync(archivePath, "utf-8")
    const archive = JSON.parse(archiveContent)

    const hasFile1 = archive.meta.files.some((f: any) =>
      f.path.includes("file1.txt"),
    )
    expect(hasFile1).toBe(false)
  })

  test("handles non-existent input file", async () => {
    try {
      await $`bun run src/cli.ts unzip nonexistent.json`.quiet()
      expect(false).toBe(true) // Should not reach here
    } catch (error: any) {
      expect(error.exitCode).not.toBe(0)
      expect(error.stderr.toString()).toContain("Error")
    }
  })

  test("list command with detailed output", async () => {
    const archivePath = join(outputDir, "test.json")

    // Create an archive first
    await $`bun run src/cli.ts zip ${archivePath} ${sourceDir}/**/* --base-dir ${testDir} --no-progress`.quiet()

    // List with detailed output
    const result =
      await $`bun run src/cli.ts list ${archivePath} --detailed`.quiet()

    expect(result.exitCode).toBe(0)
    const output = result.stdout.toString()
    expect(output).toContain("Path")
    expect(output).toContain("Size")
    expect(output).toContain("Modified")
  })

  test("zip command with --quiet option produces no output", async () => {
    const archivePath = join(outputDir, "quiet-test.json")

    const result =
      await $`bun run src/cli.ts zip ${archivePath} ${sourceDir}/**/* --base-dir ${testDir} --quiet`.quiet()

    expect(result.exitCode).toBe(0)
    expect(existsSync(archivePath)).toBe(true)

    // Should have no output when quiet
    const output = result.stdout.toString().trim()
    expect(output).toBe("")
  })

  test("unzip command with --quiet option produces no output", async () => {
    const archivePath = join(outputDir, "quiet-test.json")
    const extractDir = join(outputDir, "quiet-extracted")

    // First create an archive
    await $`bun run src/cli.ts zip ${archivePath} ${sourceDir}/**/* --base-dir ${testDir} --no-progress`.quiet()

    // Then extract it with quiet option
    const result =
      await $`bun run src/cli.ts unzip ${archivePath} --output-dir ${extractDir} --quiet`.quiet()

    expect(result.exitCode).toBe(0)
    expect(existsSync(join(extractDir, "source", "README.md"))).toBe(true)

    // Should have no output when quiet
    const output = result.stdout.toString().trim()
    expect(output).toBe("")
  })

  test("list command with --quiet option produces no output", async () => {
    const archivePath = join(outputDir, "quiet-test.json")

    // Create an archive first
    await $`bun run src/cli.ts zip ${archivePath} ${sourceDir}/**/* --base-dir ${testDir} --no-progress`.quiet()

    // List with quiet option
    const result =
      await $`bun run src/cli.ts list ${archivePath} --quiet`.quiet()

    expect(result.exitCode).toBe(0)

    // Should have no output when quiet
    const output = result.stdout.toString().trim()
    expect(output).toBe("")
  })

  test("errors are still shown with --quiet option", async () => {
    try {
      await $`bun run src/cli.ts unzip nonexistent.json --quiet`.quiet()
      expect(false).toBe(true) // Should not reach here
    } catch (error: any) {
      expect(error.exitCode).not.toBe(0)
      // Error should still be shown even with --quiet
      expect(error.stderr.toString()).toContain("Error")
    }
  })

  test("quiet option suppresses progress indicators", async () => {
    const archivePath = join(outputDir, "progress-quiet-test.json")

    const result =
      await $`bun run src/cli.ts zip ${archivePath} ${sourceDir}/**/* --base-dir ${testDir} --quiet`.quiet()

    expect(result.exitCode).toBe(0)

    // Even with progress enabled by default, quiet should suppress it
    const output = result.stdout.toString()
    expect(output).not.toContain("Zipping:")
    expect(output).not.toContain("%")
  })
})
