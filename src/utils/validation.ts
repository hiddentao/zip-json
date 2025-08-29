export function validatePatterns(patterns: string[]): void {
  if (!patterns || !Array.isArray(patterns)) {
    throw new Error("patterns must be an array of strings")
  }

  if (patterns.length > 0) {
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i]
      if (typeof pattern !== "string") {
        throw new Error(
          `patterns[${i}] must be a string, got ${typeof pattern}`,
        )
      }
      if (pattern.trim() === "") {
        throw new Error(`patterns[${i}] must be a non-empty string`)
      }
    }
  }
}
