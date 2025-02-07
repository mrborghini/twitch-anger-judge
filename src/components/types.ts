export enum Colors {
  Blue = "\x1b[94m",
  Cyan = "\x1b[96m",
  Green = "\x1b[92m",
  Warning = "\x1b[93m",
  Error = "\x1b[91m",
  Default = "\x1b[0m",
}

export enum LlmRole {
  System = "system",
  Assistant = "assistant",
  User = "user",
}

export interface LLMMessage {
  role: LlmRole;
  content: string;
}

export interface CohereResponse {
  id: string;
  message: CohereMessage;
}

export interface CohereMessage {
  role: LlmRole;
  content: CohereContent[];
}

export interface CohereContent {
  type: string;
  text: string;
}

export interface OllamaResponse {
  message: LLMMessage;
}

export interface OpenAIResponse {
  choices: LLMMessage[];
}
