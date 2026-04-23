export function generateMermaidGraph(
  changedFiles: string[],
  impactedDependencies: string[],
  functionCalls: Record<string, string[]>,
  impactedFunctions: string[] = Object.keys(functionCalls)
): string {
  let mermaid = "```mermaid\ngraph TD;\n\n";

  const definedNodes = new Set<string>();
  const definedEdges = new Set<string>();
  const fileNodes = new Set<string>();

  // Helper 1: Parse identifiers
  const parseFn = (fnString: string) => {
    const parts = fnString.split("::");
    return {
      fileName: parts[0] || "",
      functionName: parts[1] || fnString
    };
  };

  const isIrrelevant = (node: string) => {
    const s = node.toLowerCase();
    return (
      s.includes("lib_") ||
      s.includes("lib.") ||
      s.includes("node_modules") ||
      s.includes("process") ||
      s.includes("console") ||
      s.includes("ts_morph") ||
      s.includes("d_ts") ||
      s.includes("@types") ||
      s.includes(".d.ts")
    );
  };

  const getCleanName = (filePath: string) => filePath.split('/').pop() || filePath;
  const getSafeId = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '_');

  // Node Helpers
  const createFileNode = (id: string, label: string, isChanged: boolean): string => {
    if (definedNodes.has(id)) return "";
    definedNodes.add(id);
    const style = isChanged ? ":::changed" : "";
    return `  ${id}["${label}"]${style}\n`;
  };

  const createFunctionNode = (id: string, label: string): string => {
    if (definedNodes.has(id)) return "";
    definedNodes.add(id);
    return `  ${id}(("${label}"))\n`;
  };

  // --- NODE CREATION FIRST ---

  // 1. Plot Changed Files
  mermaid += "  subgraph Changed Files\n";
  for (const file of changedFiles) {
    const filename = getCleanName(file);
    if (!isIrrelevant(filename)) {
      const safeId = getSafeId(filename);
      fileNodes.add(safeId);
      mermaid += createFileNode(safeId, filename, true);
    }
  }
  mermaid += "  end\n\n";

  // 2. Plot Impacted Files
  if (impactedDependencies.length > 0) {
    mermaid += "  subgraph Impacted Files\n";
    for (const file of impactedDependencies) {
      if (changedFiles.includes(file)) continue;
      const filename = getCleanName(file);
      if (!isIrrelevant(filename)) {
        const safeId = getSafeId(filename);
        fileNodes.add(safeId);
        mermaid += createFileNode(safeId, filename, false);
      }
    }
    mermaid += "  end\n\n";
  }

  // 3. Gather & Create Impacted Function Nodes
  const validFunctions = new Set<string>();

  for (const fn of impactedFunctions) {
    const { fileName, functionName } = parseFn(fn);
    if (isIrrelevant(fileName) || isIrrelevant(functionName)) continue;

    const safeFileId = getSafeId(getCleanName(fileName));
    const safeFnId = getSafeId(functionName);
    
    // Constraint: Only map functions directly inside valid changed/impacted files
    if (fileNodes.has(safeFileId)) {
      mermaid += createFunctionNode(safeFnId, functionName);
      validFunctions.add(fn); // Store signature of successfully plotted fn
    }
  }
  mermaid += "\n";

  // --- EDGE DEFINITION SECOND ---

  // 4. Function Ownership Links (file ---|contains| function)
  for (const fn of validFunctions) {
    const { fileName, functionName } = parseFn(fn);
    const safeFileId = getSafeId(getCleanName(fileName));
    const safeFnId = getSafeId(functionName);

    const edge = `${safeFileId} ---|contains| ${safeFnId}`;
    if (!definedEdges.has(edge)) {
      definedEdges.add(edge);
      mermaid += `  ${edge}\n`;
    }
  }
  mermaid += "\n";

  // 5. Function Call Edges & Uses Links (Core Feature)
  for (const srcFn of validFunctions) {
    const srcParts = parseFn(srcFn);
    const safeSrcId = getSafeId(srcParts.functionName);

    const targets = functionCalls[srcFn] || [];
    for (const target of targets) {
      if (isIrrelevant(target)) continue;

      const targetClean = getCleanName(target);
      const safeTargetId = getSafeId(targetClean);

      if (safeSrcId === safeTargetId) continue;

      // Ensure depth is strictly limited to known entities
      if (fileNodes.has(safeTargetId)) {
        // Edge case: Function explicitly maps to an execution script or parent file usage
        const edge = `${safeSrcId} -->|uses| ${safeTargetId}`;
        if (!definedEdges.has(edge)) {
          definedEdges.add(edge);
          mermaid += `  ${edge}\n`;
        }
      } else if (definedNodes.has(safeTargetId)) {
        // Target points directly to another user-defined function properly registered
        const edge = `${safeSrcId} -.->|calls| ${safeTargetId}`;
        if (!definedEdges.has(edge)) {
          definedEdges.add(edge);
          mermaid += `  ${edge}\n`;
        }
      }
    }
  }

  mermaid += "\n  classDef changed fill:#f96,stroke:#333,stroke-width:2px;\n";
  mermaid += "```";

  return mermaid;
}
