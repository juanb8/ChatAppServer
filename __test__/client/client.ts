import { log } from 'console';
import { io, Socket } from 'socket.io-client';
type LoginInfo = {
  userId: string,
  userName: string | undefined,
  userEmail: string | undefined
}
type UserId = string;
type Message = {
  roomId: string,
  senderId: string,
  receiverId: string,
  message: string
};
type RoomId = string;

interface Client_interface {
  login: () => void,
  isOnline: () => boolean,
  showInformation: () => LoginInfo,
  sendMessageToGeneral: (msg: string) => void,
  startChatWith: (usr: UserId) => void,
  sendMessageTo: (usr: UserId, content: string) => void,
  messages: () => Map<UserId, Message[]>
};

export class Client implements Client_interface {
  private loginInfo: LoginInfo;
  private socket: Socket;
  private online: boolean = false;
  private rooms: Map<UserId, RoomId> = new Map();
  private __messages__: Map<UserId, Message[]> = new Map();

  // The constructor Of the class 
  constructor(id: string, userName?: string, userEmail?: string) {
    this.socket = this.setUpServerConnection();
    this.setUpConnectionError();
    this.loginInfo = this.setUpLoginInfo(id, userName, userEmail);
  }

  login(): void {
    this.handleDisconnection();

    this.socket.emit('LOGIN', this.showInformation());
    this.socket.on('LOGIN_ACK', (res: string): void => {
      if (res === 'ok')
        this.changeOnlineStatus((res === 'ok'));
      else
        throw new Error('Error login user');
    });

    this.openMailBox();
  }

  sendMessageToGeneral(message: string): void {
    this.handleDisconnection();
    this.socket.emit('GENERAL', message);
  }
  startChatWith(userId: string): void {
    this.handleDisconnection();
    this.socket.emit('START_CHAT', { senderId: this.showInformation().userId, receiverId: userId });
    this.socket.on('START_CHAT_ACK', (roomId: string): void => {
      this.rooms.set(userId, roomId);

    });
  }
  sendMessageTo(user: string, message: string): void {
    if (this.rooms.has(user)) {
      this.socket.emit('CHAT_ROOM', {
        roomId: this.rooms.get(user),
        senderId: this.showInformation().userId,
        receiver: user,
        type: 'text',
        date: new Date()
      });
      this.socket.on('CHAT_ROOM_ACK', (ack: string) => {
      })
    } else {
      throw new Error('Error start chat');
    };
  }
  messages(): Map<UserId, Message[]> {
    return this.__messages__;
  }
  isOnline(): boolean { return this.online }

  showInformation(): LoginInfo {
    return this.loginInfo;
  }
  private changeOnlineStatus(status: boolean): void { this.online = status }
  private handleDisconnection(): void {
    if (!this.socket.connected)
      throw new Error('Server error');
  }

  private openMailBox(): void {
    this.socket.on('RECEIVE_MESSAGE', (message: Message): void => {

      if (!this.rooms.has(message.senderId))
        this.rooms.set(message.senderId, message.roomId);
      let messages = this.__messages__.get(message.senderId);
      if (!messages)
        messages = [];
      messages.push(message);
      this.__messages__.set(message.senderId, messages);
    });
  }

  private setUpLoginInfo(userId: UserId, userName: string | undefined, userEmail: string | undefined): LoginInfo {
    return {
      userId: userId,
      userName: userName,
      userEmail: userEmail
    }
  }
  private setUpConnectionError(): void {
    this.socket.on('connect_error', (error: any): void => {
      if (!this.socket.active)
        console.log('Cannot connect to server', error?.message);
    });
  }
  private setUpServerConnection(): Socket {
    return io('http://localhost:3000/', {
      auth: {
        serverOffset: 0
      },
      ackTimeout: 10000,
      retries: 3,
    });
  }
};
