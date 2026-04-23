import { GoogleGenAI } from "@google/genai";

export interface SemanticAnalysisResult {
  changeType: "BREAKING" | "REFACTOR" | "FEATURE" | "BUGFIX" | "UNKNOWN";
  riskIndicators: string[];
  summary: string;
  confidence: number;
}

// Backwards compatibility for existing imports in other modules
export type SemanticChangeOutput = SemanticAnalysisResult;

export interface LLMProvider {
  name: string;
  analyzeDiff(diff: string): Promise<SemanticAnalysisResult>;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class GeminiLLMProvider implements LLMProvider {
  name = "GeminiProvider";
  private ai: GoogleGenAI;
  private readonly PRIMARY_MODEL = "gemini-3-flash-preview";
  private readonly FALLBACK_MODEL = "gemini-2.5-flash"; // User requested 2.5 flash only
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  private isRetryableError(error: any): boolean {
    const message = (error?.message || "").toLowerCase();
    const status = error?.status || error?.response?.status;
    
    // Retry on 503 or common network errors
    return (
      status === 503 ||
      message.includes("503") ||
      message.includes("service unavailable") ||
      message.includes("network error") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("fetch failed")
    );
  }

  private safeParseJson(rawText: string): SemanticAnalysisResult | null {
    try {
      let cleaned = rawText.trim();
      
      // Strip markdown code blocks
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.substring(7);
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.substring(3);
      }
      
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      
      cleaned = cleaned.trim();
      
      return JSON.parse(cleaned) as SemanticAnalysisResult;
    } catch (e) {
      return null;
    }
  }

  async analyzeDiff(diff: string): Promise<SemanticAnalysisResult> {
    console.log("Running Gemini semantic analysis...");

    const prompt = `
You are an expert technical lead reviewing a pull request diff.
Analyze the following code changes and determine the semantic impact.

Outputs must strictly be valid JSON matching this schema:
{
  "changeType": "BREAKING" | "REFACTOR" | "FEATURE" | "BUGFIX" | "UNKNOWN",
  "riskIndicators": ["List of potential risks, e.g., 'removed exported function', 'modified core auth logic'"],
  "summary": "A 1-2 sentence summary of what the change does",
  "confidence": <number between 0 and 1>
}

Classification Rules:
- BREAKING: API/signature change, removed exports, or backwards-incompatible logic changes
- FEATURE: new logic added without breaking existing behavior
- REFACTOR: no behavior change, just code reorganization
- BUGFIX: fixing incorrect logic or bugs

Reasoning Expectations:
- Identify business logic impact within the summary or riskIndicators.
- Identify downstream dependency risks.

CRITICAL REQUIREMENT: Return ONLY raw JSON. No markdown wrappers (\`\`\`json), no explanations outside JSON.

--- DIFF ---
${diff}
--- END DIFF ---
`;

    const modelsToTry = [this.PRIMARY_MODEL, this.FALLBACK_MODEL];
    
    for (const modelName of modelsToTry) {
      if (modelName === this.FALLBACK_MODEL) {
        console.log("Switching to fallback model...");
      }

      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model: modelName,
            contents: prompt
          });

          const rawText = response.text || "";
          const result = this.safeParseJson(rawText);

          if (result) {
            return result;
          } else {
            throw new Error("JSON parsing failed");
          }

        } catch (error) {
          const retryable = this.isRetryableError(error);
          
          if (retryable && attempt < this.MAX_RETRIES) {
            console.log(`Gemini unavailable (Attempt ${attempt}/${this.MAX_RETRIES}) -> retrying in ${this.RETRY_DELAY_MS/1000}s...`);
            await sleep(this.RETRY_DELAY_MS);
            continue;
          }
          
          // If not retryable or last attempt, break and try next model or fallback to default result
          console.error(`Error with model ${modelName} on attempt ${attempt}:`, (error as Error).message);
          break; 
        }
      }
    }

    // If all models and retries fail
    console.log("LLM fallback triggered");
    return {
      changeType: "UNKNOWN",
      riskIndicators: [
        "LLM unavailable",
        "Fallback to static analysis"
      ],
      summary: "Semantic analysis could not be completed due to temporary API unavailability.",
      confidence: 0.2
    };
  }
}

export class DummyLLMProvider implements LLMProvider {
  name = "DummyProvider";

  async analyzeDiff(diff: string): Promise<SemanticAnalysisResult> {
    let changeType: SemanticAnalysisResult["changeType"] = "FEATURE";
    if (diff.includes("-export")) changeType = "BREAKING";
    else if (diff.includes("fix") || diff.includes("bug")) changeType = "BUGFIX";
    else if (diff.includes("refactor")) changeType = "REFACTOR";

    return {
      changeType,
      riskIndicators: ["Dummy provider used (fallback)"],
      summary: "Simulated semantic analysis of the code changes.",
      confidence: 0.5
    };
  }
}
