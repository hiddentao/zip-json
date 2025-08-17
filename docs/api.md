# API Documentation

This document provides comprehensive documentation for the zip-json API.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Functions](#core-functions)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Installation

```bash
bun add zip-json
# or
npm install zip-json
```

## Quick Start

```typescript
import { zip, unzip, list } from 'zip-json'

// Zip files to JSON
const archive = await zip(['src/**/*.ts'], { baseDir: 'project' })

// Unzip from JSON
const files = await unzip(archive, { outputDir: 'extracted' })

// List archive contents
const fileList = list(archive)
```

## Core Functions

### `zip(patterns, options?)`

Creates a compressed archive from files matching the given patterns.

**Parameters:**
- `patterns: string[]` - Array of glob patterns to match files
- `options?: ZipOptions` - Optional configuration

**Returns:** `Promise<ZipJsonData>`

**Options:**
```typescript
interface ZipOptions {
  baseDir?: string           // Base directory for relative paths
  ignore?: string[]         // Patterns to ignore
  onProgress?: (progress: ProgressInfo) => void  // Progress callback
}
```

**Example:**
```typescript
const archive = await zip(['src/**/*.ts', '*.md'], {
  baseDir: '/project',
  ignore: ['node_modules/**', '*.test.ts'],
  onProgress: (info) => console.log(`${info.percentage}% complete`)
})
```

### `unzip(archive, options?)`

Extracts files from a compressed archive.

**Parameters:**
- `archive: ZipJsonData` - The archive to extract
- `options?: UnzipOptions` - Optional configuration

**Returns:** `Promise<string[]>` - Array of extracted file paths

**Options:**
```typescript
interface UnzipOptions {
  outputDir?: string        // Output directory (default: current)
  overwrite?: boolean       // Overwrite existing files (default: true)
  preservePermissions?: boolean  // Preserve file permissions (default: false)
  onProgress?: (progress: ProgressInfo) => void  // Progress callback
}
```

**Example:**
```typescript
const extractedFiles = await unzip(archive, {
  outputDir: './extracted',
  overwrite: true,
  preservePermissions: true,
  onProgress: (info) => console.log(`Extracted ${info.processedFiles} files`)
})
```

### `list(archive)`

Lists the contents of an archive without extracting.

**Parameters:**
- `archive: ZipJsonData` - The archive to inspect

**Returns:** `FileEntry[]` - Array of file entries

**Example:**
```typescript
const files = list(archive)
files.forEach(file => {
  console.log(`${file.path} (${file.size} bytes)`)
})
```

### `zipToFile(patterns, outputPath, options?)`

Creates an archive and saves it directly to a file.

**Parameters:**
- `patterns: string[]` - Array of glob patterns
- `outputPath: string` - Path to save the archive file
- `options?: ZipOptions` - Optional configuration

**Returns:** `Promise<void>`

**Example:**
```typescript
await zipToFile(['src/**/*.ts'], 'backup.json', {
  baseDir: './project',
  ignore: ['*.test.ts']
})
```

### `unzipFromFile(archivePath, options?)`

Loads and extracts an archive from a file.

**Parameters:**
- `archivePath: string` - Path to the archive file
- `options?: UnzipOptions` - Optional configuration

**Returns:** `Promise<string[]>` - Array of extracted file paths

**Example:**
```typescript
const files = await unzipFromFile('backup.json', {
  outputDir: './restored'
})
```

### `listFromFile(archivePath)`

Lists the contents of an archive file without extracting.

**Parameters:**
- `archivePath: string` - Path to the archive file

**Returns:** `Promise<FileEntry[]>` - Array of file entries

**Example:**
```typescript
const files = await listFromFile('backup.json')
console.log(`Archive contains ${files.length} files`)
```

## Type Definitions

### `ZipJsonData`

The main archive format:

```typescript
interface ZipJsonData {
  meta: {
    version: string        // Archive format version
    createdAt: string     // ISO timestamp
    files: FileEntry[]    // File metadata
    totalSize: number     // Total uncompressed size
    fileCount: number     // Number of files
  }
  blob: string           // Base64-encoded compressed data
}
```

### `FileEntry`

File metadata:

```typescript
interface FileEntry {
  path: string          // Relative file path
  size: number          // File size in bytes
  mode: number          // File permissions
  isDirectory: boolean  // Directory flag
  modifiedAt: string    // ISO timestamp
}
```

### `ProgressInfo`

Progress callback information:

```typescript
interface ProgressInfo {
  processedFiles: number  // Files processed so far
  totalFiles: number     // Total files to process
  percentage: number     // Completion percentage (0-100)
  currentFile?: string   // Currently processing file
}
```

## Error Handling

The library defines several custom error types:

### `FileNotFoundError`
Thrown when a specified file cannot be found.

### `PermissionError`
Thrown when there are insufficient permissions to read/write files.

### `InvalidArchiveError`
Thrown when an archive is malformed or corrupted.

### `OverwriteError`
Thrown when attempting to overwrite an existing file without permission.

### `CompressionError`
Thrown when compression/decompression fails.

**Example:**
```typescript
import { zip, FileNotFoundError, PermissionError } from 'zip-json'

try {
  const archive = await zip(['src/**/*.ts'])
} catch (error) {
  if (error instanceof FileNotFoundError) {
    console.error('File not found:', error.message)
  } else if (error instanceof PermissionError) {
    console.error('Permission denied:', error.message)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

## Examples

### Basic File Archiving

```typescript
import { zip, unzip } from 'zip-json'

// Create archive from TypeScript files
const archive = await zip(['src/**/*.ts', 'types/**/*.d.ts'], {
  baseDir: './project',
  ignore: ['**/*.test.ts', 'node_modules/**']
})

// Save archive to file
await writeFile('code-backup.json', JSON.stringify(archive, null, 2))

// Later, restore the files
const restored = await unzip(archive, {
  outputDir: './restored-project',
  preservePermissions: true
})

console.log(`Restored ${restored.length} files`)
```

### Progress Tracking

```typescript
import { zip } from 'zip-json'

const archive = await zip(['**/*'], {
  baseDir: './large-project',
  onProgress: (info) => {
    const bar = '█'.repeat(Math.floor(info.percentage / 5))
    const empty = '░'.repeat(20 - Math.floor(info.percentage / 5))
    console.log(`[${bar}${empty}] ${info.percentage}% (${info.processedFiles}/${info.totalFiles})`)
  }
})
```

### Selective Extraction

```typescript
import { list, unzip } from 'zip-json'

// Load archive
const archive = JSON.parse(await readFile('backup.json', 'utf8'))

// List contents and filter
const allFiles = list(archive)
const jsFiles = allFiles.filter(file => file.path.endsWith('.js'))

console.log(`Found ${jsFiles.length} JavaScript files in archive`)

// Extract only specific files by modifying the archive
const filteredArchive = {
  ...archive,
  meta: {
    ...archive.meta,
    files: jsFiles,
    fileCount: jsFiles.length
  }
}

await unzip(filteredArchive, { outputDir: './js-only' })
```

### Streaming Large Archives

```typescript
import { zip } from 'zip-json'

// For very large archives, use progress callbacks to provide feedback
const archive = await zip(['**/*'], {
  baseDir: './huge-project',
  ignore: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    '*.log'
  ],
  onProgress: (info) => {
    if (info.processedFiles % 100 === 0) {
      console.log(`Processed ${info.processedFiles} files...`)
    }
  }
})

console.log(`Archive created with ${archive.meta.fileCount} files`)
console.log(`Compressed size: ${(archive.blob.length / 1024 / 1024).toFixed(2)} MB`)
```