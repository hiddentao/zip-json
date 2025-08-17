export interface ZipJsonData {
  meta: {
    version: string
    createdAt: string
    files: FileEntry[]
    totalSize: number
    fileCount: number
  }
  blob: string
}

export interface FileEntry {
  path: string
  size: number
  mode: number
  isDirectory: boolean
  modifiedAt: string
}

export interface ZipOptions {
  baseDir?: string
  ignore?: string[]
  onProgress?: ProgressCallback
}

export interface UnzipOptions {
  outputDir?: string
  overwrite?: boolean
  preservePermissions?: boolean
  onProgress?: ProgressCallback
}

export interface ProgressInfo {
  type: "zip" | "unzip"
  currentFile: string
  processedFiles: number
  totalFiles: number
  processedBytes: number
  totalBytes: number
  percentage: number
}

export type ProgressCallback = (progress: ProgressInfo) => void

export class FileNotFoundError extends Error {
  constructor(path: string) {
    super(`File not found: ${path}`)
    this.name = "FileNotFoundError"
  }
}

export class PermissionError extends Error {
  constructor(path: string, operation: string) {
    super(`Permission denied: Cannot ${operation} ${path}`)
    this.name = "PermissionError"
  }
}

export class InvalidArchiveError extends Error {
  constructor(message: string) {
    super(`Invalid archive: ${message}`)
    this.name = "InvalidArchiveError"
  }
}

export class OverwriteError extends Error {
  constructor(path: string) {
    super(
      `File already exists: ${path}\nUse --overwrite flag to replace existing files.`,
    )
    this.name = "OverwriteError"
  }
}

export class CompressionError extends Error {
  constructor(message: string) {
    super(`Compression error: ${message}`)
    this.name = "CompressionError"
  }
}
