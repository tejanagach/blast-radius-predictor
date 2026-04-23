import { SemanticChangeOutput } from "../llm/provider";
import { AppConfig, loadConfig } from "../config";

export interface RiskAnalysisResult {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  decision: "SAFE" | "REVIEW_REQUIRED" | "BLOCK";
  reasoning: string[];
}

const CHANGE_TYPE_WEIGHTS: Record<string, number> = {
  "BREAKING": 40,
  "FEATURE": 15,
  "BUGFIX": 10,
  "REFACTOR": 5,
  "UNKNOWN": 5
};

export function calculateRiskScore(
  impactedFiles: string[],
  impactedFunctions: string[],
  semanticAnalysis?: SemanticChangeOutput,
  projectDir: string = process.cwd()
): RiskAnalysisResult {
  
  const config = loadConfig(projectDir);
  const reasoning: string[] = [];
  let score = 0;

  // 1. Structural Impact (Files & Functions)
  const fileScore = impactedFiles.length * config.weights.files;
  const functionScore = impactedFunctions.length * config.weights.functions;
  
  score += fileScore;
  score += functionScore;

  if (impactedFiles.length > 0) reasoning.push(`Impacts ${impactedFiles.length} file(s) (+${fileScore} pts).`);
  if (impactedFunctions.length > 0) reasoning.push(`Impacts ${impactedFunctions.length} function(s) (+${functionScore} pts).`);

  // 2. Critical Path Boost
  const criticalModules = ["src/payment", "src/auth"];
  let isCriticalImpacted = false;
  
  for (const file of impactedFiles) {
    if (criticalModules.some(mod => file.includes(mod))) {
      isCriticalImpacted = true;
      break;
    }
  }

  if (isCriticalImpacted) {
    score += 25;
    reasoning.push("Critical module impacted (+25 pts).");
  }

  // 3. LLM Semantic Analysis Integration
  if (semanticAnalysis) {
    const confidence = semanticAnalysis.confidence || 0;
    let confidenceMultiplier = 1.0;
    
    if (confidence < 0.4) {
      confidenceMultiplier = 0.4;
    } else if (confidence < 0.7) {
      confidenceMultiplier = 0.7;
    }

    // Change Type Weight
    const typeWeight = CHANGE_TYPE_WEIGHTS[semanticAnalysis.changeType] || CHANGE_TYPE_WEIGHTS["UNKNOWN"]!;
    const scaledTypeScore = typeWeight * confidenceMultiplier;
    score += scaledTypeScore;
    reasoning.push(`LLM classified change as ${semanticAnalysis.changeType} (+${Math.round(scaledTypeScore)} pts, scaled by confidence).`);

    // Risk Indicators Weight
    if (semanticAnalysis.riskIndicators && semanticAnalysis.riskIndicators.length > 0) {
      const indicatorScore = semanticAnalysis.riskIndicators.length * 5;
      const scaledIndicatorScore = indicatorScore * confidenceMultiplier;
      score += scaledIndicatorScore;
      reasoning.push(`${semanticAnalysis.riskIndicators.length} risk indicators detected (+${Math.round(scaledIndicatorScore)} pts, scaled by confidence).`);
    }
  }

  // Final Normalization (Cap at 100)
  score = Math.min(Math.max(score, 0), 100);
  const finalScore = Math.round(score);

  // Decision Matrix
  let riskLevel: RiskAnalysisResult["riskLevel"] = "LOW";
  let decision: RiskAnalysisResult["decision"] = "SAFE";

  if (finalScore >= config.riskThresholds.high) {
    riskLevel = "HIGH";
    decision = "BLOCK";
  } else if (finalScore >= config.riskThresholds.medium) {
    riskLevel = "MEDIUM";
    decision = "REVIEW_REQUIRED";
  } else {
    riskLevel = "LOW";
    decision = "SAFE";
  }

  // Force BLOCK for BREAKING changes regardless of score if confidence is high
  if (semanticAnalysis?.changeType === "BREAKING" && semanticAnalysis.confidence > 0.7) {
    decision = "BLOCK";
    riskLevel = "HIGH";
    reasoning.push("Auto-blocked due to high-confidence BREAKING change.");
  }

  return {
    riskScore: finalScore,
    riskLevel,
    decision,
    reasoning
  };
}