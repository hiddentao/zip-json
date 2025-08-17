import { readFile, writeFile } from "node:fs/promises"
import { Archiver } from "./core/archiver.js"
import { Extractor } from "./core/extractor.js"
import type {
  FileEntry,
  UnzipOptions,
  ZipJsonData,
  ZipOptions,
} from "./core/types.js"

export class ZipJson {
  private archiver = new Archiver()
  private extractor = new Extractor()

  async zip(patterns: string[], options?: ZipOptions): Promise<ZipJsonData> {
    return this.archiver.archive(patterns, options)
  }

  async zipToFile(
    patterns: string[],
    outputPath: string,
    options?: ZipOptions,
  ): Promise<void> {
    const data = await this.zip(patterns, options)
    await writeFile(outputPath, JSON.stringify(data, null, 2))
  }

  async unzip(data: ZipJsonData, options?: UnzipOptions): Promise<string[]> {
    return this.extractor.extract(data, options)
  }

  async unzipFromFile(
    inputPath: string,
    options?: UnzipOptions,
  ): Promise<string[]> {
    const fileContent = await readFile(inputPath, "utf-8")
    const data: ZipJsonData = JSON.parse(fileContent)
    return this.unzip(data, options)
  }

  list(data: ZipJsonData): FileEntry[] {
    return data.meta.files
  }

  async listFromFile(inputPath: string): Promise<FileEntry[]> {
    const fileContent = await readFile(inputPath, "utf-8")
    const data: ZipJsonData = JSON.parse(fileContent)
    return this.list(data)
  }
}

export const zip = (
  patterns: string[],
  options?: ZipOptions,
): Promise<ZipJsonData> => {
  return new ZipJson().zip(patterns, options)
}

export const zipToFile = (
  patterns: string[],
  outputPath: string,
  options?: ZipOptions,
): Promise<void> => {
  return new ZipJson().zipToFile(patterns, outputPath, options)
}

export const unzip = (
  data: ZipJsonData,
  options?: UnzipOptions,
): Promise<string[]> => {
  return new ZipJson().unzip(data, options)
}

export const unzipFromFile = (
  inputPath: string,
  options?: UnzipOptions,
): Promise<string[]> => {
  return new ZipJson().unzipFromFile(inputPath, options)
}

export const list = (data: ZipJsonData): FileEntry[] => {
  return new ZipJson().list(data)
}

export const listFromFile = (inputPath: string): Promise<FileEntry[]> => {
  return new ZipJson().listFromFile(inputPath)
}

export { ZipJson as default }
export type {
  ZipJsonData,
  FileEntry,
  ZipOptions,
  UnzipOptions,
  ProgressInfo,
  ProgressCallback,
} from "./core/types.js"
