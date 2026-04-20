import { Project } from "ts-morph"

export function buildDependencyGraph(projectPath: string) {

  const project = new Project({
    tsConfigFilePath: projectPath + "/tsconfig.json"
  })

  const graph: Record<string, string[]> = {}

  const sourceFiles = project.getSourceFiles()

  for (const file of sourceFiles) {

    const filePath = file.getFilePath()

    graph[filePath] = []

    const imports = file.getImportDeclarations()

    for (const imp of imports) {
      const sourceFile = imp.getModuleSpecifierSourceFile()
      if (sourceFile) {
        graph[filePath].push(sourceFile.getFilePath())
      } else {
        graph[filePath].push(imp.getModuleSpecifierValue())
      }
    }

  }

  return graph
}
