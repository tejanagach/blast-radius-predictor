"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFunctionGraph = buildFunctionGraph;
const ts_morph_1 = require("ts-morph");
function buildFunctionGraph(projectPath) {
    const project = new ts_morph_1.Project({
        tsConfigFilePath: projectPath + "/tsconfig.json"
    });
    const graph = {};
    const sourceFiles = project.getSourceFiles();
    for (const file of sourceFiles) {
        const functions = file.getFunctions();
        for (const fn of functions) {
            const functionName = fn.getName();
            if (!functionName)
                continue;
            const key = `${file.getBaseName()}::${functionName}`;
            graph[key] = [];
            const calls = fn.getDescendantsOfKind(ts_morph_1.ts.SyntaxKind.CallExpression);
            for (const call of calls) {
                const expression = call.getExpression().getText();
                graph[key].push(expression);
            }
        }
    }
    return graph;
}
//# sourceMappingURL=functionAnalyzer.js.map