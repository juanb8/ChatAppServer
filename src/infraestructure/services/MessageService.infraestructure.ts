import { Server, Socket } from "socket.io";
import type { MessageRepository } from "../../domain/repositories/MessageRepository.domain";
import type { UserRepository } from "../../domain/repositories/UserRepository.domain";
import type { LoginInfo, SignupInfo, UserId } from "../schemas/Message-schema";
import type { User } from "../../domain/entities/User.entity";
import { userFactory } from "../entities/User.infraestructure";

import {
  invalid_user_ack,
  valid_user_ack,
  database_error_message,
} from "../messages/server_messages";
import {
  LOGIN,
  LOGIN_ACK,
  SIGNUP,
  SIGNUP_ACK,
} from "../events/Event_definitions";

export class MessageService {
  constructor(
    private io: Server,
    private messageRepository: MessageRepository,
    private userRepository: UserRepository,
  ) { }

  disconnectionHandler(socket: Socket): void {
    socket.on("disconnect", () => { });
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
      socket.on(
        SIGNUP,
        async (signupInfo: SignupInfo): Promise<void> =>
          this.signup(socket, signupInfo),
      );
      socket.on("GENERAL", (): void => { });
      socket.on("START_CHAT", (): void => { });
      socket.on("CHAT_ROOM", (): void => { });
    });
  }

  async validSignUp(signupInfo: SignupInfo): Promise<boolean> {
    if (signupInfo === undefined) return false;
    const isUserNameTaken = await this.userRepository.checkForUserName(signupInfo.userName);
    const isEmailTaken = await this.userRepository.checkForEmail(signupInfo.userEmail);
    return !isEmailTaken && !isUserNameTaken;
  }

  async signup(_socket: Socket, _signupInfo: SignupInfo): Promise<void> {
    if (_signupInfo) {
      try {
        const user = await userFactory(this.userRepository, _signupInfo);
        await user.handleSignUp();
        _socket.emit(SIGNUP_ACK, user.message());
      } catch (error) {
        const err = error as Error;
        _socket.emit(SIGNUP_ACK, database_error_message + err.message);
      }
    }
  }

  async logUser(socket: Socket, login: LoginInfo): Promise<void> {
    try {
      if (login !== undefined) {
        const x = await this.userRepository.loginUser(login.userId);
        if (x) socket.emit(LOGIN_ACK, valid_user_ack);
        else socket.emit(LOGIN_ACK, invalid_user_ack);
      } else socket.emit(LOGIN_ACK, invalid_user_ack);
    } catch (error) {
      let err = error as Error;
      console.error("DataBase error:", err.message);
    }
  }
  async exec(): Promise<void> {
    this.io.on("connection", async (socket) => {
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
