import { CohereHandler } from "./llm-handlers/cohere-handler.ts";
import { LLMClient } from "./llm-handlers/llm-client.ts";
import { OllamaHandler } from "./llm-handlers/ollama-handler.ts";
import { OpenAIHandler } from "./llm-handlers/openai-handler.ts";
import { Logger } from "./logger.ts";
import { LLMMessage, LlmRole } from "./types.ts";

// Twitch credentials
const TWITCH_ACCESS_TOKEN = Deno.env.get("TWITCH_ACCESS_TOKEN") || "";
const TWITCH_REFRESH_TOKEN = Deno.env.get("TWITCH_REFRESH_TOKEN") || "";
const TWITCH_CLIENT_ID = Deno.env.get("TWITCH_CLIENT_ID") || "";

// LLM Credentials
const LLM_TEMPERATURE = parseFloat(Deno.env.get("LLM_TEMPERATURE") ?? "0.7");
const FORMAT_PATH = Deno.env.get("OUTPUT_FORMAT") ?? "";
const SYSTEM_PROMPT_PATH = Deno.env.get("SYSTEM_PROMPT_PATH") ?? "";
const LLM_MODEL = Deno.env.get("LLM_MODEL") ?? "";
const MAX_MESSAGES_REMEMBERED = parseInt(
  Deno.env.get("MAX_MESSAGES_REMEMBERED") || "50",
);

const TIMEOUT_MOOD_SCORE_THRESHOLD = parseFloat(
  Deno.env.get("TIMEOUT_MOOD_SCORE_THRESHOLD") || "0.3",
);

// Closed source options
const OPENAI_TOKEN = Deno.env.get("OPENAI_TOKEN") || null;
const COHERE_TOKEN = Deno.env.get("COHERE_TOKEN") || null;

// Open source options
const OLLAMA_URL = Deno.env.get("OLLAMA_URL") || "";
const OLLAMA_NUM_CTX = parseInt(Deno.env.get("OLLAMA_NUM_CTX") || "");

export class Runner {
  private llmClient: LLMClient;
  private messages: LLMMessage[] = [];

  public constructor() {
    this.llmClient = this.getLLMClient();
  }

  private getLLMClient(): LLMClient {
    if (COHERE_TOKEN) {
      return new CohereHandler(
        SYSTEM_PROMPT_PATH,
        FORMAT_PATH,
        LLM_TEMPERATURE,
        LLM_MODEL,
        COHERE_TOKEN,
      );
    }

    if (OPENAI_TOKEN) {
      return new OpenAIHandler(
        SYSTEM_PROMPT_PATH,
        FORMAT_PATH,
        LLM_TEMPERATURE,
        LLM_MODEL,
        OPENAI_TOKEN,
      );
    }

    return new OllamaHandler(
      SYSTEM_PROMPT_PATH,
      FORMAT_PATH,
      LLM_TEMPERATURE,
      LLM_MODEL,
      OLLAMA_URL,
      OLLAMA_NUM_CTX,
    );
  }

  private addMessage(message: LLMMessage) {
    this.messages.push(message);

    if (this.messages.length >= MAX_MESSAGES_REMEMBERED) {
      const deleteAmount = this.messages.length - MAX_MESSAGES_REMEMBERED;
      this.messages.splice(0, deleteAmount);
    }
  }

  public async run() {
    const TWITCH_URL = "wss://irc-ws.chat.twitch.tv:443";
    const logger = new Logger("Runner");
    const ws = new WebSocket(TWITCH_URL);

    logger.info("Connecting to Twitch...");

    ws.onopen = (event) => {
      logger.info("Sucessfully connected to Twitch!");
    };

    ws.onerror = () => {
      logger.error(`Had an error`);
    };

    ws.onclose = (event) => {
      logger.warning(`Connection closed: ${event.reason}`);
    };

    ws.onmessage = (event) => {
      logger.debug(`Received new message: ${event.data}`);
    };
  }
}
