# zip-json Package Specification

## Overview
A TypeScript NPM package that zips files and folders into a JSON format, enabling bundling for Bun and other JavaScript runtimes. The package provides both CLI and programmatic interfaces for zipping, unzipping, and listing archive contents.

## Core Architecture

### Compression Strategy
- Use Node.js built-in `zlib` module for compression (gzip)
- Store files as base64-encoded strings in a JSON structure
- Compress the entire file collection as a single blob for efficiency
- Include metadata for each file (path, size, permissions, timestamps)

### JSON Structure
```typescript
{
  "meta": {
    "version": "1.0.0",
    "createdAt": "ISO-8601 timestamp",
    "files": [
      {
        "path": "relative/path/to/file.txt",
        "size": 1024,
        "mode": 33188,  // Unix file permissions
        "isDirectory": false,
        "modifiedAt": "ISO-8601 timestamp"
      }
    ],
    "totalSize": 10240,  // Total uncompressed size
    "fileCount": 5       // Number of files (excluding directories)
  },
  "blob": "base64-encoded-gzipped-content"
}
```

## Project Structure
```
zip-json/
├── src/                    # TypeScript source files
│   ├── index.ts           # Main entry point & exports
│   ├── cli.ts             # CLI implementation
│   ├── core/              # Core functionality
│   │   ├── compressor.ts  # Compression/decompression logic
│   │   ├── archiver.ts    # Archive creation logic
│   │   ├── extractor.ts   # Archive extraction logic
│   │   └── types.ts       # TypeScript interfaces
│   └── utils/             # Utility functions
│       ├── file.ts        # File system operations
│       ├── glob.ts        # Glob pattern handling
│       └── format.ts      # Output formatting
├── bin/                   # Executable scripts (generated)
│   └── zip-json.js       # CLI executable
├── dist/                  # Compiled output (generated)
│   ├── esm/              # ES modules
│   ├── cjs/              # CommonJS modules
│   └── types/            # TypeScript declarations
├── docs/                  # Documentation
│   ├── api.md            # API reference
│   ├── cli.md            # CLI documentation
│   └── types.md          # TypeScript types reference
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── fixtures/         # Test files
├── scripts/
│   └── build.ts          # Build script
├── package.json
├── tsconfig.json
├── tsconfig.esm.json
├── tsconfig.cjs.json
├── biome.json
├── bunfig.toml
├── .gitignore
├── README.md
├── LICENSE.md
└── spec.md               # This file
```

## Package Configuration

### package.json
```json
{
  "name": "zip-json",
  "version": "1.0.0",
  "description": "Zip files and folders into a JSON format for bundling and runtime extraction",
  "keywords": ["zip", "json", "bundle", "compress", "archive", "bun"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/zip-json.git"
  },
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  },
  "bin": {
    "zip-json": "./bin/zip-json.js"
  },
  "files": [
    "dist",
    "bin",
    "README.md",
    "LICENSE.md"
  ],
  "scripts": {
    "build": "bun run scripts/build.ts",
    "build:watch": "bun run scripts/build.ts --watch",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch",
    "lint": "biome check --apply ./src",
    "format": "biome format --write ./src ./tests",
    "check": "biome check ./src ./tests",
    "prepublishOnly": "bun run build && bun run test:coverage",
    "postbuild": "chmod +x bin/zip-json.js"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "glob": "^10.3.10",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/node": "^22.0.0",
    "typescript": "^5.3.0",
    "@biomejs/biome": "^1.5.0"
  },
  "engines": {
    "node": ">=22.0.0"
  },
  "engineStrict": true
}
```

### Biome Configuration (biome.json)
- Enable organize imports
- Set recommended linting rules
- Configure formatting: 2 spaces, single quotes, semicolons, trailing commas
- Line width: 100 characters
- Ignore: node_modules, dist, bin, coverage, *.json

### TypeScript Configuration (tsconfig.json)
- Target: ES2022
- Module: ESNext with bundler resolution
- Strict mode enabled
- Generate declarations, source maps
- Output: dist/types for declarations

### Build Script (scripts/build.ts)
```pseudocode
function build():
  clean dist and bin directories
  create directory structure
  
  // Build TypeScript declarations
  run tsc --emitDeclarationOnly
  
  // Build ESM version
  Bun.build({format: 'esm', outdir: 'dist/esm'})
  
  // Build CJS version
  Bun.build({format: 'cjs', outdir: 'dist/cjs'})
  
  // Build CLI executable
  Bun.build({format: 'esm', outdir: 'bin', minify: true})
  
  // Add shebang to CLI
  prepend #!/usr/bin/env node to bin/zip-json.js
  make executable

if --watch flag:
  watch src directory for changes
  rebuild on .ts file changes
```

