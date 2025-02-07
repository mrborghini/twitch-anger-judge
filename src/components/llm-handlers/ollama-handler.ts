import { LlmMessage, OllamaResponse } from "../types.ts";
import { LLMClient } from "./llm-client.ts";

export class OllamaHandler extends LLMClient {
  private url: string;
  private numCtx: number;

  constructor(
    systemPromptPath: string,
    formatPath: string,
    temperature: number,
    model: string,
    url: string,
    numCTX: number,
  ) {
    super(systemPromptPath, formatPath, temperature, model);

    this.url = url;
    this.numCtx = numCTX;
  }

  public override async generate(messages: LlmMessage[]): Promise<LlmMessage> {
    const url = `${this.url}/api/chat`;

    const systemMessage = await this.getSystemPrompt();
    // Add the system prompt at the beginning of the messages.
    messages.unshift(systemMessage);

    const body = JSON.stringify({
      messages: messages,
      stream: false,
      model: this.getModel(),
      format: JSON.parse(await this.getFormat()),
      options: {
        num_ctx: this.numCtx,
        temperature: this.getTemperature(),
      },
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });

    const jsonData = await response.json() as OllamaResponse;

    return jsonData.message;
  }
}
