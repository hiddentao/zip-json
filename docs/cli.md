# CLI Documentation

This document provides comprehensive documentation for the zip-json command-line interface.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Global Options](#global-options)
- [Examples](#examples)
- [Configuration](#configuration)

## Installation

```bash
# Install globally
bun add -g @hiddentao/zip-json
# or
npm install -g @hiddentao/zip-json

# Or run directly with bunx/npx
bunx @hiddentao/zip-json --help
npx @hiddentao/zip-json --help
```

## Quick Start

```bash
# Zip files to JSON
zip-json zip "src/**/*.ts" -o backup.json

# Unzip from JSON
zip-json unzip backup.json -o extracted/

# List archive contents
zip-json list backup.json
```

## Commands

### `zip`

Creates a compressed archive from files matching the given patterns.

**Syntax:**
```bash
zip-json zip <patterns...> [options]
```

**Arguments:**
- `patterns` - One or more glob patterns to match files

**Options:**
- `-o, --output <file>` - Output file path (required)
- `-b, --base-dir <dir>` - Base directory for relative paths
- `-i, --ignore <patterns...>` - Patterns to ignore (can be used multiple times)
- `--progress` - Show progress bar
- `--verbose` - Verbose output

**Examples:**
```bash
# Basic usage
zip-json zip "src/**/*.ts" -o code.json

# Multiple patterns with base directory
zip-json zip "src/**/*.ts" "*.md" -b ./project -o backup.json

# With ignore patterns
zip-json zip "**/*" -i "node_modules/**" "*.log" -o clean-backup.json

# With progress and verbose output
zip-json zip "src/**/*" -o large-backup.json --progress --verbose

# Silent operation for scripts
zip-json zip "src/**/*" -o backup.json --quiet
```

### `unzip`

Extracts files from a compressed archive.

**Syntax:**
```bash
zip-json unzip <archive> [options]
```

**Arguments:**
- `archive` - Path to the archive file

**Options:**
- `-o, --output-dir <dir>` - Output directory (default: current directory)
- `--overwrite` - Overwrite existing files (default: true)
- `--no-overwrite` - Don't overwrite existing files
- `--preserve-permissions` - Preserve file permissions
- `--progress` - Show progress bar
- `--verbose` - Verbose output

**Examples:**
```bash
# Basic extraction
zip-json unzip backup.json

# Extract to specific directory
zip-json unzip backup.json -o ./restored

# Don't overwrite existing files
zip-json unzip backup.json --no-overwrite

# Preserve permissions with progress
zip-json unzip backup.json --preserve-permissions --progress

# Silent extraction for scripts
zip-json unzip backup.json -o ./restored --quiet
```

### `list`

Lists the contents of an archive without extracting.

**Syntax:**
```bash
zip-json list <archive> [options]
```

**Arguments:**
- `archive` - Path to the archive file

**Options:**
- `--detailed` - Show detailed file information
- `--json` - Output in JSON format
- `--filter <pattern>` - Filter files by pattern

**Examples:**
```bash
# Basic listing
zip-json list backup.json

# Detailed information
zip-json list backup.json --detailed

# JSON output
zip-json list backup.json --json

# Filter by pattern
zip-json list backup.json --filter "*.ts"

# Silent listing (no output)
zip-json list backup.json --quiet
```

## Global Options

These options are available for all commands:

- `-h, --help` - Show help information
- `-V, --version` - Show version number
- `--no-color` - Disable colored output
- `--quiet` - Suppress all output except errors

**Examples:**
```bash
# Show version
zip-json --version

# Get help for a command
zip-json zip --help

# Run without colors
zip-json list backup.json --no-color

# Run silently (useful in scripts)
zip-json zip "src/**/*" -o backup.json --quiet
```

## Examples

### Basic File Archiving

```bash
# Archive TypeScript source files
zip-json zip "src/**/*.ts" "types/**/*.d.ts" -o code-backup.json

# Archive with exclusions
zip-json zip "**/*" -i "node_modules/**" "dist/**" "*.log" -o project-backup.json

# Archive from specific directory
zip-json zip "**/*" -b ./my-project -o my-project-backup.json
```

### Extracting Archives

```bash
# Extract to current directory
zip-json unzip code-backup.json

# Extract to specific directory
zip-json unzip code-backup.json -o ./restored-code

# Extract without overwriting
zip-json unzip code-backup.json -o ./safe-restore --no-overwrite
```

### Inspecting Archives

```bash
# Quick listing
zip-json list project-backup.json

# Detailed view with file sizes and dates
zip-json list project-backup.json --detailed

# JSON output for programmatic processing
zip-json list project-backup.json --json > archive-contents.json

# Filter specific file types
zip-json list project-backup.json --filter "*.js" --detailed
```

### Progress Tracking

```bash
# Archive large directories with progress
zip-json zip "**/*" -o huge-backup.json --progress

# Extract with progress and verbose output
zip-json unzip huge-backup.json -o ./extracted --progress --verbose
```

### Scripting Examples

```bash
#!/bin/bash

# Backup script
PROJECT_DIR="/path/to/project"
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "Creating backup of $PROJECT_DIR..."
zip-json zip "**/*" \
  -b "$PROJECT_DIR" \
  -i "node_modules/**" ".git/**" "dist/**" "*.log" \
  -o "$BACKUP_DIR/backup_$DATE.json" \
  --progress

echo "Backup created: $BACKUP_DIR/backup_$DATE.json"

# List contents to verify
zip-json list "$BACKUP_DIR/backup_$DATE.json" --detailed
```

```bash
#!/bin/bash

# Restore script
ARCHIVE="$1"
RESTORE_DIR="$2"

if [ -z "$ARCHIVE" ] || [ -z "$RESTORE_DIR" ]; then
  echo "Usage: $0 <archive> <restore-directory>"
  exit 1
fi

echo "Restoring from $ARCHIVE to $RESTORE_DIR..."

# Create restore directory
mkdir -p "$RESTORE_DIR"

# Extract with progress
zip-json unzip "$ARCHIVE" -o "$RESTORE_DIR" --progress --preserve-permissions

echo "Restore completed!"
```

```bash
#!/bin/bash

# Silent backup script for automated systems
PROJECT_DIR="/path/to/project"
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup silently - no output unless error occurs
if zip-json zip "**/*" \
  -b "$PROJECT_DIR" \
  -i "node_modules/**" ".git/**" "dist/**" "*.log" \
  -o "$BACKUP_DIR/backup_$DATE.json" \
  --quiet; then
  
  # Only log on success
  echo "Backup completed successfully: backup_$DATE.json" >> /var/log/backup.log
else
  echo "Backup failed!" >&2
  exit 1
fi
```

## Configuration

### Environment Variables

- `ZIP_JSON_NO_COLOR` - Disable colored output (same as --no-color)
- `ZIP_JSON_QUIET` - Enable quiet mode (same as --quiet)
- `ZIP_JSON_PROGRESS` - Always show progress bars
- `ZIP_JSON_VERBOSE` - Enable verbose output

**Example:**
```bash
# Set environment variables
export ZIP_JSON_PROGRESS=1
export ZIP_JSON_VERBOSE=1

# Now all operations will show progress and verbose output
zip-json zip "src/**/*" -o backup.json
zip-json unzip backup.json -o extracted/
```

### Exit Codes

The CLI uses standard exit codes:

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - File not found
- `4` - Permission denied
- `5` - Invalid archive

**Example:**
```bash
# Check exit code in scripts
zip-json zip "nonexistent/**/*" -o backup.json
if [ $? -eq 3 ]; then
  echo "No files found matching pattern"
fi
```

### Output Formats

#### Standard Output

```
Creating archive from 142 files...
[████████████████████] 100% (142/142) src/utils/format.ts
Archive created: backup.json (2.3 MB compressed, 8.1 MB uncompressed)
```

#### Detailed Listing

```
Archive: backup.json
Created: 2024-01-15T10:30:00.000Z
Files: 142 | Total Size: 8.1 MB

Path                           Size      Modified
src/index.ts                  1.2 KB    2024-01-15T10:25:00Z
src/core/archiver.ts          3.4 KB    2024-01-15T10:20:00Z
src/core/extractor.ts         2.8 KB    2024-01-15T10:18:00Z
...
```

#### JSON Output

```json
{
  "meta": {
    "version": "1.0.0",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "files": [
      {
        "path": "src/index.ts",
        "size": 1234,
        "mode": 33188,
        "isDirectory": false,
        "modifiedAt": "2024-01-15T10:25:00.000Z"
      }
    ],
    "totalSize": 8503421,
    "fileCount": 142
  }
}
```

### Performance Tips

1. **Use specific patterns** instead of `**/*` when possible
2. **Set appropriate ignore patterns** to exclude unnecessary files
3. **Use progress bars** for large operations to monitor progress
4. **Run from SSD storage** for better I/O performance
5. **Use base directory** to avoid deep path traversal

### Troubleshooting

#### Common Issues

**Pattern not matching files:**
```bash
# Use quotes around patterns
zip-json zip "src/**/*.ts" -o backup.json  # ✓ Correct
zip-json zip src/**/*.ts -o backup.json    # ✗ Shell expansion
```

**Permission errors:**
```bash
# Check file permissions
ls -la problem-file.txt

# Run with appropriate permissions
sudo zip-json zip "/system/**/*" -o system-backup.json
```

**Large archives timing out:**
```bash
# Use progress to monitor
zip-json zip "**/*" -o large.json --progress --verbose

# Check available disk space
df -h
```

**Memory issues with very large files:**
```bash
# Archive in smaller chunks
zip-json zip "src/**/*" -o src-backup.json
zip-json zip "docs/**/*" -o docs-backup.json
```