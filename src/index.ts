import { getPullRequestDiff, commentOnPR } from "./github/githubClient"
import { extractChangedFiles } from "./diff/diffParser"
import { buildDependencyGraph } from "./dependency/dependencyAnalyzer"
import { predictBlastRadius } from "./predictor/blastPredictor"
import { generateReport } from "./report/reportGenerator"
import { buildFunctionGraph } from "./functionAnalysis/functionAnalyzer"
import { predictFunctionImpact } from "./predictor/functionBlastPredictor"
import { calculateRiskScore } from "./risk/riskAnalyzer"
import { predictImpactedTests } from "./testImpact/testImpactAnalyzer"
import path from "path"

async function main() {

  const repoFull = process.env.REPO || "facebook/react"
  const parts = repoFull.split("/")
  const owner = parts[0] ?? "facebook"
  const repo = parts[1] ?? "react"
  const prNumber = Number(process.env.PR_NUMBER || 27000)

  const diff = await getPullRequestDiff(owner, repo, prNumber)
 
  const changedFiles = extractChangedFiles(diff).map(f => path.resolve(process.cwd(), f))
  console.log("Changed Files:")
  console.log(changedFiles)

  const graph = buildDependencyGraph(process.cwd())

  const functionGraph = buildFunctionGraph(process.cwd())
  console.log("\nFunction Graph:")
  console.log(functionGraph)

  const impacted = predictBlastRadius(changedFiles, graph)
  const impactedFunctions = predictFunctionImpact(
    changedFiles,
    functionGraph
  )
  const risk = calculateRiskScore(impacted, impactedFunctions)
  const impactedTests = predictImpactedTests(
  changedFiles,
  process.cwd()
)
  const report = generateReport(changedFiles, impacted, risk.level,impactedTests)

  console.log("\nImpacted Tests:")
  console.log(impactedTests)
  console.log("\nRisk Score:")
  console.log(risk)

  console.log("\nFunction Level Impact:")
  console.log(impactedFunctions)
 
  console.log(report)
 
  if (owner && repo && prNumber) {
    try {
      await commentOnPR(owner, repo, prNumber, report)
    } catch (err) {
      console.log("⚠️ Unable to comment on PR (permission issue)")
    }
  }

}

main()
