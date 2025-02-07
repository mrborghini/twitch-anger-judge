import { LLMMessage, OpenAIResponse } from "../types.ts";
import { LLMClient } from "./llm-client.ts";

export abstract class GenericOpenAI extends LLMClient {
  private url: string;
  private token: string;
  private endPoint: string;

  constructor(
    systemPromptPath: string,
    formatPath: string,
    temperature: number,
    model: string,
    url: string,
    endPoint: string,
    token: string,
  ) {
    super(systemPromptPath, formatPath, temperature, model);
    this.url = url;
    this.endPoint = endPoint;
    this.token = token;
  }

  protected abstract formatJsonFormat(): Promise<string>;

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

    const response = await fetch(`${this.url}${this.endPoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body,
    });
    const json = await response.json() as OpenAIResponse;

    return json.choices[0];
  }
}
