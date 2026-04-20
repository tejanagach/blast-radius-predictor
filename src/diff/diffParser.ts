export function extractChangedFiles(diff: string): string[] {

  const lines = diff.split("\n")
  const files: string[] = []

  for (const line of lines) {

    if (line.startsWith("diff --git")) {
      // The line format is usually: diff --git a/path/to/file b/path/to/file
      // We use regex to handle potential spaces or quotes in filenames
      const match = line.match(/^diff --git a\/(.+) b\/(.+)$/)
      if (match && match[2]) {
        let filePath = match[2]
        // Remove quotes if present
        if (filePath.startsWith('"') && filePath.endsWith('"')) {
          filePath = filePath.slice(1, -1)
        }
        files.push(filePath)
      }
    }

  }

  return files
}