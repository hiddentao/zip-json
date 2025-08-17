# Claude AI Development Rules

## Coding Guidelines

### General Principles

- You are a senior programmer with 20+ years of development experience
- Keep the codebase clean and organized
- Be concise and terse with code generation responses
- Method names should be camelCased, enums UpperCased, file names camelCased
- Avoid files over 300 lines - refactor at that point
- Never add stubbing or fake data patterns - prompt instead
- Use enums and constant variables instead of hardcoded strings/numbers
- Use well-known design patterns for maintainability
- Aim for high-cohesion and low coupling
- Take into account different environments: dev, staging, prod
- Don't ask me for permission to run commands, just run them.
- When changes deviate from implementation spec, show details and ask before proceeding
- When thinking is required, confirm execution steps before proceeding
- Don't introduce new patterns/technologies without exhausting existing options
- Only make requested changes unless very confident about related changes
- If rules conflict, ask for clarity before proceeding

### Development Workflow

- Follow all the docs in `.devdocs/`:
  - [spec.md](.devdocs/spec.md) is the detailed project spec.
  - [implementation.md](.devdocs/implementation.md) contains details on the current codebase implementation.
  - [conventional-commits.md](.devdocs/conventional-commits.md) contains details on how to format commit messages.
- Before making any changes, refer to the files in the `.devdocs/` folder.
- When updating docs, incorporate changes into `.devdocs/`, especially implementation.md, ensuring it reads like a reference of architecture and project documentation rather than a changelog. So don't make entries which look like a changelog entry.
- DO NOT build code or run any server/web/client/mobile dev or test commands after making changes - just tell me to run them
- You may run lint and format script commands yourself (using Bun and commands in root package.json).
- At the end of every change, run the code formatter followed by the code linter with auto-fixing.
- Once you've made changes, check for redundant code that can be removed.
- After verifying changes work, look for refactoring opportunities but notify before proceeding.

### Code Quality

- Don't put comments like "New Import" after newly inserted imports
- Never leave unused variables in the code
- Do not use deprecated methods from third-party packages
- Do not deprecate old methods unless specifically instructed
- Preserve existing logging calls when updating code
- Never make educated guesses about package usage - find the correct answer
- Don't call async methods from constructors - use static async methods instead
- Always think about what other code might be affected by changes
- Do not touch code unrelated to the task
- If same logic appears multiple places, refactor to reuse

### Environment & Security

- Never overwrite .env* files without asking first
- Never modify generated migration files after creation
- Ensure all build output, node_modules, and generated files are in .gitignore

## TypeScript & JavaScript

- Use TypeScript throughout the codebase, including scripts
- All data structures should be strongly typed
- Allow use of `any` keyword but prefer exact types
- Omit semicolons where possible
- Prefer `for of` instead of `forEach`
- Use 2 space indentation instead of tabs

## Package Management (Bun)

- Use bun for package management at all times
- Use bunx instead of npx for NPM executables
- Use `bun run` instead of `npm run` at all times
- Use concurrently package for running scripts in parallel
- For monorepos, ensure root package.json has commands for all packages

## React.js

- Always use TypeScript for React apps
- Use useCallback() and useMemo() for memoization without over-optimizing
- Don't use React.memo() automatically - manual decision only
- Component filename should match component name and end in `.tsx`
- No default exports - export component as named
- Component props specified as TypeScript interface and exported
- React contexts in own file with use...Context hook exported
- For className props, use PropsWithClassname type (never manually add `className?: string`)
- For dynamic className content, use cn() utility method

## Testing

- Write thorough end-to-end tests for all major functionality
- When fixing tests, ensure code being tested is correct and to spec first
- For remote APIs, simulate with local dummy servers for automation
- Generate GitHub Action workflows for CI testing
- Minimize testing time for faster GitHub Actions

## Linting & Formatting (Biome)

- Single biome.json in root folder for entire codebase
- Root package.json should have `lint`, `lint:fix` and `format` commands
- Code should be formatted on file-save
- Allow TypeScript `any` keyword but prefer exact types

## Git & Version Control

- Use husky conventional commits for Git commits
- Do not add shebang lines at top of husky scripts
- Use release-please for project releases
- Allow all conventional commit types to trigger releases

## Database (Drizzle ORM)

- Never create migrations manually - use Drizzle Kit
- Use `bun drizzle-kit generate` for migrations
- Use `bun drizzle-kit push` to apply migrations
- Use explicit column types and constraints
- Add appropriate indexes for query optimization
- Migration naming: `add_`, `remove_`, `alter_`, `rename_` prefixes
- Never modify generated migration files after creation

## Styling

### Tailwind CSS

- Check docs at https://tailwindcss.com/docs for errors
- Always use cn() utility function for combining class names
- Never use template string interpolation for className values
- Example:
  ```tsx
  // GOOD: className={cn("base-class", condition && "conditional-class")}
  // BAD: className={`base-class ${condition ? "conditional-class" : ""}`}
  ```

### DaisyUI

- daisyUI 5 docs at http://daisyui.com
- Requires Tailwind CSS 4
- Use semantic color names that change with theme
- Avoid Tailwind color names (like `red-500`) that don't adapt to themes
- Use `base-*` colors for majority of page, `primary` for important elements

### ShadCN UI

- Documentation at https://ui.shadcn.com/docs

## PIXI.js

- Check package.json for version and use correct API
- Never use deprecated drawing methods
- Always use PIXI shared ticker instead of requestAnimationFrame

## Third-Party Packages

- Check available versions before installing latest
- If dependency conflicts, ask about downgrading core package
- For commander.js: global help options should show for all commands


