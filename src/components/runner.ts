import { CohereHandler } from "./llm-handlers/cohere-handler.ts";
import { LLMClient } from "./llm-handlers/llm-client.ts";
import { OllamaHandler } from "./llm-handlers/ollama-handler.ts";
import { OpenAIHandler } from "./llm-handlers/openai-handler.ts";
import { Logger } from "./logger.ts";
import { TwitchApiClient } from "./twitch-api-client.ts";
import { TwitchWebsocketClient } from "./twitch-websocket-client.ts";
import { LlmAnalysis, LlmMessage, LlmRole, TwitchWSResponse } from "./types.ts";
import { trimMessage } from "./utils.ts";

// Twitch credentials
const TWITCH_ACCESS_TOKEN = Deno.env.get("TWITCH_ACCESS_TOKEN") || "";
const TWITCH_CLIENT_ID = Deno.env.get("TWITCH_CLIENT_ID") || "";
const TWITCH_NAME = Deno.env.get("TWITCH_NAME") || "";
const STREAMER_CHANNEL = Deno.env.get("STREAMER_CHANNEL") || "";

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
  private logger = new Logger("Runner");
  private llmClient: LLMClient;
  private messages: LlmMessage[] = [];

  private ttvApi = new TwitchApiClient(
    TWITCH_ACCESS_TOKEN,
    TWITCH_CLIENT_ID,
    TWITCH_NAME,
    STREAMER_CHANNEL,
  );
  private ttvWs = new TwitchWebsocketClient(
    TWITCH_ACCESS_TOKEN,
    TWITCH_NAME,
    STREAMER_CHANNEL,
  );

  public constructor() {
    this.llmClient = this.getLLMClient();
  }

  private getLLMClient(): LLMClient {
    if (COHERE_TOKEN) {
      this.logger.info("Selected Cohere");
      return new CohereHandler(
        SYSTEM_PROMPT_PATH,
        FORMAT_PATH,
        LLM_TEMPERATURE,
        LLM_MODEL,
        COHERE_TOKEN,
      );
    }

    if (OPENAI_TOKEN) {
      this.logger.info("Selected OpenAI");
      return new OpenAIHandler(
        SYSTEM_PROMPT_PATH,
        FORMAT_PATH,
        LLM_TEMPERATURE,
        LLM_MODEL,
        OPENAI_TOKEN,
      );
    }

    this.logger.info("Selected Ollama");
    return new OllamaHandler(
      SYSTEM_PROMPT_PATH,
      FORMAT_PATH,
      LLM_TEMPERATURE,
      LLM_MODEL,
      OLLAMA_URL,
      OLLAMA_NUM_CTX,
    );
  }

  private addMessage(message: LlmMessage) {
    this.messages.push(message);

    if (this.messages.length >= MAX_MESSAGES_REMEMBERED) {
      const deleteAmount = this.messages.length - MAX_MESSAGES_REMEMBERED;
      this.messages.splice(0, deleteAmount);
    }
  }

  private async onMessage(message: TwitchWSResponse) {
    try {
      this.logger.info(
        `Received new message in ${message.channel} from ${message.username}: ${message.content}`,
      );

      if (
        message.channel === message.username || message.username === TWITCH_NAME
      ) {
        return;
      }

      const currentMessages = this.messages.slice();

      const userMessage: LlmMessage = {
        role: LlmRole.User,
        content: `${message.username}: ${message.content}`,
      };

      currentMessages.push(userMessage);

      const llmResponse = await this.llmClient.generate(currentMessages);
      this.logger.debug(llmResponse.content);
      const llmAnalysis = JSON.parse(llmResponse.content) as LlmAnalysis;
      this.logger.info(
        `'${userMessage.content}' has been analyzed: mood score: ${llmAnalysis.mood_score} timeout: ${llmAnalysis.timeout_seconds}s message: '${llmAnalysis.message}'`,
      );

      this.addMessage(userMessage);
      this.addMessage(llmResponse);

      this.logger.debug(
        `last message: ${this.messages[this.messages.length - 1].content}`,
      );

      // Ensure the mood_score is a positive number
      if (Math.abs(llmAnalysis.mood_score) > TIMEOUT_MOOD_SCORE_THRESHOLD) {
        this.logger.debug(
          `Not mood score not low enough: ${llmAnalysis.mood_score} and it needs to be lower than: ${TIMEOUT_MOOD_SCORE_THRESHOLD}`,
        );
        return;
      }

      if (llmAnalysis.timeout_seconds <= 0) {
        this.logger.debug(
          `No punishment given: ${llmAnalysis.timeout_seconds} seconds`,
        );
        return;
      }

      await this.ttvApi.timeoutUser(
        message.username,
        llmAnalysis.timeout_seconds,
        llmAnalysis.message,
      );

      this.ttvWs.sendMessage(
        `PRIVMSG #${message.channel} :${trimMessage(llmAnalysis.message, 500)}`,
      );
    } catch (error) {
      this.logger.error(`Could not respond: ${error}`);
    }
  }

  public async run() {
    await this.ttvApi.init();
    this.ttvWs.init(this.onMessage.bind(this));
  }
}
