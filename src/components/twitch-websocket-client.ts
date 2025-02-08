import { Logger } from "./logger.ts";
import { TwitchWSResponse } from "./types.ts";

export class TwitchWebsocketClient {
  private ws: WebSocket;
  private logger = new Logger("TwitchWebsocketClient");
  private oauthToken: string;
  private twitchName: string;
  private streamerChannel: string;
  private onMessage: ((message: TwitchWSResponse) => void) | null;

  constructor(token: string, twitchName: string, streamerChannel: string) {
    this.ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    this.oauthToken = `oauth:${token}`;
    this.twitchName = twitchName;
    this.streamerChannel = streamerChannel;
    this.onMessage = null;
  }

  private onOpen = () => {
    this.logger.info("Sucessfully connected to Twitch!");
    this.ws.send(`PASS ${this.oauthToken}`);
    this.ws.send(`NICK ${this.twitchName}`);
    this.ws.send(`JOIN #${this.streamerChannel}`);
  };

  private convertMessage(receivedMessage: string): TwitchWSResponse {
    const splitColon = receivedMessage.split(":");
    const splitExclemation = splitColon[1].split("!");
    const splitSpaces = splitExclemation[1].split(" ");

    const channel = splitSpaces[2].replace("#", "");
    const email = splitSpaces[0];
    const username = splitExclemation[0];
    const message = receivedMessage.split(" :")[1];

    const twitchResponse: TwitchWSResponse = {
      username: username,
      email: email,
      channel: channel,
      content: message,
    };
    return twitchResponse;
  }

  private messageEvent(ev: MessageEvent) {
    if (!this.onMessage) {
      throw new Deno.errors.InvalidData("No Message event given");
    }

    const message: string = ev.data ?? "";
    const trimmedMessage = message.trim();
    this.logger.debug(`Received message: '${trimmedMessage}'`);

    if (trimmedMessage.startsWith("PING")) {
      this.logger.debug("Received PING request");
      this.sendMessage("PONG :tmi.twitch.tv");
      return;
    }

    if (!trimmedMessage.includes("PRIVMSG")) {
      return;
    }

    const twitchResponse = this.convertMessage(trimmedMessage);
    this.onMessage(twitchResponse);
  }

  public init(onMessage: (message: TwitchWSResponse) => void) {
    this.logger.info("Connecting to Twitch...");
    this.onMessage = onMessage;
    this.ws.onmessage = this.messageEvent.bind(this);
    this.ws.onopen = this.onOpen;
  }

  public sendMessage(message: string) {
    this.logger.debug(`Sending ${message}`);
    this.ws.send(message);
  }
}
