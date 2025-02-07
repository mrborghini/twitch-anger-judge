import { LlmMessage, LlmRole } from "../types.ts";

export abstract class LLMClient {
  private systemPromptPath: string;
  private formatPath: string;
  private temperature: number;
  private model: string;

  public constructor(
    systemPromptPath: string,
    formatPath: string,
    temperature: number,
    model: string,
  ) {
    this.systemPromptPath = systemPromptPath;
    this.formatPath = formatPath;
    this.temperature = temperature;
    this.model = model;
  }

  public getModel() {
    return this.model;
  }

  public getTemperature() {
    return this.temperature;
  }

  protected async getFormat(): Promise<string> {
    return await Deno.readTextFile(this.formatPath);
  }

  protected async getSystemPrompt(): Promise<LlmMessage> {
    const systemPromptContent = await Deno.readTextFile(this.systemPromptPath);

    const llmMessage: LlmMessage = {
      role: LlmRole.System,
      content: systemPromptContent,
    };
    return llmMessage;
  }

  public abstract generate(messages: LlmMessage[]): Promise<LlmMessage>;
}
