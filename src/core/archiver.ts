import { readFileContent } from "../utils/file.js"
import { addDefaultIgnores, collectFiles } from "../utils/glob.js"
import { Compressor } from "./compressor.js"
import type {
  FileEntry,
  ProgressInfo,
  ZipJsonData,
  ZipOptions,
} from "./types.js"

export class Archiver {
  private compressor = new Compressor()

  async archive(
    patterns: string[],
    options: ZipOptions = {},
  ): Promise<ZipJsonData> {
    const { baseDir = process.cwd(), ignore = [], onProgress } = options

    const ignorePatterns = addDefaultIgnores(ignore)

    const files = await collectFiles(patterns, {
      baseDir,
      ignore: ignorePatterns,
    })

    if (files.length === 0) {
      return this.createEmptyArchive()
    }

    const fileContents: Record<string, string> = {}
    const fileEntries: FileEntry[] = []
    let totalSize = 0
    let fileCount = 0
    let processedFiles = 0
    let processedBytes = 0

    const totalFiles = files.filter((f) => !f.isDirectory).length
    const totalBytes = files.reduce(
      (sum, f) => sum + (f.isDirectory ? 0 : f.size),
      0,
    )

    for (const file of files) {
      if (file.isDirectory) {
        fileEntries.push(file)
        continue
      }

      try {
        const content = await readFileContent(
          file.path.startsWith("/") ? file.path : `${baseDir}/${file.path}`,
        )
        const base64Content = content.toString("base64")

        fileContents[file.path] = base64Content
        fileEntries.push(file)
        totalSize += file.size
        fileCount++
        processedFiles++
        processedBytes += file.size

        if (onProgress && processedFiles % 10 === 0) {
          const progress: ProgressInfo = {
            type: "zip",
            currentFile: file.path,
            processedFiles,
            totalFiles,
            processedBytes,
            totalBytes,
            percentage:
              totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0,
          }
          onProgress(progress)
        }
      } catch (_error) {
        continue
      }
    }

    if (onProgress) {
      const finalProgress: ProgressInfo = {
        type: "zip",
        currentFile: "",
        processedFiles: totalFiles,
        totalFiles,
        processedBytes: totalBytes,
        totalBytes,
        percentage: 100,
      }
      onProgress(finalProgress)
    }

    const jsonString = JSON.stringify(fileContents)
    const blob = await this.compressor.compress(jsonString)

    return {
      meta: {
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        files: fileEntries,
        totalSize,
        fileCount,
      },
      blob,
    }
  }

  private createEmptyArchive(): ZipJsonData {
    return {
      meta: {
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        files: [],
        totalSize: 0,
        fileCount: 0,
      },
      blob: "",
    }
  }
}
