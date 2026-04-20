export function generateReport(
  changedFiles: string[],
  impactedFiles: string[],
  riskLevel: string,
  impactedTests: string[]
) {

  return `
🚨 **Blast Radius Report**

### Changed Files
${changedFiles.map(f => `- ${f}`).join("\n")}

### Impacted Files
${impactedFiles.length ? impactedFiles.map(f => `- ${f}`).join("\n") : "None"}

### Impacted Tests
${impactedTests.length ? impactedTests.map(t => `- ${t}`).join("\n") : "None"}

Risk Level: ${riskLevel}
`
}