import fs from "fs"
import path from "path"

export function predictImpactedTests(
  changedFiles: string[],
  projectRoot: string
) {

  const testDir = path.join(projectRoot, "tests")

  if (!fs.existsSync(testDir)) return []

  const tests = fs.readdirSync(testDir)

  const impactedTests: string[] = []

  for (const file of changedFiles) {

    const base = path.basename(file).replace(".ts", "")

    for (const test of tests) {

      if (test.includes(base)) {
        impactedTests.push(test)
      }

    }

  }

  return impactedTests
}