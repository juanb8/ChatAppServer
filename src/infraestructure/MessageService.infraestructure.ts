import { Server, Socket } from "socket.io";
import type { MessageRepository } from "../domain/repositories/MessageRepository.domain";
import type { UserRepository } from "../domain/repositories/UserRepository.domain";
import type { LoginInfo } from "./schemas/Message-schema";
import { invalid_user_ack, valid_user_ack } from "./messages/server_messages";
import { LOGIN, LOGIN_ACK } from "./events/Event_definitions";

export class MessageService {
  constructor(
    private io: Server,
    private messageRepository: MessageRepository,
    private userRepository: UserRepository,
  ) { }

  disconnectionHandler(socket: Socket): void {
    socket.on("disconnect", () => {
    });
  }

  sendMessage(msg: string, id: number): void {
    this.io.emit("chat message", msg, id);
  }

  async handleRecoverConnection(socket: Socket): Promise<void> {
    try {
      await this.messageRepository.retrieveMessages(
        socket.handshake.auth.serverOffset,
        (content: string, id: string): void => {
          socket.emit("chat message", content, id);
        },
      );
    } catch (error) {
      console.error("Client connection failed");
    }
  }
  run(): void {
    this.io.on("connection", async (socket: Socket): Promise<void> => {
      // Handles socket disconnection
      this.disconnectionHandler(socket);
      socket.on(
        LOGIN,
        async (login: LoginInfo): Promise<void> => this.logUser(socket, login),
      );
      socket.on("GENERAL", (): void => { });
      socket.on("START_CHAT", (): void => { });
      socket.on("CHAT_ROOM", (): void => { });
    });
  }

  async logUser(socket: Socket, login: LoginInfo): Promise<void> {
    console.log("Enters log user");

    try {
      console.log("awaits for userRepository ");

      const x = await this.userRepository.loginUser(login.userId);
      console.log("user repository ended correctly");
      if (x) socket.emit(LOGIN_ACK, valid_user_ack);
      else socket.emit(LOGIN_ACK, invalid_user_ack);
    } catch (error) {
      console.log("Catches de error");

      console.error("DB error");
    }
  }
  async exec(): Promise<void> {
    this.io.on("connection", async (socket) => {
      console.log("a user connected");

      // For now, informs disconnections
      this.disconnectionHandler(socket);

      socket.on(
        "chat message",
        async (
          msg: string,
          clientOffset: number,
          callback?: () => void,
        ): Promise<void> => {
          console.log("message: " + msg);
          let result;
          try {
            result = await this.messageRepository.saveMessage(
              msg,
              clientOffset,
            ); //TODO: return type
          } catch (error: any) {
            if (error.errno === 19) {
              if (callback) callback();
            }
            console.error("DB error:" + error);
            return;
          }
          this.sendMessage(msg, result.lastID);

          if (callback) callback();
        },
      );
      socket.on("GENERAL", (msg: string): void => {
        console.log("Received: ", msg);
      });
      if (!socket.recovered) {
        await this.handleRecoverConnection(socket);
      }
    });
  }
}
