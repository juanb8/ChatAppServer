import type { Socket, Server } from "socket.io";
import type { MessageRepository } from "../../../../../src/domain/repositories/MessageRepository.domain";
import { MessageService } from "../../../../../src/infraestructure/services/MessageService.infraestructure";
import {
  createMockSocket,
  createMockServer,
} from "../.././mocks/SocketIo.mock";
import type { UserRepository } from "../../../../../src/domain/repositories/UserRepository.domain";
import type {
  SignupInfo,
} from "../../../../../src/infraestructure/schemas/Message-schema";
import {

} from "../../../../../src/infraestructure/messages/server_messages";
import {
  START_CHAT
} from "../../../../../src/infraestructure/events/Event_definitions";
import { createMockUserRepository } from "../.././mocks/UserRepository.mock";
import { createMessageRepository } from "../../mocks/MessageRepository.mock";

let number = 0;
jest.mock("socket.io");

const mockMessageRepository: MessageRepository = createMessageRepository();
const mockUserRepository: UserRepository = createMockUserRepository();

describe("Start Chat event Test Suite", (): void => {
  let messageService: MessageService;
  let mockServer: jest.Mocked<Server>;
  let connectedSockets: jest.Mocked<Socket>[] = [];
  let connectionCallback: ((socket: Socket) => void) | null = null;
  let signupInfo: SignupInfo;

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
    signupInfo = {
      userName: "johnDow",
      userEmail: "user@mail",
    };

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

  test(`Test ${number++}: should be able to handle START_CHAT event`, async (): Promise<void> => {
    messageServiceOnConnectionShouldHandleTheEvent(
      START_CHAT
    );
  });
  test(`Test ${number++}: the START_CHAT event should be able to handle correct message`, async (): Promise<void> => {

  });

});
