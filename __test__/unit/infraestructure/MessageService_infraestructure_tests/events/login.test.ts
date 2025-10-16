import type { Socket, Server } from "socket.io";
import type { MessageRepository } from "../../../../../src/domain/repositories/MessageRepository.domain";
import { MessageService } from "../../../../../src/infraestructure/services/MessageService.infraestructure";
import {
  createMockSocket,
  createMockServer,
} from "../.././mocks/SocketIo.mock";
import type { UserRepository } from "../../../../../src/domain/repositories/UserRepository.domain";
import type { LoginInfo } from "../../../../../src/infraestructure/schemas/Message-schema";
import {
  invalid_user_ack,
  valid_user_ack,
} from "../../../../../src/infraestructure/messages/server_messages";
import {
  LOGIN,
  LOGIN_ACK,
} from "../../../../../src/infraestructure/events/Event_definitions";
import { createMockUserRepository } from "../.././mocks/UserRepository.mock";
import { createMessageRepository } from "../../mocks/MessageRepository.mock";

let number = 0;
jest.mock("socket.io");

const mockMessageRepository: MessageRepository = createMessageRepository();
const mockUserRepository: UserRepository = createMockUserRepository();

describe("Login event test suite", (): void => {
  let messageService: MessageService;
  let mockServer: jest.Mocked<Server>;
  let connectedSockets: jest.Mocked<Socket>[] = [];
  let connectionCallback: ((socket: Socket) => void) | null = null;

  const messageServiceOnConnectionShouldHandleTheEvent = (
    event: string,
    _callBack?: Function,
  ): void => {
    messageService.run();
    const socketConnection = simulateClientConnection();
    const callback = _callBack ? _callBack : expect.any(Function);
    expect(socketConnection.on).toHaveBeenCalledWith(event, callback);
  };

  beforeEach((): void => {
    mockServer = createMockServer();
    messageService = new MessageService(
      mockServer,
      mockMessageRepository,
      mockUserRepository,
    );

    // mocking server 'on' implementation
    mockServer.on.mockImplementation(
      (
        event: string,
        callback: (...args: any[]) => any,
      ): jest.Mocked<Server> => {
        if (event === "connection")
          connectionCallback = callback as (socket: Socket) => void;
        return mockServer;
      },
    );
  });
  // client simulation
  const simulateClientConnection = (): jest.Mocked<Socket> => {
    const mockSocket = createMockSocket();
    connectedSockets.push(mockSocket);
    if (connectionCallback) connectionCallback(mockSocket);
    return mockSocket;
  };
  test(`Test ${number++}: should be able to handle LOGIN event`, async (): Promise<void> => {
    messageServiceOnConnectionShouldHandleTheEvent(LOGIN, expect.any(Function));
  });
  test(`Test ${number++}: login a user should check on the UserRepository`, async (): Promise<void> => {
    const socket = createMockSocket();
    const login: LoginInfo = {
      userId: "0000",
      userName: "johnDow",
      userEmail: "user@mail",
    };

    await messageService.logUser(socket, login);
    expect(mockUserRepository.loginUser).toHaveBeenCalled();
  });
  test(`Test ${number++}: login a valid user should emit a valid user ack message`, async (): Promise<void> => {
    const socket = createMockSocket();
    const login: LoginInfo = {
      userId: "0000",
      userName: "johnDow",
      userEmail: "user@mail",
    };

    await messageService.logUser(socket, login);
    expect(socket.emit).toHaveBeenCalledWith(LOGIN_ACK, valid_user_ack);
  });
  test(`Test ${number++}: login an  invalid user should emit a invalid user ack message`, async (): Promise<void> => {
    const socket = createMockSocket();
    const login: LoginInfo = {
      userId: "0000",
      userName: "johnDow",
      userEmail: "user@mail",
    };
    const mockUserRepositoryFalse = createMockUserRepository(false);
    messageService = new MessageService(
      mockServer,
      mockMessageRepository,
      mockUserRepositoryFalse,
    );

    await messageService.logUser(socket, login);
    expect(socket.emit).toHaveBeenCalledWith(LOGIN_ACK, invalid_user_ack);
  });
});
