import { CohereResponse, LLMMessage } from "../types.ts";
import { LLMClient } from "./llm-client.ts";

export class CohereHandler extends LLMClient {
  private token: string;
  public constructor(
    systemPromptPath: string,
    formatPath: string,
    temperature: number,
    model: string,
    token: string,
  ) {
    super(
      systemPromptPath,
      formatPath,
      temperature,
      model,
    );

    this.token = token;
  }

  private async formatJsonFormat(): Promise<string> {
    const format = await this.getFormat();
    const jsonFormat = JSON.parse(format);
    const cohereFormat = {
      type: "json_object",
      json_schema: jsonFormat,
    };
    return JSON.stringify(cohereFormat);
  }

  public override async generate(messages: LLMMessage[]): Promise<LLMMessage> {
    const systemMessage = await this.getSystemPrompt();
    messages.unshift(systemMessage);
    const format = JSON.parse(await this.formatJsonFormat());
    const body = JSON.stringify({
      messages: messages,
      response_format: format,
      model: this.getModel(),
      temperature: this.getTemperature(),
    });

    const response = await fetch(`https://api.cohere.com/v2/chat`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body,
    });
    const json = await response.json() as CohereResponse;

    return {
      role: json.message.role,
      content: json.message.content[0].text,
    };
  }
}