## Core Components Implementation

### 1. Type Definitions (src/core/types.ts)
```typescript
interface ZipJsonData {
  meta: {
    version: string
    createdAt: string
    files: FileEntry[]
    totalSize: number
    fileCount: number
  }
  blob: string  // Base64 encoded compressed data
}

interface FileEntry {
  path: string
  size: number
  mode: number
  isDirectory: boolean
  modifiedAt: string
}

interface ZipOptions {
  baseDir?: string
  ignore?: string[]
  followSymlinks?: boolean
  onProgress?: ProgressCallback
}

interface UnzipOptions {
  outputDir?: string
  overwrite?: boolean
  preservePermissions?: boolean
  onProgress?: ProgressCallback
}

interface ProgressInfo {
  type: 'zip' | 'unzip'
  currentFile: string
  processedFiles: number
  totalFiles: number
  processedBytes: number
  totalBytes: number
  percentage: number
}

type ProgressCallback = (progress: ProgressInfo) => void
```

### 2. Compressor Module (src/core/compressor.ts)
```pseudocode
class Compressor:
  async compress(data: string) -> string:
    buffer = Buffer.from(data, 'utf-8')
    compressed = await gzip(buffer, {level: 9})
    return compressed.toString('base64')
  
  async decompress(base64Data: string) -> string:
    buffer = Buffer.from(base64Data, 'base64')
    decompressed = await gunzip(buffer)
    return decompressed.toString('utf-8')
```

### 3. Archiver Module (src/core/archiver.ts)
```pseudocode
class Archiver:
  async archive(patterns, options):
    // Collect files using glob
    files = await collectFiles(patterns, options)
    
    fileEntries = []
    fileContents = {}
    totalSize = 0
    
    for each file in files:
      // Get file stats
      entry = createFileEntry(file)
      fileEntries.push(entry)
      
      if not directory:
        // Read and encode file
        content = await readFile(file)
        fileContents[entry.path] = base64(content)
        totalSize += entry.size
      
      // Report progress
      if options.onProgress:
        options.onProgress(progressInfo)
    
    // Compress all contents together
    jsonString = JSON.stringify(fileContents)
    blob = await compressor.compress(jsonString)
    
    return {
      meta: {version, createdAt, files, totalSize, fileCount},
      blob: blob
    }
  
  private async collectFiles(patterns, options):
    // Use glob to find all matching files
    // Handle ignore patterns
    // Follow symlinks if specified
    return matchedFiles
```

### 4. Extractor Module (src/core/extractor.ts)
```pseudocode
class Extractor:
  async extract(data, options):
    outputDir = options.outputDir || cwd
    
    // Decompress blob
    decompressed = await compressor.decompress(data.blob)
    fileContents = JSON.parse(decompressed)
    
    extractedFiles = []
    
    for each entry in data.meta.files:
      outputPath = join(outputDir, entry.path)
      
      if entry.isDirectory:
        await mkdir(outputPath, recursive)
      else:
        // Check overwrite
        if exists(outputPath) and not options.overwrite:
          throw Error("File exists")
        
        // Ensure directory exists
        await mkdir(dirname(outputPath), recursive)
        
        // Write file
        content = fileContents[entry.path]
        buffer = Buffer.from(content, 'base64')
        await writeFile(outputPath, buffer)
        
        // Preserve permissions if requested
        if options.preservePermissions:
          await chmod(outputPath, entry.mode)
      
      extractedFiles.push(outputPath)
      
      // Report progress
      if options.onProgress:
        options.onProgress(progressInfo)
    
    return extractedFiles
```

### 5. Main API (src/index.ts)
```pseudocode
class ZipJson:
  archiver = new Archiver()
  extractor = new Extractor()
  
  async zip(patterns, options):
    return archiver.archive(patterns, options)
  
  async zipToFile(patterns, outputPath, options):
    data = await zip(patterns, options)
    await writeFile(outputPath, JSON.stringify(data))
  
  async unzip(data, options):
    return extractor.extract(data, options)
  
  async unzipFromFile(inputPath, options):
    data = JSON.parse(await readFile(inputPath))
    return unzip(data, options)
  
  list(data):
    return data.meta.files
  
  async listFromFile(inputPath):
    data = JSON.parse(await readFile(inputPath))
    return list(data)

// Export functional API
export const zip = (patterns, options) => new ZipJson().zip(patterns, options)
export const unzip = (data, options) => new ZipJson().unzip(data, options)
export const list = (data) => new ZipJson().list(data)
```

