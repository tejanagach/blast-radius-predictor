"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDependencyGraph = buildDependencyGraph;
const ts_morph_1 = require("ts-morph");
function buildDependencyGraph(projectPath) {
    const project = new ts_morph_1.Project({
        tsConfigFilePath: projectPath + "/tsconfig.json"
    });
    const graph = {};
    const sourceFiles = project.getSourceFiles();
    for (const file of sourceFiles) {
        const filePath = file.getFilePath();
        graph[filePath] = [];
        const imports = file.getImportDeclarations();
        for (const imp of imports) {
            const sourceFile = imp.getModuleSpecifierSourceFile();
            if (sourceFile) {
                graph[filePath].push(sourceFile.getFilePath());
            }
            else {
                graph[filePath].push(imp.getModuleSpecifierValue());
            }
        }
    }
    return graph;
}
//# sourceMappingURL=dependencyAnalyzer.js.map