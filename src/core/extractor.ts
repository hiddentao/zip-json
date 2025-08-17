import { mkdir } from "node:fs/promises"
import {
  fileExists,
  getDirName,
  joinPath,
  setFilePermissions,
  writeFileContent,
} from "../utils/file.js"
import { Compressor } from "./compressor.js"
import type { ProgressInfo, UnzipOptions, ZipJsonData } from "./types.js"
import { InvalidArchiveError, OverwriteError } from "./types.js"

export class Extractor {
  private compressor = new Compressor()

  async extract(
    data: ZipJsonData,
    options: UnzipOptions = {},
  ): Promise<string[]> {
    const {
      outputDir = process.cwd(),
      overwrite = false,
      preservePermissions = true,
      onProgress,
    } = options

    this.validateArchive(data)

    if (!data.blob) {
      return []
    }

    let fileContents: Record<string, string>
    try {
      const decompressed = await this.compressor.decompress(data.blob)
      fileContents = JSON.parse(decompressed)
    } catch (_error) {
      throw new InvalidArchiveError(
        "Failed to decompress or parse archive blob",
      )
    }

    const extractedFiles: string[] = []
    const totalFiles = data.meta.files.filter((f) => !f.isDirectory).length
    let processedFiles = 0
    let processedBytes = 0
    const totalBytes = data.meta.totalSize

    for (const entry of data.meta.files) {
      const outputPath = joinPath(outputDir, entry.path)

      if (entry.isDirectory) {
        await mkdir(outputPath, { recursive: true })
        extractedFiles.push(outputPath)
        continue
      }

      if (fileExists(outputPath) && !overwrite) {
        throw new OverwriteError(outputPath)
      }

      await mkdir(getDirName(outputPath), { recursive: true })

      const content = fileContents[entry.path]
      if (!content) {
        continue
      }

      const buffer = Buffer.from(content, "base64")
      await writeFileContent(outputPath, buffer)

      if (preservePermissions) {
        try {
          await setFilePermissions(outputPath, entry.mode)
        } catch (_error) {
          // Continue if permission setting fails
        }
      }

      extractedFiles.push(outputPath)
      processedFiles++
      processedBytes += entry.size

      if (onProgress && processedFiles % 10 === 0) {
        const progress: ProgressInfo = {
          type: "unzip",
          currentFile: entry.path,
          processedFiles,
          totalFiles,
          processedBytes,
          totalBytes,
          percentage: totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0,
        }
        onProgress(progress)
      }
    }

    if (onProgress) {
      const finalProgress: ProgressInfo = {
        type: "unzip",
        currentFile: "",
        processedFiles: totalFiles,
        totalFiles,
        processedBytes: totalBytes,
        totalBytes,
        percentage: 100,
      }
      onProgress(finalProgress)
    }

    return extractedFiles
  }

  private validateArchive(data: ZipJsonData): void {
    if (!data.meta) {
      throw new InvalidArchiveError("Missing metadata")
    }

    if (!data.meta.version) {
      throw new InvalidArchiveError("Missing version information")
    }

    if (!Array.isArray(data.meta.files)) {
      throw new InvalidArchiveError("Invalid file entries")
    }

    if (typeof data.blob !== "string") {
      throw new InvalidArchiveError("Invalid or missing blob data")
    }
  }
}