### 6. CLI Implementation (src/cli.ts)
```pseudocode
#!/usr/bin/env node

program = new Command()

// Setup commands
program
  .command('zip <o> [patterns...]')
  .options(baseDir, ignore, followSymlinks, noProgress)
  .action((output, patterns, options) => {
    // Validate inputs
    // Create progress callback if needed
    // Call zipToFile with options
    // Display results
  })

program
  .command('unzip <input>')
  .options(outputDir, overwrite, preservePermissions, noProgress)
  .action((input, options) => {
    // Check file exists
    // Create progress callback if needed
    // Call unzipFromFile with options
    // Display results
  })

program
  .command('list <input>')
  .options(detailed, sortBy)
  .action((input, options) => {
    // Read and parse archive
    // Sort files based on option
    // Display formatted list
    // Show summary statistics
  })

program.parse()
```

### 7. Utility Functions (src/utils/)

#### format.ts
```pseudocode
formatBytes(bytes):
  // Convert bytes to human-readable format
  // Returns: "1.5 MB", "500 KB", etc.

formatDate(date):
  // Format date for display
  // Returns localized date string
```

## Documentation

### README.md Structure
```markdown
# zip-json

[NPM Badge] [License Badge] [Build Badge] [Coverage Badge]

> Bundle files and folders into JSON for Bun binary builds with runtime extraction

## ✨ Features

- 🚀 **Binary bundling** - Embed assets directly into Bun executables
- 📦 **JSON format** - Import bundles as JavaScript modules
- 🎯 **TypeScript-first** - Full type safety and IntelliSense support
- 💾 **Efficient compression** - Gzip compression for minimal bundle size
- 🔄 **Progress tracking** - Real-time feedback for large operations
- 🛠️ **Dual interface** - CLI tool and programmatic API
- ⚡ **Fast extraction** - Optimized for runtime asset extraction
- 🔒 **Permission preservation** - Maintains file permissions across platforms

## 📦 Installation

### Global CLI Installation
```bash
npm install -g zip-json
# or
bun add -g zip-json
```

### As a Dependency
```bash
npm install zip-json
# or
bun add zip-json
```

### Quick Usage with bunx
```bash
bunx zip-json zip assets.json public/**/* resources/**/*
```

## 🚀 Quick Start

### Primary Use Case: Bun Binary Bundling

#### Step 1: Bundle your assets at build time
```bash
# Bundle all your runtime assets into a single JSON file
zip-json zip assets.json \
  public/**/* \
  templates/**/* \
  config/**/*.json \
  --base-dir .
```

#### Step 2: Import the bundle in your application
```javascript
// main.ts
import { unzip } from 'zip-json';
import assetsBundle from './assets.json';

// Extract assets on first run
async function initializeAssets() {
  const assetDir = './runtime-assets';
  
  if (!fs.existsSync(assetDir)) {
    console.log('Extracting bundled assets...');
    await unzip(assetsBundle, {
      outputDir: assetDir,
      preservePermissions: true
    });
    console.log('Assets ready!');
  }
}

// Initialize before starting your app
await initializeAssets();

// Your application code here...
```

#### Step 3: Build your Bun binary
```bash
# Build a single executable with embedded assets
bun build --compile --minify --sourcemap \
  --external zip-json \
  --entrypoint main.ts \
  --outfile myapp

# Your binary now contains everything!
./myapp
```

### CLI Usage

#### Zip files and folders
```bash
# Bundle assets for binary inclusion
zip-json zip bundle.json assets/ config/ data/

# With glob patterns
zip-json zip app-resources.json "public/**/*" "!**/*.test.js"

# Exclude unnecessary files
zip-json zip dist.json dist/ \
  --ignore "*.map,*.test.js,*.spec.ts"
```

#### Extract bundles at runtime
```bash
# Extract to current directory
zip-json unzip bundle.json

# Extract to specific location
zip-json unzip bundle.json --output-dir ./extracted
```

#### Inspect bundle contents
```bash
# List files in bundle
zip-json list bundle.json

# Detailed view with file sizes
zip-json list bundle.json --detailed
```

### Programmatic API

#### Creating Bundles Programmatically
```javascript
import { zip } from 'zip-json';

// Create asset bundle during build process
const bundle = await zip([
  'public/**/*',
  'templates/**/*.hbs',
  'locales/**/*.json'
], {
  baseDir: process.cwd(),
  ignore: ['*.test.*', '*.spec.*']
});

// Save for inclusion in binary
await fs.writeFile('assets.json', JSON.stringify(bundle));
```

#### Basic Runtime Extraction
```javascript
import ZipJson from 'zip-json';
import bundledAssets from './assets.json';

