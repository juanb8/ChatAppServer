import { Server, Socket } from "socket.io";
import type { MessageRepository } from "../domain/repositories/MessageRepository.domain";

export class MessageService {
  constructor(private io: Server, private messageRepository: MessageRepository) {
  };

  disconnectionHandler(socket: Socket): void {
    socket.on('disconnect', () => {
      console.log("user disconnected");
    });
  };

  sendMessage(msg: string, id: number): void {
    this.io.emit('chat message', msg, id);
  };

  async handleRecoverConnection(socket: Socket): Promise<void> {
    try {
      await this.messageRepository.retrieveMessages(
        socket.handshake.auth.serverOffset,
        (content: string, id: string): void => { socket.emit('chat message', content, id) }
      );
    } catch (error) {
      console.error("Client connection failed");
    }
  }
  run(): void {
    this.io.on('connection', (socket: Socket): void => {
      // Handles socket disconnection 
      this.disconnectionHandler(socket);
      socket.on('LOGIN', () => {
        socket.emit("LOGIN_ACK", 'ok');
      });
    });
  }

  async exec(): Promise<void> {
    this.io.on('connection', async (socket) => {
      console.log('a user connected');

      // For now, informs disconnections 
      this.disconnectionHandler(socket);

      socket.on('chat message', async (msg: string, clientOffset: number, callback?: () => void): Promise<void> => {
        console.log('message: ' + msg);
        let result;
        try {
          result = await this.messageRepository.saveMessage(msg, clientOffset); //TODO: return type
        } catch (error: any) {
          if (error.errno === 19) {
            if (callback)
              callback();
          }
          console.error("DB error:" + error);
          return;
        }
        this.sendMessage(msg, result.lastID);

        if (callback)
          callback();
      });
      socket.on('GENERAL', (msg: string): void => {
        console.log('Received: ', msg);
      });
      if (!socket.recovered) {
        await this.handleRecoverConnection(socket);
      }
    });

  }
}

