"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const githubClient_1 = require("./github/githubClient");
const diffParser_1 = require("./diff/diffParser");
const dependencyAnalyzer_1 = require("./dependency/dependencyAnalyzer");
const blastPredictor_1 = require("./predictor/blastPredictor");
const reportGenerator_1 = require("./report/reportGenerator");
const functionAnalyzer_1 = require("./functionAnalysis/functionAnalyzer");
const functionBlastPredictor_1 = require("./predictor/functionBlastPredictor");
const riskAnalyzer_1 = require("./risk/riskAnalyzer");
const path_1 = __importDefault(require("path"));
async function main() {
    const repoFull = process.env.REPO || "facebook/react";
    const parts = repoFull.split("/");
    const owner = parts[0] ?? "facebook";
    const repo = parts[1] ?? "react";
    const prNumber = Number(process.env.PR_NUMBER || 27000);
    const diff = await (0, githubClient_1.getPullRequestDiff)(owner, repo, prNumber);
    const changedFiles = (0, diffParser_1.extractChangedFiles)(diff).map(f => path_1.default.resolve(process.cwd(), f));
    console.log("Changed Files:");
    console.log(changedFiles);
    const graph = (0, dependencyAnalyzer_1.buildDependencyGraph)(process.cwd());
    const functionGraph = (0, functionAnalyzer_1.buildFunctionGraph)(process.cwd());
    console.log("\nFunction Graph:");
    console.log(functionGraph);
    const impacted = (0, blastPredictor_1.predictBlastRadius)(changedFiles, graph);
    const impactedFunctions = (0, functionBlastPredictor_1.predictFunctionImpact)(changedFiles, functionGraph);
    const risk = (0, riskAnalyzer_1.calculateRiskScore)(impacted, impactedFunctions);
    const report = (0, reportGenerator_1.generateReport)(changedFiles, impacted, risk.level);
    console.log("\nRisk Score:");
    console.log(risk);
    console.log("\nFunction Level Impact:");
    console.log(impactedFunctions);
    console.log(report);
    if (owner && repo && prNumber) {
        try {
            await (0, githubClient_1.commentOnPR)(owner, repo, prNumber, report);
        }
        catch (err) {
            console.log("⚠️ Unable to comment on PR (permission issue)");
        }
    }
}
main();
//# sourceMappingURL=index.js.map