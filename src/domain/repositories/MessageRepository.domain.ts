
type Message = string;
export interface MessageRepository {
  saveMessage(message: Message, offset: number): Promise<any>;
  retrieveMessages(offset: number, callback: (content: string, id: string) => void): Promise<void>
};

