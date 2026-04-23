import { LLMProvider, DummyLLMProvider, GeminiLLMProvider, SemanticChangeOutput } from "./provider";

export class SemanticAnalyzer {
  private provider: LLMProvider;

  constructor(provider?: LLMProvider) {
    if (provider) {
      this.provider = provider;
    } else {
      try {
        this.provider = new GeminiLLMProvider();
      } catch (error) {
        console.warn(`Falling back to DummyLLMProvider: ${(error as Error).message}`);
        this.provider = new DummyLLMProvider();
      }
    }
  }

  public async analyzePrDiff(diff: string): Promise<SemanticChangeOutput> {
    if (!diff) {
      return {
        changeType: "UNKNOWN",
        riskIndicators: ["Empty diff received"],
        summary: "No changes to analyze.",
        confidence: 1.0,
      };
    }

    try {
      return await this.provider.analyzeDiff(diff);
    } catch (error) {
      console.error("LLM Analysis failed, invoking fallback behavior", error);
      const fallback = new DummyLLMProvider();
      return fallback.analyzeDiff(diff);
    }
  }
}
