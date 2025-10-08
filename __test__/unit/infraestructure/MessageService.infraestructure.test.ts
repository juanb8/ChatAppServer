import type { Socket, Server } from "socket.io";
import type { MessageRepository } from "../../../src/domain/repositories/MessageRepository.domain";
import { MessageService } from "../../../src/infraestructure/MessageService.infraestructure";
import { createMockSocket, createMockServer } from "./SocketIo.mock";
import type { UserRepository } from "../../../src/domain/repositories/UserRepository.domain";

let number = 0;
jest.mock("socket.io");

const mockMessageRepository: MessageRepository = {
  saveMessage: jest
    .fn()
    .mockImplementation(async (message: string, offset: number) => {
      return { success: true, offset, message };
    }),

  retrieveMessages: jest
    .fn()
    .mockImplementation(
      async (
        offset: number,
        callback: (content: string, id: string) => void,
      ) => {
        // Mock implementation that calls callback with test data
        callback(`test-message-${offset}`, `test-id-${offset}`);
      },
    ),
};

const mockUserRepository: UserRepository = {
  loginUser: jest
    .fn()
    .mockImplementation(async (_userId: string): Promise<boolean> => {
      console.log("loginUser");
      return Promise.resolve(true);
    }),
};

describe("MessageService Unit test suite", (): void => {
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
  test(`Test ${number++}: should be able to create a new MessageService and start expecting connections`, (): void => {
    messageService.run();
    simulateClientConnection();
    expect(mockServer.on).toHaveBeenCalledWith(
      "connection",
      expect.any(Function),
    );
  });
  test(`Test ${number++}: should be able to handle socket discconection`, (): void => {
:all    messageServiceOnConnectionShouldHandleTheEvent("disconnect");
  });
  test(`Test ${number++}: should be able to handle LOGIN event`, async (): Promise<void> => {
    //    messageServiceOnConnectionShouldHandleTheEvent('LOGIN');
    messageService.run();
    const socket = simulateClientConnection();
    await new Promise(process.nextTick);
    expect(socket.on).toHaveBeenCalledWith("LOGIN", expect.any(Function));
    expect(socket.emit).toHaveBeenCalledWith("LOGIN_ACK", "ok");
    expect(mockUserRepository.loginUser).toHaveBeenCalled();
  });
});
