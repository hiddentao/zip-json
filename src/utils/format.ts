export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  const value = bytes / Math.pow(k, i)
  const formattedValue = i === 0 ? value.toString() : value.toFixed(1)

  return `${formattedValue} ${sizes[i]}`
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleString()
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}

export function formatPath(path: string, maxLength: number = 50): string {
  if (path.length <= maxLength) {
    return path
  }

  const parts = path.split("/")
  if (parts.length <= 2) {
    return `...${path.slice(-(maxLength - 3))}`
  }

  let result = parts[0]
  let remaining = parts.slice(1)

  while (remaining.length > 1) {
    const testResult = result + "/.../" + remaining[remaining.length - 1]
    if (testResult.length > maxLength) {
      break
    }
    const shifted = remaining.shift()
    if (shifted) {
      result += "/" + shifted
    }
  }

  if (remaining.length > 0) {
    const lastPart = remaining[remaining.length - 1]
    if (lastPart) {
      const finalResult = result + "/.../" + lastPart
      if (finalResult.length > maxLength) {
        return `${parts[0]}/.../${lastPart}`
      }
      result = finalResult
    }
  }

  return result || path
}

export function formatProgress(
  current: number,
  total: number,
  prefix: string = "",
): string {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  const bar = createProgressBar(percentage)
  const counts = `${current}/${total}`

  return `${prefix}${bar} ${percentage}% (${counts})`
}

function createProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width)
  const empty = width - filled

  return `[${"=".repeat(filled)}${" ".repeat(empty)}]`
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const pluralForm = plural || `${singular}s`
  return count === 1 ? singular : pluralForm
}