const zipper = new ZipJson();

// Extract bundled assets at runtime
async function setupRuntime() {
  const files = await zipper.unzip(bundledAssets, {
    outputDir: './runtime',
    overwrite: false  // Skip if already extracted
  });
  
  console.log(`Extracted ${files.length} files`);
  return files;
}

// Run once at startup
await setupRuntime();
```

#### Progress Tracking for Large Operations
```javascript
import { zip, unzip } from 'zip-json';

// Zip with progress tracking
const bundle = await zip(['large-folder/**/*'], {
  onProgress: (progress) => {
    const percent = progress.percentage;
    const current = progress.currentFile;
    console.log(`Zipping: ${percent}% - ${current}`);
  }
});

// Extract with progress tracking  
await unzip(bundle, {
  outputDir: './assets',
  onProgress: (progress) => {
    const percent = progress.percentage;
    const current = progress.currentFile;
    console.log(`Extracting: ${percent}% - ${current}`);
  }
});
```

## 🎯 Why zip-json?

Traditional binary builders struggle with dynamic assets that need to be accessed as files at runtime. `zip-json` solves this by:

1. **Bundling assets into JSON** that can be imported directly into your JavaScript/TypeScript
2. **Extracting them at runtime** to the filesystem when your application starts
3. **Maintaining a single binary** that contains both your code and assets

This is perfect for:
- **CLI tools** that need templates, configs, or other resources
- **Desktop applications** built with Bun that need to bundle assets
- **Serverless functions** that need to include static files
- **Portable applications** that must be distributed as a single file

## 📖 Documentation

- [API Reference](./docs/api.md) - Complete API documentation
- [CLI Reference](./docs/cli.md) - Detailed CLI usage
- [Type Definitions](./docs/types.md) - TypeScript types

## 🔧 Development

### Prerequisites
- Node.js >= 22.0.0
- Bun >= 1.0.0

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/zip-json.git
cd zip-json

# Install dependencies
bun install

# Build the project
bun run build

# Run tests
bun test
```

### Scripts
- `bun run build` - Build all formats
- `bun run build:watch` - Build with file watching
- `bun test` - Run tests
- `bun run test:coverage` - Run tests with coverage
- `bun run lint` - Lint and fix code
- `bun run format` - Format code

## 📄 License

MIT © [Your Name]

See [LICENSE.md](./LICENSE.md) for details.

## 🤝 Support

