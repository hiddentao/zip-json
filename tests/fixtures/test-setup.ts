import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export function createTestProject(baseDir: string) {
  const sourceDir = join(baseDir, "source")

  // Create comprehensive directory structure
  mkdirSync(join(sourceDir, "docs"), { recursive: true })
  mkdirSync(join(sourceDir, "src", "components"), { recursive: true })
  mkdirSync(join(sourceDir, "src", "utils"), { recursive: true })
  mkdirSync(join(sourceDir, "tests"), { recursive: true })
  mkdirSync(join(sourceDir, "config"), { recursive: true })

  // Create various file types
  writeFileSync(
    join(sourceDir, "README.md"),
    "# Project Title\n\nProject description",
  )
  writeFileSync(
    join(sourceDir, "package.json"),
    '{"name": "test-project", "version": "1.0.0"}',
  )
  writeFileSync(join(sourceDir, ".gitignore"), "node_modules/\n*.log")

  // Documentation files
  writeFileSync(join(sourceDir, "docs", "api.md"), "# API Documentation")
  writeFileSync(join(sourceDir, "docs", "setup.md"), "# Setup Guide")

  // Source files
  writeFileSync(
    join(sourceDir, "src", "index.ts"),
    'export * from "./components"',
  )
  writeFileSync(
    join(sourceDir, "src", "components", "Button.tsx"),
    "export const Button = () => <button>Click</button>",
  )
  writeFileSync(
    join(sourceDir, "src", "components", "Input.tsx"),
    "export const Input = () => <input />",
  )
  writeFileSync(
    join(sourceDir, "src", "utils", "helpers.ts"),
    'export const helper = () => "help"',
  )

  // Test files
  writeFileSync(
    join(sourceDir, "tests", "unit.test.ts"),
    'test("example", () => expect(true).toBe(true))',
  )
  writeFileSync(
    join(sourceDir, "tests", "integration.test.ts"),
    'test("integration", () => {})',
  )

  // Config files
  writeFileSync(join(sourceDir, "config", "dev.json"), '{"env": "development"}')
  writeFileSync(join(sourceDir, "config", "prod.json"), '{"env": "production"}')

  return sourceDir
}

export function createSimpleCLIProject(baseDir: string) {
  const sourceDir = join(baseDir, "source")

  // Create directory structure for CLI tests
  mkdirSync(join(sourceDir, "docs"), { recursive: true })
  mkdirSync(join(sourceDir, "src", "components"), { recursive: true })
  mkdirSync(join(sourceDir, "src", "utils"), { recursive: true })
  mkdirSync(join(sourceDir, "tests"), { recursive: true })
  mkdirSync(join(sourceDir, "config"), { recursive: true })

  // Create files for CLI testing
  writeFileSync(join(sourceDir, "README.md"), "# CLI Test Project")
  writeFileSync(join(sourceDir, "package.json"), '{"name": "cli-test"}')
  writeFileSync(join(sourceDir, ".gitignore"), "*.log")

  // Documentation files
  writeFileSync(join(sourceDir, "docs", "guide.md"), "# Guide")

  // Source files
  writeFileSync(
    join(sourceDir, "src", "index.ts"),
    "export const main = () => {}",
  )
  writeFileSync(
    join(sourceDir, "src", "components", "App.tsx"),
    "export const App = () => <div>App</div>",
  )
  writeFileSync(
    join(sourceDir, "src", "utils", "helper.ts"),
    "export const help = () => {}",
  )

  // Test files
  writeFileSync(
    join(sourceDir, "tests", "main.test.ts"),
    'test("main", () => {})',
  )

  // Config files
  writeFileSync(join(sourceDir, "config", "settings.json"), '{"test": true}')

  return sourceDir
}
