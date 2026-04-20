"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictFunctionImpact = predictFunctionImpact;
function predictFunctionImpact(changedFiles, functionGraph) {
    const impactedFunctions = new Set();
    for (const fn in functionGraph) {
        for (const call of functionGraph[fn] || []) {
            for (const file of changedFiles) {
                if (fn.includes(file.split("/").pop() || "")) {
                    impactedFunctions.add(fn);
                }
                if (call.includes(file.split("/").pop() || "")) {
                    impactedFunctions.add(fn);
                }
            }
        }
    }
    return Array.from(impactedFunctions);
}
//# sourceMappingURL=functionBlastPredictor.js.map