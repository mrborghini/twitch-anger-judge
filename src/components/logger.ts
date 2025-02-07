import { Colors } from "./types.ts";

export class Logger {
  private typeName: string;

  constructor(typeName: string) {
    if (typeName == undefined || typeName == "") {
      throw new Deno.errors.InvalidData(
        "Logger didn't get a type name as a string",
      );
    }
    this.typeName = typeName;
  }

  private log(messageType: string, message: string): void {
    const result =
      `[${messageType} - ${this.typeName} - ${this.getTime()}]: ${message}`;

    switch (messageType) {
      case "ERROR":
        console.error(Colors.Error + result + Colors.Default);
        break;
      case "INFO":
        console.info(Colors.Blue + result + Colors.Default);
        break;
      case "DEBUG":
        console.debug(Colors.Green + result + Colors.Default);
        break;
      case "WARNING":
        console.warn(Colors.Warning + result + Colors.Default);
        break;
      default:
        console.log(Colors.Cyan + result + Colors.Default);
        break;
    }
  }

  public warning(message: string) {
    this.log("WARNING", message);
  }

  public error(message: string) {
    this.log("ERROR", message);
  }

  public info(message: string) {
    this.log("INFO", message);
  }

  public debug(message: string) {
    if (Deno.env.get("DEBUG") == "true") {
      this.log("DEBUG", message);
    }
  }

  private getTime(): string {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date} ${time}`;
  }
}
