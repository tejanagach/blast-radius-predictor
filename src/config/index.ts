import fs from 'fs';
import path from 'path';

export interface AppConfig {
  criticalPaths: string[];
  riskThresholds: {
    high: number;
    medium: number;
  };
  weights: {
    files: number;
    functions: number;
    criticalPathMultiplier: number;
    dependencyDepth: number;
  };
}

export function loadConfig(projectPath: string): AppConfig {
  const configPath = path.join(projectPath, 'config', 'default.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as AppConfig;
  }
  
  // Default fallback
  return {
    criticalPaths: [],
    riskThresholds: { high: 75, medium: 40 },
    weights: { files: 2, functions: 1, criticalPathMultiplier: 1.5, dependencyDepth: 1.2 }
  };
}
