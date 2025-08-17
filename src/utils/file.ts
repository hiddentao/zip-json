import { existsSync } from "node:fs"
import { chmod, mkdir, readFile, stat, writeFile } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import type { FileEntry } from "../core/types.js"
import { FileNotFoundError, PermissionError } from "../core/types.js"

export async function readFileContent(filePath: string): Promise<Buffer> {
  try {
    return await readFile(filePath)
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new FileNotFoundError(filePath)
    }
    if (error instanceof Error && "code" in error && error.code === "EACCES") {
      throw new PermissionError(filePath, "read")
    }
    throw error
  }
}

export async function writeFileContent(
  filePath: string,
  content: Buffer,
): Promise<void> {
  try {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, content)
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EACCES") {
      throw new PermissionError(filePath, "write")
    }
    throw error
  }
}

export async function getFileStats(filePath: string): Promise<FileEntry> {
  try {
    const stats = await stat(filePath)
    return {
      path: filePath,
      size: stats.size,
      mode: stats.mode,
      isDirectory: stats.isDirectory(),
      modifiedAt: stats.mtime.toISOString(),
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new FileNotFoundError(filePath)
    }
    throw error
  }
}

export async function setFilePermissions(
  filePath: string,
  mode: number,
): Promise<void> {
  try {
    await chmod(filePath, mode)
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EACCES") {
      throw new PermissionError(filePath, "change permissions for")
    }
    throw error
  }
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath)
}

export function makeRelativePath(filePath: string, baseDir: string): string {
  return relative(baseDir, filePath).replace(/\\/g, "/")
}

export function joinPath(...parts: string[]): string {
  return join(...parts)
}

export function getDirName(filePath: string): string {
  return dirname(filePath)
}
