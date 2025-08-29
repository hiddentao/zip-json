import { resolve } from "node:path"
import { glob } from "glob"
import type { FileEntry } from "../core/types.js"
import { getFileStats, makeRelativePath } from "./file.js"
import { validatePatterns } from "./validation.js"

export interface GlobOptions {
  baseDir?: string
  ignore?: string[]
}

export async function collectFiles(
  patterns: string[],
  options: GlobOptions = {},
): Promise<FileEntry[]> {
  validatePatterns(patterns)

  const { baseDir = process.cwd(), ignore = [] } = options

  const resolvedBaseDir = resolve(baseDir)
  const allFiles = new Set<string>()

  // Return empty array if no patterns provided (allows empty archives)
  if (patterns.length === 0) {
    return []
  }

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: resolvedBaseDir,
      ignore,
      absolute: true,
      dot: true,
    })

    for (const file of files) {
      allFiles.add(file)
    }
  }

  const fileEntries: FileEntry[] = []

  for (const filePath of Array.from(allFiles).sort()) {
    try {
      const stats = await getFileStats(filePath)
      const relativePath = makeRelativePath(filePath, resolvedBaseDir)

      fileEntries.push({
        ...stats,
        path: relativePath,
      })
    } catch (_error) {
      continue
    }
  }

  return fileEntries
}

export function normalizePattern(pattern: string): string {
  return pattern.replace(/\\/g, "/")
}

export function addDefaultIgnores(ignorePatterns: string[]): string[] {
  const defaultIgnores = [
    "**/node_modules/**",
    "**/.git/**",
    "**/.DS_Store",
    "**/Thumbs.db",
    "**/*.tmp",
    "**/*.temp",
  ]

  return [...defaultIgnores, ...ignorePatterns]
}
