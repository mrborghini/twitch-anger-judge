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

export interface LlmMessage {
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
  message: LlmMessage;
}

export interface OpenAIResponse {
  choices: LlmMessage[];
}

export interface TwitchWSResponse {
  username: string;
  email: string;
  channel: string;
  content: string;
}

export interface LlmAnalysis {
  mood_score: number;
  message: string;
  timeout_seconds: number;
}

export interface TwitchUser {
  data: TwitchUserData[];
}

export interface TwitchUserData {
  broadcaster_type: string;
  created_at: string;
  description: string;
  display_name: string;
  id: string;
  login: string;
  offline_image_url: string;
  profile_image_url: string;
  type: string;
  view_count: number;
}
