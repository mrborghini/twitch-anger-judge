export function trimMessage(message: string, maxLength: number) {
  let newMessage = "";
  for (let i = 0; i < message.length; i++) {
    if (i >= maxLength) {
      break;
    }
    newMessage += message[i];
  }
  return newMessage;
}
