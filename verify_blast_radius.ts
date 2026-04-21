import { extractChangedFiles } from "./src/diff/diffParser";
import { buildDependencyGraph } from "./src/dependency/dependencyAnalyzer";
import { predictBlastRadius } from "./src/predictor/blastPredictor";
import { generateReport } from "./src/report/reportGenerator";
import { buildFunctionGraph } from "./src/functionAnalysis/functionAnalyzer";
import { predictFunctionImpact } from "./src/predictor/functionBlastPredictor";
import { calculateRiskScore } from "./src/risk/riskAnalyzer";
import { predictImpactedTests } from "./src/testImpact/testImpactAnalyzer";
import path from "path";

async function verify() {
  const demoRoot = path.resolve(process.cwd(), "demo");
  
  // Simulate a change in paymentService.ts
  const changedFiles = [path.resolve(demoRoot, "src/paymentService.ts")];
  
  console.log("--- Blast Radius Verification ---");
  console.log("Changed Files:", changedFiles.map(f => path.relative(demoRoot, f)));

  // 1. Build Dependency Graph
  const graph = buildDependencyGraph(demoRoot);
  
  // 2. Build Function Graph
  const functionGraph = buildFunctionGraph(demoRoot);
  console.log("\nFunction Graph for debugging:");
  console.log(JSON.stringify(functionGraph, null, 2));

  // 3. Predict Impacted Files
  const impactedFiles = predictBlastRadius(changedFiles, graph);
  
  // 4. Predict Impacted Functions
  const impactedFunctions = predictFunctionImpact(changedFiles, functionGraph);
  
  // 5. Predict Impacted Tests
  const impactedTests = predictImpactedTests(changedFiles, demoRoot);
  
  // 6. Calculate Risk
  const risk = calculateRiskScore(impactedFiles, impactedFunctions);
  
  // 7. Generate Report
  const report = generateReport(changedFiles, impactedFiles, impactedFunctions, risk.level, impactedTests);

  console.log("\nBlast Radius Report:");
  console.log(report);

  // Verification
  const detectedImpactedFile = impactedFiles.some(f => f.includes("checkoutService.ts"));
  const detectedImpactedFunction = impactedFunctions.some(f => f.includes("createCheckout"));
  const detectedImpactedTest = impactedTests.some(f => f.includes("paymentService.test.ts"));

  console.log("\n--- Verification Results ---");
  console.log(`Detected checkoutService.ts: ${detectedImpactedFile ? "✅" : "❌"}`);
  console.log(`Detected createCheckout function: ${detectedImpactedFunction ? "✅" : "❌"}`);
  console.log(`Detected paymentService.test.ts: ${detectedImpactedTest ? "✅" : "❌"}`);

  if (detectedImpactedFile && detectedImpactedFunction && detectedImpactedTest) {
    console.log("\nSUCCESS: All impacted elements correctly identified.");
  } else {
    console.log("\nFAILURE: Some impacted elements were missed.");
  }
}

verify().catch(console.error);
