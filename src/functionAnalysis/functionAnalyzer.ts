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

        const expression = call.getExpression()
        graph[key].push(expression.getText())

        // Also record the source file of the called function to help with cross-file impact analysis
        try {
          const symbol = expression.getSymbol() || expression.getType().getSymbol()
          if (symbol) {
            const aliased = symbol.getAliasedSymbol()
            const actualSymbol = aliased || symbol
            const declarations = actualSymbol.getDeclarations()
            for (const decl of declarations) {
              const sourceFile = decl.getSourceFile();
              if (!sourceFile.getFilePath().includes("node_modules") && !sourceFile.getFilePath().includes("lib.") && !sourceFile.getFilePath().includes("@types")) {
                graph[key].push(sourceFile.getBaseName());
              }
            }
          }
        } catch (e) {
          // Symbol resolution might fail if types are not fully loaded
        }

      }

    }

  }

  return graph
}