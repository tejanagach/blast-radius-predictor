import fs from "fs";
import path from "path";
import { Project } from "ts-morph";

export interface TestImpactResult {
  impactedTests: string[];
  missingTests: string[];
  coverageEstimate: number;
}

export function predictImpactedTests(
  changedFiles: string[],
  projectRoot: string
): TestImpactResult {

  const testDir = path.join(projectRoot, "tests");
  const impactedTests: string[] = [];
  const missingTests: string[] = [];

  if (!fs.existsSync(testDir)) {
    return {
      impactedTests: [],
      missingTests: changedFiles,
      coverageEstimate: 0
    };
  }

  // Load test files in AST
  const project = new Project({
    tsConfigFilePath: path.join(projectRoot, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true
  });
  
  // Read all test files
  const readAllFiles = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) results = results.concat(readAllFiles(file));
      else results.push(file);
    });
    return results;
  };

  const testFilesPaths = readAllFiles(testDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  project.addSourceFilesAtPaths(testFilesPaths);

  const testFiles = project.getSourceFiles();

  // For each changed file, let's see which tests import it
  for (const changedFile of changedFiles) {
    const changedFileName = path.basename(changedFile, path.extname(changedFile));
    let hasTest = false;

    // Advanced tracking via exact imports
    for (const testFile of testFiles) {
      const imports = testFile.getImportDeclarations();
      for (const imp of imports) {
        const sourceFile = imp.getModuleSpecifierSourceFile();
        if (sourceFile && sourceFile.getFilePath() === changedFile) {
          impactedTests.push(testFile.getFilePath());
          hasTest = true;
        } else if (imp.getModuleSpecifierValue().includes(changedFileName)) {
           // fallback heuristics if full resolution fails
           impactedTests.push(testFile.getFilePath());
           hasTest = true;
        }
      }
    }

    if (!hasTest) {
      missingTests.push(changedFile);
    }
  }

  // Calculate coverage estimate
  const totalChanged = changedFiles.length;
  const coverageEstimate = totalChanged === 0 ? 100 : Math.round(((totalChanged - missingTests.length) / totalChanged) * 100);

  return {
    // Unique list of impacted tests
    impactedTests: [...new Set(impactedTests)],
    missingTests: [...new Set(missingTests)],
    coverageEstimate
  };
}