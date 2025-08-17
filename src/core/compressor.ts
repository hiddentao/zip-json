import { promisify } from "node:util"
import { gunzip, gzip } from "node:zlib"
import { CompressionError } from "./types.js"

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

export class Compressor {
  async compress(data: string): Promise<string> {
    try {
      const buffer = Buffer.from(data, "utf-8")
      const compressed = await gzipAsync(buffer, { level: 9 })
      return compressed.toString("base64")
    } catch (error) {
      throw new CompressionError(
        `Failed to compress data: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  async decompress(base64Data: string): Promise<string> {
    try {
      const buffer = Buffer.from(base64Data, "base64")
      const decompressed = await gunzipAsync(buffer)
      return decompressed.toString("utf-8")
    } catch (error) {
      throw new CompressionError(
        `Failed to decompress data: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}
