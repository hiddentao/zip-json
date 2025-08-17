# Conventional Commits Setup

This project uses conventional commits with Husky to enforce consistent commit message formatting.

## How to Commit

### Option 1: Using the Interactive Commitizen Tool
```bash
bun run commit
```
This will prompt you with questions to build a proper conventional commit message.

### Option 2: Manual Commit with Conventional Format
```bash
git commit -m "type(scope): description"
```

## Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

## Examples

```bash
feat: add snake power-ups
fix: resolve collision detection bug
docs: update README with new features
style: format code with biome
refactor: simplify game state management
perf: optimize render loop
test: add unit tests for game engine
build: update vite configuration
ci: add github action for testing
chore: update dependencies
```

## Automated Checks

- **Pre-commit**: Runs Biome linting and formatting checks before allowing commits
- **Commit-msg**: Validates commit message format using commitlint

## Rules

- Commit messages must follow conventional commit format
- Maximum header length: 100 characters
- Subject must not be empty
- Subject must not end with a period
- Subject must be in lowercase (except for proper nouns)