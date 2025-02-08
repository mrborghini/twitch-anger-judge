import { TwitchUser } from "./types.ts";

export class TwitchApiClient {
  private botUser: TwitchUser | null = null;
  private streamerUser: TwitchUser | null = null;
  private accessToken: string;
  private twitchClientId: string;
  private baseUrl = "https://api.twitch.tv";
  private twitchName: string;
  private streamerName: string;

  constructor(
    accessToken: string,
    twitchClientId: string,
    twitchName: string,
    streamerName: string,
  ) {
    this.accessToken = accessToken;
    this.twitchClientId = twitchClientId;
    this.twitchName = twitchName;
    this.streamerName = streamerName;
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.accessToken}`,
      "Client-Id": this.twitchClientId,
    };
  }

  public async init() {
    this.botUser = await this.getUser(this.twitchName);
    this.streamerUser = await this.getUser(this.streamerName);
  }

  public async getUser(username: string) {
    const url = `${this.baseUrl}/helix/users?login=${username}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });
    const jsonResponse = await response.json();
    return jsonResponse as TwitchUser;
  }

  public async timeoutUser(
    victim: string,
    timeSeconds: number,
    reason?: string | null,
  ) {
    if (!this.botUser || !this.streamerUser) {
      throw new Deno.errors.InvalidData("No user login to send data");
    }

    if (timeSeconds === 0) {
      throw new Deno.errors.InvalidData("TimeSeconds can not be 0.");
    }

    const victimUser = await this.getUser(victim);

    const url = `${this.baseUrl}/helix/moderation/bans?broadcaster_id=${
      this.streamerUser.data[0].id
    }&moderator_id=${this.botUser.data[0].id}`;

    const body = {
      data: {
        user_id: victimUser.data[0].id,
        duration: timeSeconds,
        reason: reason,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    const responseJson = await response.json();

    if (responseJson.data.length === 0) {
      throw new Deno.errors.UnexpectedEof("No response received");
    }
  }
}
