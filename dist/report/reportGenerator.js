"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = generateReport;
function generateReport(changedFiles, impactedFiles, riskLevel) {
    return `
🚨 **Blast Radius Report**

### Changed Files
${changedFiles.map(f => `- ${f}`).join("\n")}

### Impacted Files
${impactedFiles.length ? impactedFiles.map(f => `- ${f}`).join("\n") : "None"}

Risk Level: ${riskLevel}`;
}
//# sourceMappingURL=reportGenerator.js.map