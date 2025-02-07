import { GenericOpenAI } from "./generic-openai.ts";

export class OpenAIHandler extends GenericOpenAI {
  public constructor(
    systemPromptPath: string,
    formatPath: string,
    temperature: number,
    model: string,
    token: string,
  ) {
    const url = "https://api.openai.com";
    const endPoint = "/v1/chat/completions";
    super(
      systemPromptPath,
      formatPath,
      temperature,
      model,
      url,
      endPoint,
      token,
    );
  }

  protected override async formatJsonFormat(): Promise<string> {
    const format = await this.getFormat();
    const jsonFormat = JSON.parse(format);
    const openaiFormat = {
      type: "json_schema",
      json_schema: jsonFormat,
    };
    return JSON.stringify(openaiFormat);
  }
}
