# Type Definitions

This document provides comprehensive documentation for all TypeScript types and interfaces used in zip-json.

## Table of Contents

- [Core Types](#core-types)
- [Option Types](#option-types)
- [Error Types](#error-types)
- [Progress Types](#progress-types)
- [Utility Types](#utility-types)

## Core Types

### `ZipJsonData`

The primary archive format that represents a compressed collection of files in JSON format.

```typescript
interface ZipJsonData {
  meta: ArchiveMetadata
  blob: string
}
```

**Properties:**
- `meta` - Archive metadata containing file information and statistics
- `blob` - Base64-encoded compressed binary data containing the actual file contents

**Example:**
```typescript
const archive: ZipJsonData = {
  meta: {
    version: "1.0.0",
    createdAt: "2024-01-15T10:30:00.000Z",
    files: [...],
    totalSize: 1048576,
    fileCount: 25
  },
  blob: "H4sIAAAAAAAA..."
}
```

### `ArchiveMetadata`

Metadata about the archive and its contents.

```typescript
interface ArchiveMetadata {
  version: string
  createdAt: string
  files: FileEntry[]
  totalSize: number
  fileCount: number
}
```

**Properties:**
- `version` - Archive format version (currently "1.0.0")
- `createdAt` - ISO 8601 timestamp of when the archive was created
- `files` - Array of file entries describing each file in the archive
- `totalSize` - Total uncompressed size of all files in bytes
- `fileCount` - Number of files in the archive

### `FileEntry`

Represents a single file or directory in the archive.

```typescript
interface FileEntry {
  path: string
  size: number
  mode: number
  isDirectory: boolean
  modifiedAt: string
}
```

**Properties:**
- `path` - Relative path of the file from the base directory
- `size` - File size in bytes (0 for directories)
- `mode` - Unix file permissions as a number (e.g., 33188 for -rw-r--r--)
- `isDirectory` - Boolean indicating if this entry is a directory
- `modifiedAt` - ISO 8601 timestamp of when the file was last modified

**Example:**
```typescript
const fileEntry: FileEntry = {
  path: "src/utils/format.ts",
  size: 2048,
  mode: 33188,
  isDirectory: false,
  modifiedAt: "2024-01-15T10:25:00.000Z"
}

const directoryEntry: FileEntry = {
  path: "src/core",
  size: 0,
  mode: 16877,
  isDirectory: true,
  modifiedAt: "2024-01-15T10:20:00.000Z"
}
```

## Option Types

### `ZipOptions`

Configuration options for creating archives.

```typescript
interface ZipOptions {
  baseDir?: string
  ignore?: string[]
  onProgress?: (progress: ProgressInfo) => void
}
```

**Properties:**
- `baseDir` - Base directory for calculating relative paths (default: current working directory)
- `ignore` - Array of glob patterns to exclude from archiving
- `onProgress` - Callback function called during archiving to report progress

**Example:**
```typescript
const options: ZipOptions = {
  baseDir: "/home/user/project",
  ignore: ["node_modules/**", "*.log", ".git/**"],
  onProgress: (info) => {
    console.log(`Progress: ${info.percentage}%`)
  }
}
```

### `UnzipOptions`

Configuration options for extracting archives.

```typescript
interface UnzipOptions {
  outputDir?: string
  overwrite?: boolean
  preservePermissions?: boolean
  onProgress?: (progress: ProgressInfo) => void
}
```

**Properties:**
- `outputDir` - Directory to extract files to (default: current working directory)
- `overwrite` - Whether to overwrite existing files (default: true)
- `preservePermissions` - Whether to preserve original file permissions (default: false)
- `onProgress` - Callback function called during extraction to report progress

**Example:**
```typescript
const options: UnzipOptions = {
  outputDir: "./extracted",
  overwrite: false,
  preservePermissions: true,
  onProgress: (info) => {
    const percent = Math.round(info.percentage)
    console.log(`Extracting: ${percent}% (${info.processedFiles}/${info.totalFiles})`)
  }
}
```

## Error Types

All error types extend the base `Error` class and include additional context.

### `FileNotFoundError`

Thrown when a specified file or directory cannot be found.

```typescript
class FileNotFoundError extends Error {
  readonly filePath: string
  
  constructor(filePath: string)
}
```

**Properties:**
- `filePath` - The path that could not be found
- `message` - Human-readable error message

**Example:**
```typescript
try {
  const content = await readFileContent('/nonexistent/file.txt')
} catch (error) {
  if (error instanceof FileNotFoundError) {
    console.error(`File not found: ${error.filePath}`)
  }
}
```

### `PermissionError`

Thrown when there are insufficient permissions to access a file or directory.

```typescript
class PermissionError extends Error {
  readonly filePath: string
  readonly operation: string
  
  constructor(filePath: string, operation: string)
}
```

**Properties:**
- `filePath` - The path that couldn't be accessed
- `operation` - The operation that failed (e.g., "read", "write", "change permissions for")
- `message` - Human-readable error message

**Example:**
```typescript
try {
  await writeFileContent('/root/restricted.txt', buffer)
} catch (error) {
  if (error instanceof PermissionError) {
    console.error(`Permission denied: Cannot ${error.operation} ${error.filePath}`)
  }
}
```

### `InvalidArchiveError`

Thrown when an archive is malformed, corrupted, or has an unsupported format.

```typescript
class InvalidArchiveError extends Error {
  readonly reason: string
  
  constructor(reason: string)
}
```

**Properties:**
- `reason` - Specific reason why the archive is invalid
- `message` - Human-readable error message

**Example:**
```typescript
try {
  const files = await unzip(corruptedArchive)
} catch (error) {
  if (error instanceof InvalidArchiveError) {
    console.error(`Invalid archive: ${error.reason}`)
  }
}
```

### `OverwriteError`

Thrown when attempting to overwrite an existing file without permission.

```typescript
class OverwriteError extends Error {
  readonly filePath: string
  
  constructor(filePath: string)
}
```

**Properties:**
- `filePath` - The path that would be overwritten
- `message` - Human-readable error message

**Example:**
```typescript
try {
  await unzip(archive, { overwrite: false })
} catch (error) {
  if (error instanceof OverwriteError) {
    console.error(`File already exists: ${error.filePath}`)
  }
}
```

### `CompressionError`

Thrown when compression or decompression operations fail.

```typescript
class CompressionError extends Error {
  readonly operation: 'compress' | 'decompress'
  
  constructor(operation: 'compress' | 'decompress', originalError: Error)
}
```

**Properties:**
- `operation` - Whether the error occurred during compression or decompression
- `message` - Human-readable error message including the original error

**Example:**
```typescript
try {
  const compressed = await compressor.compress(data)
} catch (error) {
  if (error instanceof CompressionError) {
    console.error(`${error.operation} failed: ${error.message}`)
  }
}
```

## Progress Types

### `ProgressInfo`

Information provided to progress callback functions.

```typescript
interface ProgressInfo {
  processedFiles: number
  totalFiles: number
  percentage: number
  currentFile?: string
}
```

**Properties:**
- `processedFiles` - Number of files processed so far
- `totalFiles` - Total number of files to process
- `percentage` - Completion percentage (0-100)
- `currentFile` - Currently processing file path (when available)

**Example:**
```typescript
const progressCallback = (info: ProgressInfo) => {
  const { processedFiles, totalFiles, percentage, currentFile } = info
  
  console.log(`[${percentage}%] ${processedFiles}/${totalFiles}`)
  if (currentFile) {
    console.log(`Processing: ${currentFile}`)
  }
}
```

## Utility Types

### Type Guards

Helper functions to check types at runtime:

```typescript
// Check if an object is a valid ZipJsonData
function isZipJsonData(obj: unknown): obj is ZipJsonData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'meta' in obj &&
    'blob' in obj &&
    typeof (obj as any).blob === 'string'
  )
}

// Check if an object is a valid FileEntry
function isFileEntry(obj: unknown): obj is FileEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'path' in obj &&
    'size' in obj &&
    'isDirectory' in obj &&
    typeof (obj as any).path === 'string' &&
    typeof (obj as any).size === 'number' &&
    typeof (obj as any).isDirectory === 'boolean'
  )
}
```

### Generic Types

Types that can be extended or customized:

```typescript
// Custom progress callback type
type ProgressCallback<T = void> = (info: ProgressInfo) => T

// File filter predicate
type FileFilter = (file: FileEntry) => boolean

// Archive validation result
type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}
```

### Union Types

Common union types for specific use cases:

```typescript
// Supported file operations
type FileOperation = 'read' | 'write' | 'delete' | 'change permissions for'

// Archive format versions
type ArchiveVersion = '1.0.0'

// Compression levels (for future use)
type CompressionLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

// File modes (common Unix permissions)
type CommonFileMode = 
  | 0o644  // -rw-r--r-- (regular file)
  | 0o755  // -rwxr-xr-x (executable file)
  | 0o666  // -rw-rw-rw- (world writable)
  | 0o777  // -rwxrwxrwx (world executable)
```

## Type Usage Examples

### Creating a Type-Safe Archive Function

```typescript
import { ZipJsonData, ZipOptions, FileEntry } from 'zip-json'

async function createProjectBackup(
  projectPath: string,
  options: Partial<ZipOptions> = {}
): Promise<ZipJsonData> {
  const defaultOptions: ZipOptions = {
    baseDir: projectPath,
    ignore: ['node_modules/**', '.git/**', 'dist/**'],
    onProgress: (info) => {
      console.log(`Backing up: ${info.percentage}%`)
    }
  }
  
  const finalOptions = { ...defaultOptions, ...options }
  return await zip(['**/*'], finalOptions)
}
```

### Type-Safe Archive Validation

```typescript
function validateArchive(data: unknown): data is ZipJsonData {
  if (!isZipJsonData(data)) {
    throw new InvalidArchiveError('Invalid archive format')
  }
  
  if (!data.meta.version || data.meta.version !== '1.0.0') {
    throw new InvalidArchiveError(`Unsupported version: ${data.meta.version}`)
  }
  
  if (!Array.isArray(data.meta.files)) {
    throw new InvalidArchiveError('Files list is not an array')
  }
  
  return true
}
```

### Working with File Entries

```typescript
function analyzeArchive(archive: ZipJsonData): {
  directories: FileEntry[]
  files: FileEntry[]
  totalSize: number
  largestFile: FileEntry | null
} {
  const directories = archive.meta.files.filter(f => f.isDirectory)
  const files = archive.meta.files.filter(f => !f.isDirectory)
  
  const largestFile = files.reduce<FileEntry | null>((largest, current) => {
    if (!largest || current.size > largest.size) {
      return current
    }
    return largest
  }, null)
  
  return {
    directories,
    files,
    totalSize: archive.meta.totalSize,
    largestFile
  }
}
```