- 🐛 [Report bugs](https://github.com/yourusername/zip-json/issues)
- 💡 [Request features](https://github.com/yourusername/zip-json/issues)
- 💬 [Join discussions](https://github.com/yourusername/zip-json/discussions)
```

### Documentation Files

#### docs/api.md
```markdown
# API Reference

Complete API documentation for the zip-json package.

## Class: ZipJson

Main class for creating and extracting JSON archives.

### Constructor
```javascript
new ZipJson()
```

### Methods

#### zip(patterns, options?)
Creates an archive from files and folders.

#### zipToFile(patterns, outputPath, options?)
Creates an archive and saves it to a file.

#### unzip(data, options?)
Extracts an archive to the file system.

#### unzipFromFile(inputPath, options?)
Extracts an archive from a file.

#### list(data)
Lists the contents of an archive.

#### listFromFile(inputPath)
Lists the contents of an archive file.

## Functional API

### zip(patterns, options?)
Quick function to create archives.

### unzip(data, options?)
Quick function to extract archives.

### list(data)
Quick function to list archive contents.

## Types

See [types.md](./types.md) for complete type definitions.
```

#### docs/cli.md
```markdown
# CLI Reference

Complete command-line interface documentation for zip-json.

## Commands

### zip
Create a JSON archive from files and folders.

```bash
zip-json zip <output> [patterns...] [options]
```

Options:
- `-b, --base-dir <dir>` - Base directory for relative paths
- `-i, --ignore <patterns>` - Comma-separated patterns to ignore
- `--follow-symlinks` - Follow symbolic links
- `--no-progress` - Disable progress indicator

### unzip
Extract files from a JSON archive.

```bash
zip-json unzip <input> [options]
```

Options:
- `-o, --output-dir <dir>` - Output directory (default: current)
- `--overwrite` - Overwrite existing files
- `--preserve-permissions` - Preserve file permissions (default: true)
- `--no-progress` - Disable progress indicator

### list
List contents of a JSON archive.

```bash
zip-json list <input> [options]
```

Options:
- `-d, --detailed` - Show detailed information
- `-s, --sort-by <field>` - Sort by: name, size, or date

## Examples

See README for usage examples.
```

#### docs/types.md
```markdown
# Type Definitions

Complete TypeScript type definitions for zip-json.

## Main Types

### ZipJsonData
```typescript
interface ZipJsonData {
  meta: {
    version: string;
    createdAt: string;
    files: FileEntry[];
    totalSize: number;
    fileCount: number;
  };
  blob: string;
}
```

### FileEntry
```typescript
interface FileEntry {
  path: string;
  size: number;
  mode: number;
  isDirectory: boolean;
  modifiedAt: string;
}
```

### Options Types

#### ZipOptions
```typescript
interface ZipOptions {
  baseDir?: string;
  ignore?: string[];
  followSymlinks?: boolean;
  onProgress?: ProgressCallback;
}
```

#### UnzipOptions
```typescript
interface UnzipOptions {
  outputDir?: string;
  overwrite?: boolean;
  preservePermissions?: boolean;
  onProgress?: ProgressCallback;
}
```

### Progress Types

#### ProgressInfo
```typescript
interface ProgressInfo {
  type: 'zip' | 'unzip';
  currentFile: string;
  processedFiles: number;
  totalFiles: number;
  processedBytes: number;
  totalBytes: number;
  percentage: number;
}
```

#### ProgressCallback
```typescript
type ProgressCallback = (progress: ProgressInfo) => void;
```
```
```markdown
# MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Testing Strategy

### Unit Tests Structure
```
tests/
├── unit/
│   ├── compressor.test.ts    # Test compression/decompression
│   ├── archiver.test.ts      # Test archive creation
│   ├── extractor.test.ts     # Test extraction
│   └── utils.test.ts         # Test utility functions
├── integration/
│   ├── cli.test.ts           # Test CLI commands
│   ├── api.test.ts           # Test programmatic API
│   └── scenarios.test.ts     # Test real-world scenarios
└── fixtures/
    ├── sample-files/          # Test files
    └── sample-archives/       # Pre-made test archives
```

### Test Coverage Requirements
- 100% code coverage for all modules
- Test edge cases:
  - Empty patterns
  - Non-existent files
  - Large files (>100MB)
  - Deep directory structures
  - Special characters in filenames
  - Permission preservation
  - Overwrite scenarios
  - Progress callbacks

### Test Example Structure
```pseudocode
describe("Compressor"):
  test "compresses and decompresses data":
    original = "test data"
    compressed = await compressor.compress(original)
    decompressed = await compressor.decompress(compressed)
    expect(decompressed).toBe(original)
  
  test "handles large data":
    // Test with 10MB+ strings
  
  test "handles empty input":
    // Test edge cases

describe("CLI":
  test "zip command creates valid archive":
    // Run CLI command
    // Verify output file
    // Check archive structure
  
  test "handles missing arguments":
    // Test error handling
```

## Error Handling

### Error Types
- `FileNotFoundError`: Input file/pattern doesn't exist
- `PermissionError`: No read/write permissions
- `InvalidArchiveError`: Corrupted or invalid JSON
- `OverwriteError`: File exists and overwrite not specified
- `CompressionError`: Compression/decompression failure

### Error Messages
All errors should include:
- Clear description of what went wrong
- The file/path that caused the error
- Suggestion for how to fix it

Example:
```
Error: File already exists: /path/to/file.txt
Use --overwrite flag to replace existing files.
```

## Performance Considerations

### Optimization Strategies
1. **Memory Management**
   - Stream processing for files > 10MB
   - Chunk large archives during compression
   - Clear buffers after use

2. **Parallel Processing**
   - Process multiple files concurrently (up to 10)
   - Use worker threads for CPU-intensive compression

3. **Progress Reporting**
   - Update progress at most once per 100ms
   - Batch small file updates
   - Use single-line updates in CLI

### Benchmarks to Track
- Time to zip 1000 small files (< 1KB each)
- Time to zip 10 large files (100MB each)
- Memory usage for 1GB total data
- Compression ratio achieved

## Publishing Checklist

1. [ ] Run full test suite with 100% coverage
2. [ ] Lint and format all code with Biome
3. [ ] Build all output formats (ESM, CJS, types)
4. [ ] Test CLI commands locally
5. [ ] Test as dependency in sample project
6. [ ] Verify `bunx zip-json` works correctly
7. [ ] Update README with examples and API docs
8. [ ] Create/update LICENSE.md file
9. [ ] Set version in package.json
10. [ ] Create git tag for version
11. [ ] Run `npm publish`
12. [ ] Test installation from NPM registry
13. [ ] Verify TypeScript types work correctly
14. [ ] Announce release on GitHub