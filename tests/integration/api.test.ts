import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { list, unzip, unzipFromFile, zip, zipToFile } from "../../src/index.js"
import { createTestProject } from "../fixtures/test-setup.js"

describe("API Integration Tests", () => {
  const testDir = join(process.cwd(), "test-temp")
  const extractDir = join(testDir, "extract")
  let sourceDir: string

  beforeEach(() => {
    mkdirSync(extractDir, { recursive: true })
    sourceDir = createTestProject(testDir)
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("zips entire directory structure with glob patterns", async () => {
    const patterns = [join(sourceDir, "**/*")]
    const archive = await zip(patterns, { baseDir: testDir })

    expect(archive.meta.files.length).toBeGreaterThan(10)
    expect(archive.meta.fileCount).toBeGreaterThan(8) // Only files, not directories

    // Check that various file types are included
    const filePaths = archive.meta.files.map((f) => f.path)
    expect(filePaths.some((p) => p.includes("README.md"))).toBe(true)
    expect(filePaths.some((p) => p.includes("package.json"))).toBe(true)
    expect(filePaths.some((p) => p.includes("src/index.ts"))).toBe(true)
    expect(filePaths.some((p) => p.includes("docs"))).toBe(true)
    expect(filePaths.some((p) => p.includes("config/dev.json"))).toBe(true)
  })

  test("uses specific glob patterns for different file types", async () => {
    const patterns = [
      join(sourceDir, "**/*.md"),
      join(sourceDir, "**/*.json"),
      join(sourceDir, "**/*.ts"),
      join(sourceDir, "**/*.tsx"),
    ]

    const archive = await zip(patterns, { baseDir: testDir })

    // Should only include md, json, ts, tsx files
    const fileExtensions = archive.meta.files
      .filter((f) => !f.isDirectory)
      .map((f) => f.path.split(".").pop())

    const validExtensions = ["md", "json", "ts", "tsx"]
    for (const ext of fileExtensions) {
      expect(validExtensions.includes(ext!)).toBe(true)
    }
  })

  test("excludes specific patterns with ignore option", async () => {
    const patterns = [join(sourceDir, "**/*")]
    const archive = await zip(patterns, {
      baseDir: testDir,
      ignore: ["**/tests/**", "**/*.test.*", "**/config/**"],
    })

    const filePaths = archive.meta.files.map((f) => f.path)

    // Should not include test files or config files
    expect(filePaths.some((p) => p.includes("tests/"))).toBe(false)
    expect(filePaths.some((p) => p.includes("test."))).toBe(false)
    expect(filePaths.some((p) => p.includes("config/"))).toBe(false)

    // Should still include other files
    expect(filePaths.some((p) => p.includes("src/"))).toBe(true)
    expect(filePaths.some((p) => p.includes("docs/"))).toBe(true)
  })

  test("extracts and preserves directory structure", async () => {
    const patterns = [join(sourceDir, "**/*")]
    const archive = await zip(patterns, { baseDir: testDir })

    const _extractedFiles = await unzip(archive, { outputDir: extractDir })

    // Check that directories are created
    expect(existsSync(join(extractDir, "source", "src", "components"))).toBe(
      true,
    )
    expect(existsSync(join(extractDir, "source", "docs"))).toBe(true)
    expect(existsSync(join(extractDir, "source", "config"))).toBe(true)

    // Check that files are extracted with correct content
    const readmeContent = readFileSync(
      join(extractDir, "source", "README.md"),
      "utf-8",
    )
    expect(readmeContent).toBe("# Project Title\n\nProject description")

    const packageContent = readFileSync(
      join(extractDir, "source", "package.json"),
      "utf-8",
    )
    expect(packageContent).toBe('{"name": "test-project", "version": "1.0.0"}')

    const componentContent = readFileSync(
      join(extractDir, "source", "src", "components", "Button.tsx"),
      "utf-8",
    )
    expect(componentContent).toBe(
      "export const Button = () => <button>Click</button>",
    )
  })

  test("handles file to file operations", async () => {
    const archivePath = join(testDir, "archive.json")
    const patterns = [join(sourceDir, "**/*.ts"), join(sourceDir, "**/*.tsx")]

    // Create archive file
    await zipToFile(patterns, archivePath, { baseDir: testDir })

    expect(existsSync(archivePath)).toBe(true)

    // Extract from file
    const extractedFiles = await unzipFromFile(archivePath, {
      outputDir: extractDir,
    })

    expect(extractedFiles.length).toBeGreaterThan(0)
    expect(existsSync(join(extractDir, "source", "src", "index.ts"))).toBe(true)
    expect(
      existsSync(join(extractDir, "source", "src", "components", "Button.tsx")),
    ).toBe(true)
  })

  test("handles mixed file and directory patterns", async () => {
    const patterns = [
      join(sourceDir, "README.md"), // Single file
      join(sourceDir, "package.json"), // Another single file
      join(sourceDir, "src/**/*"), // Directory with glob
      join(sourceDir, "docs"), // Specific directory
      join(sourceDir, "config/*.json"), // Files in directory with extension filter
    ]

    const archive = await zip(patterns, { baseDir: testDir })

    const filePaths = archive.meta.files.map((f) => f.path)

    // Should include specific files
    expect(filePaths.some((p) => p.includes("README.md"))).toBe(true)
    expect(filePaths.some((p) => p.includes("package.json"))).toBe(true)

    // Should include src directory contents
    expect(filePaths.some((p) => p.includes("src/index.ts"))).toBe(true)
    expect(filePaths.some((p) => p.includes("src/components/Button.tsx"))).toBe(
      true,
    )

    // Should include docs directory
    expect(filePaths.some((p) => p.includes("docs"))).toBe(true)

    // Should include config JSON files but not the entire config directory
    expect(filePaths.some((p) => p.includes("config/dev.json"))).toBe(true)
    expect(filePaths.some((p) => p.includes("config/prod.json"))).toBe(true)
  })

  test("lists archive contents correctly", async () => {
    const patterns = [join(sourceDir, "**/*")]
    const archive = await zip(patterns, { baseDir: testDir })

    const files = list(archive)

    expect(files.length).toBeGreaterThan(0)
    expect(files.some((f) => f.path.includes("README.md"))).toBe(true)
    expect(files.some((f) => f.isDirectory)).toBe(true)
  })

  test("handles empty patterns gracefully", async () => {
    const archive = await zip([], { baseDir: testDir })

    expect(archive.meta.files).toHaveLength(0)
    expect(archive.meta.fileCount).toBe(0)
    expect(archive.meta.totalSize).toBe(0)
  })
})
