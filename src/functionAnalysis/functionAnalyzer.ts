import { Project, ts } from "ts-morph"

export function buildFunctionGraph(projectPath: string) {

  const project = new Project({
    tsConfigFilePath: projectPath + "/tsconfig.json"
  })

  const graph: Record<string, string[]> = {}

  const sourceFiles = project.getSourceFiles()

  for (const file of sourceFiles) {

    const functions = file.getFunctions()

    for (const fn of functions) {

      const functionName = fn.getName()

      if (!functionName) continue

      const key = `${file.getBaseName()}::${functionName}`

      graph[key] = []

      const calls = fn.getDescendantsOfKind(
        ts.SyntaxKind.CallExpression
      )

      for (const call of calls) {

        const expression = call.getExpression().getText()

        graph[key].push(expression)

      }

    }

  }

  return graph
}