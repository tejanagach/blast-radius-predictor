export function calculateRiskScore(
  impactedFiles: string[],
  impactedFunctions: string[]
) {

  const fileWeight = impactedFiles.length * 2
  const functionWeight = impactedFunctions.length

  const score = fileWeight + functionWeight

  let level = "LOW"

  if (score > 10) level = "HIGH"
  else if (score > 4) level = "MEDIUM"

  return {
    score,
    level
  }
}