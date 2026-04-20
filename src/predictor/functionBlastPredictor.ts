export function predictFunctionImpact(
  changedFiles: string[],
  functionGraph: Record<string, string[]>
) {

  const impactedFunctions = new Set<string>()

  for (const fn in functionGraph) {

    for (const call of functionGraph[fn] || []) {

      for (const file of changedFiles) {

        if (fn.includes(file.split("/").pop() || "")) {
          impactedFunctions.add(fn)
        }

        if (call.includes(file.split("/").pop() || "")) {
          impactedFunctions.add(fn)
        }

      }

    }

  }

  return Array.from(impactedFunctions)
}