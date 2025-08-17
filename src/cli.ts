#!/usr/bin/env node

import chalk from "chalk"
import { Command } from "commander"
import type { ProgressInfo } from "./core/types.js"
import { listFromFile, unzipFromFile, zipToFile } from "./index.js"
import {
  formatBytes,
  formatDate,
  formatPath,
  formatPercentage,
  pluralize,
} from "./utils/format.js"

const program = new Command()

program
  .name("zip-json")
  .description(
    "Bundle files and folders into JSON for Bun binary builds with runtime extraction",
  )
  .version("1.0.0")
  .option("-q, --quiet", "Suppress all output except errors", false)

program
  .command("zip")
  .description("Create a JSON archive from files and folders")
  .argument("<output>", "Output JSON file path")
  .argument(
    "[patterns...]",
    "File patterns to include (glob patterns supported)",
  )
  .option(
    "-b, --base-dir <dir>",
    "Base directory for relative paths",
    process.cwd(),
  )
  .option("-i, --ignore <patterns>", "Comma-separated patterns to ignore")
  .option("--no-progress", "Disable progress indicator")
  .action(async (output: string, patterns: string[], options: any) => {
    try {
      const globalOptions = program.opts()
      const isQuiet = globalOptions.quiet

      if (patterns.length === 0) {
        patterns = ["**/*"]
      }

      const ignore = options.ignore
        ? options.ignore.split(",").map((p: string) => p.trim())
        : []
      let lastProgressTime = 0

      const zipOptions: any = {
        baseDir: options.baseDir,
        ignore,
      }

      if (options.progress && !isQuiet) {
        zipOptions.onProgress = (progress: ProgressInfo) => {
          const now = Date.now()
          if (now - lastProgressTime > 100) {
            process.stdout.write(
              `\r${chalk.blue("Zipping:")} ${formatPercentage(progress.percentage)} ${chalk.gray(formatPath(progress.currentFile))}`,
            )
            lastProgressTime = now
          }
        }
      }

      await zipToFile(patterns, output, zipOptions)

      if (options.progress && !isQuiet) {
        process.stdout.write("\n")
      }

      if (!isQuiet) {
        const stats = await listFromFile(output)
        const fileCount = stats.filter((f) => !f.isDirectory).length
        const totalSize = stats.reduce(
          (sum, f) => sum + (f.isDirectory ? 0 : f.size),
          0,
        )

        console.log(chalk.green("✓"), `Created ${output}`)
        console.log(
          chalk.gray(
            `  ${fileCount} ${pluralize(fileCount, "file")}, ${formatBytes(totalSize)}`,
          ),
        )
      }
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : String(error),
      )
      process.exit(1)
    }
  })

program
  .command("unzip")
  .description("Extract files from a JSON archive")
  .argument("<input>", "Input JSON archive file")
  .option("-o, --output-dir <dir>", "Output directory", process.cwd())
  .option("--overwrite", "Overwrite existing files", false)
  .option("--preserve-permissions", "Preserve file permissions", true)
  .option("--no-progress", "Disable progress indicator")
  .action(async (input: string, options: any) => {
    try {
      const globalOptions = program.opts()
      const isQuiet = globalOptions.quiet
      let lastProgressTime = 0

      const unzipOptions: any = {
        outputDir: options.outputDir,
        overwrite: options.overwrite,
        preservePermissions: options.preservePermissions,
      }

      if (options.progress && !isQuiet) {
        unzipOptions.onProgress = (progress: ProgressInfo) => {
          const now = Date.now()
          if (now - lastProgressTime > 100) {
            process.stdout.write(
              `\r${chalk.blue("Extracting:")} ${formatPercentage(progress.percentage)} ${chalk.gray(formatPath(progress.currentFile))}`,
            )
            lastProgressTime = now
          }
        }
      }

      const extractedFiles = await unzipFromFile(input, unzipOptions)

      if (options.progress && !isQuiet) {
        process.stdout.write("\n")
      }

      if (!isQuiet) {
        console.log(
          chalk.green("✓"),
          `Extracted ${extractedFiles.length} ${pluralize(extractedFiles.length, "file")}`,
        )
        if (options.outputDir !== process.cwd()) {
          console.log(chalk.gray(`  to ${options.outputDir}`))
        }
      }
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : String(error),
      )
      process.exit(1)
    }
  })

program
  .command("list")
  .description("List contents of a JSON archive")
  .argument("<input>", "Input JSON archive file")
  .option("-d, --detailed", "Show detailed information", false)
  .option("-s, --sort-by <field>", "Sort by: name, size, or date", "name")
  .action(async (input: string, options: any) => {
    try {
      const globalOptions = program.opts()
      const isQuiet = globalOptions.quiet

      const files = await listFromFile(input)

      if (!isQuiet) {
        const sortedFiles = files.sort((a, b) => {
          switch (options.sortBy) {
            case "size":
              return b.size - a.size
            case "date":
              return (
                new Date(b.modifiedAt).getTime() -
                new Date(a.modifiedAt).getTime()
              )
            case "name":
            default:
              return a.path.localeCompare(b.path)
          }
        })

        console.log(chalk.bold(`Contents of ${input}:`))
        console.log()

        if (options.detailed) {
          const maxPathLength = Math.max(
            ...sortedFiles.map((f) => f.path.length),
            20,
          )

          console.log(
            chalk.gray(
              `${"Path".padEnd(maxPathLength)} ${"Size".padStart(10)} ${"Modified".padStart(20)} ${"Type".padStart(8)}`,
            ),
          )
          console.log(chalk.gray("-".repeat(maxPathLength + 42)))

          for (const file of sortedFiles) {
            const type = file.isDirectory ? "dir" : "file"
            const size = file.isDirectory ? "" : formatBytes(file.size)
            const modified = formatDate(file.modifiedAt).slice(0, 16)

            console.log(
              `${file.path.padEnd(maxPathLength)} ${size.padStart(10)} ${modified.padStart(20)} ${type.padStart(8)}`,
            )
          }
        } else {
          for (const file of sortedFiles) {
            const icon = file.isDirectory ? chalk.blue("📁") : "📄"
            console.log(`${icon} ${file.path}`)
          }
        }

        console.log()
        const fileCount = files.filter((f) => !f.isDirectory).length
        const dirCount = files.filter((f) => f.isDirectory).length
        const totalSize = files.reduce(
          (sum, f) => sum + (f.isDirectory ? 0 : f.size),
          0,
        )

        console.log(
          chalk.gray(
            `${fileCount} ${pluralize(fileCount, "file")}, ${dirCount} ${pluralize(dirCount, "directory", "directories")}, ${formatBytes(totalSize)} total`,
          ),
        )
      }
    } catch (error) {
      console.error(
        chalk.red("Error:"),
        error instanceof Error ? error.message : String(error),
      )
      process.exit(1)
    }
  })

program.parse()
