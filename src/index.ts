import { getPullRequestDiff, commentOnPR, addPRLabel } from "./github/githubClient";
import { extractChangedFiles } from "./diff/diffParser";
import { buildDependencyGraph } from "./dependency/dependencyAnalyzer";
import { predictBlastRadius } from "./predictor/blastPredictor";
import { buildFunctionGraph } from "./functionAnalysis/functionAnalyzer";
import { predictFunctionImpact } from "./predictor/functionBlastPredictor";
import { calculateRiskScore } from "./risk/riskAnalyzer";
import { predictImpactedTests } from "./testImpact/testImpactAnalyzer";
import { generateReport } from "./report/reportGenerator";
import { SemanticAnalyzer } from "./llm/semanticAnalyzer";
import path from "path";

async function main() {
  const repoFull = process.env.REPO || "facebook/react";
  const parts = repoFull.split("/");
  const owner = parts[0] ?? "facebook";
  const repo = parts[1] ?? "react";
  const prNumber = Number(process.env.PR_NUMBER);
  
  let changedFiles: string[] = [];
  let diffContent = "";

  const isLocal = process.env.LOCAL_TEST === 'true' || isNaN(prNumber);

  if (isLocal) {
    console.log("--- Running in Local Test Mode ---");
    changedFiles = [path.join(process.cwd(), "src/paymentService.ts")];
    diffContent = "// small refactor\nconst x = 10;";
  } else {
    try {
      diffContent = await getPullRequestDiff(owner, repo, prNumber);
      changedFiles = extractChangedFiles(diffContent).map(f => path.resolve(process.cwd(), f));
    } catch (e) {
      console.error("Failed to fetch PR diff", e);
      process.exit(1);
    }
  }

  console.log("Changed Files:", changedFiles);

  console.log("-> Building Dependency Graph...");
  const graph = buildDependencyGraph(process.cwd());

  console.log("-> Building Function Call Graph...");
  const functionGraph = buildFunctionGraph(process.cwd());

  console.log("-> Predicting Impact...");
  const impacted = predictBlastRadius(changedFiles, graph);
  const impactedFunctions = predictFunctionImpact(changedFiles, functionGraph);

  console.log("-> Analyzing Test Coverage Impact...");
  const testImpact = predictImpactedTests(changedFiles, process.cwd());

  console.log("-> Running LLM Semantic Analysis...");
  const semanticAnalyzer = new SemanticAnalyzer(); // Uses Dummy/Fallback if no actual api key is provided yet
  const semanticImpact = await semanticAnalyzer.analyzePrDiff(diffContent);

  console.log("-> Calculating Risk Score...");
  const risk = calculateRiskScore(impacted, impactedFunctions, semanticImpact, process.cwd());

  console.log("-> Generating Report...");
  const report = generateReport(
    changedFiles, 
    impacted, 
    impactedFunctions, 
    risk, 
    testImpact, 
    semanticImpact,
    functionGraph
  );

  if (isLocal) {
    console.log("\n--- LOCAL TEST REPORT ---\n");
    console.log(report);
  } else if (owner && repo && prNumber) {
    console.log("-> Publishing to GitHub...");
    try {
      // Post comment
      await commentOnPR(owner, repo, prNumber, report);
      
      // Label the PR
      await addPRLabel(owner, repo, prNumber, `RISK:${risk.riskLevel}`);
      
      // Enforce Decisions
      if (risk.decision === "BLOCK") {
        console.error("🚨 PR BLOCKED: Risk level is too high or breaking changes detected.");
        process.exit(1); // Fails the CI Process
      }
    } catch (err) {
      console.error("⚠️ Unable to interact completely with GitHub (permission issue)", err);
    }
  }

  console.log("✅ Analysis Complete.");
}

main();
