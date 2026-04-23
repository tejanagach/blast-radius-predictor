import { RiskAnalysisResult } from "../risk/riskAnalyzer";
import { TestImpactResult } from "../testImpact/testImpactAnalyzer";
import { SemanticChangeOutput } from "../llm/provider";
import { generateMermaidGraph } from "./graphGenerator";

export function generateReport(
  changedFiles: string[],
  impactedFiles: string[],
  impactedFunctions: string[],
  risk: RiskAnalysisResult,
  testImpact: TestImpactResult,
  semanticImpact: SemanticChangeOutput,
  functionGraph: Record<string, string[]>
): string {

  const visualGraph = generateMermaidGraph(changedFiles, impactedFiles, functionGraph);

  return `
# 🚨 Blast Radius Predictor Report

## 📊 Summary
**Risk Level:** ${risk.riskLevel} (${risk.riskScore} / 100)
**Decision:** \`${risk.decision}\`

### 🧠 LLM Semantic Insight
**Type of Change:** \`${semanticImpact.changeType}\` (Confidence: ${Math.round(semanticImpact.confidence * 100)}%)
**Summary:** ${semanticImpact.summary}

**Identified Risks by LLM:**
${semanticImpact.riskIndicators.length ? semanticImpact.riskIndicators.map(r => `- ${r}`).join("\\n") : "- None detected"}

---

## 🚦 Risk Reasoning
${risk.reasoning.map(r => `- ${r}`).join("\\n")}

---

## 🛠️ Files & Functions Impacted
**Changed Files:**
${changedFiles.map(f => `- ${f.split("/").pop()}`).join("\\n")}

**Impacted Files (${impactedFiles.length}):**
<details>
  <summary>View Impacted Files</summary>
${impactedFiles.length ? impactedFiles.map(f => `- ${f.split("/").pop()}`).join("\\n") : "None"}
</details>

**Impacted Functions (${impactedFunctions.length}):**
<details>
  <summary>View Impacted Functions</summary>
${impactedFunctions.length ? impactedFunctions.map(f => `- ${f}`).join("\\n") : "None"}
</details>

---

## 🧪 Test Coverage Impact
**Coverage Estimate:** ${testImpact.coverageEstimate}%
**Impacted Tests to Run:**
${testImpact.impactedTests.length ? testImpact.impactedTests.map(t => `- ${t.split("/").pop()}`).join("\\n") : "None"}

**Missing Tests for Changed Source Files:**
${testImpact.missingTests.length ? testImpact.missingTests.map(t => `- ⚠️ ${t.split("/").pop()}`).join("\\n") : "None (All changes covered by tests!)"}

---

## 🕸️ Impact Visualization
${visualGraph}
`;
}