import type { Socket, Server } from "socket.io";
import type { MessageRepository } from "../../../../../src/domain/repositories/MessageRepository.domain";
import { MessageService } from "../../../../../src/infraestructure/MessageService.infraestructure";
import {
  createMockSocket,
  createMockServer,
} from "../.././mocks/SocketIo.mock";
import type { UserRepository } from "../../../../../src/domain/repositories/UserRepository.domain";
import type {
  SignupInfo,
} from "../../../../../src/infraestructure/schemas/Message-schema";
import {
  correct_signup_message,
  incorrect_signup_message,
} from "../../../../../src/infraestructure/messages/server_messages";
import {
  SIGNUP,
  SIGNUP_ACK,
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

  test(`Test ${number++}: should be able to handle SIGNUP event`, async (): Promise<void> => {
    messageServiceOnConnectionShouldHandleTheEvent(
      SIGNUP
    );
  });

  test(`Test ${number++}: Signing up  a new user should check on the UserRepository for userName`, async (): Promise<void> => {
    await signUpWithCorrectInformation();
    expect(mockUserRepository.checkForUserName).toHaveBeenCalledWith(signupInfo.userName);
  });

  test(`Test ${number++}: Signing up  a new user should check on the UserRepository for user email`, async (): Promise<void> => {
    await signUpWithCorrectInformation();
    expect(mockUserRepository.checkForEmail).toHaveBeenCalledWith(signupInfo.userEmail);
  });

  test(`Test ${number++}: Signing up  a new valid user should emit SIGNUP_ACK`, async (): Promise<void> => {
    const socket = createMockSocket();
    await messageService.signup(socket, signupInfo);
    expect(socket.emit).toHaveBeenCalledWith(SIGNUP_ACK, correct_signup_message);
  });

  test(`Test ${number++}: Signing up a new user valid user should signUp on the message repository`, async (): Promise<void> => {
    await signUpWithCorrectInformation();
    expect(mockUserRepository.signUp).toHaveBeenCalledWith(signupInfo);
  })

  async function signUpWithCorrectInformation(): Promise<void> {
    const socket = createMockSocket();
    await messageService.signup(socket, signupInfo);
  }
  //  test(`Test ${number++}: login a valid user should emit a valid user ack message`, async (): Promise<void> => {
  //    const socket = createMockSocket();
  //    const signupInfo: SignupInfo = {
  //      userName: "johnDow",
  //      userEmail: "user@mail",
  //    };
  //
  //    await messageService.signup(socket, signupInfo);
  //    expect(socket.emit).toHaveBeenCalledWith(
  //      SIGNUP_ACK,
  //      correct_signup_message,
  //    );
  //  });
  //  test(`Test ${number++}: login an  invalid user should emit a invalid user ack message`, async (): Promise<void> => {
  //    const socket = createMockSocket();
  //    const login: LoginInfo = {
  //      userId: "0000",
  //      userName: "johnDow",
  //      userEmail: "user@mail",
  //    };
  //    co//nst mockUserRepositoryFalse = createMockUserRepository(false);
  //    mes//sageService = new MessageService(
  //      mockServer,
  //      mockMessageRepository,
  //      mockUserRepositoryFalse,
  //    );
  //
  //    await messageService.logUser(socket, login);
  //    expect(socket.emit).toHaveBeenCalledWith(LOGIN_ACK, invalid_user_ack);
  //  });
});
