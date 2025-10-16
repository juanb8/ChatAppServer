import { Database } from "sqlite";
import type { MessageRepository } from "../domain/repositories/MessageRepository.domain";

type Message = string;

export class MessageRepositorySqlite implements MessageRepository {
  constructor(private db: Database) { };
  async saveMessage(message: Message, offset: number): Promise<any> {
    return this.db.run('INSERT INTO messages (content,client_offset) VALUES (?,?)', message, offset);
  }
  async retrieveMessages(offset: number, callback: (content: string, id: string) => void): Promise<void> {
    this.db.each("SELECT id, content FROM messages WHERE id > ?", [offset || 0],
      (_err, row) => {
        callback(row.content, row.id);
      });
  }
};
