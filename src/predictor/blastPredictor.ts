export function predictBlastRadius(
  changedFiles: string[],
  graph: Record<string, string[]>
) {

  const impacted = new Set<string>()
  const queue = [...changedFiles]

  while (queue.length > 0) {

    const current = queue.shift()

    for (const file in graph) {

      const imports = graph[file]

      for (const imp of imports || []) {

        if (current && (imp.includes(current) || current.includes(imp))) {

          if (!impacted.has(file)) {
            impacted.add(file)
            queue.push(file)
          }

        }

      }

    }

  }

  return Array.from(impacted)
}