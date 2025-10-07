import { Client } from './client';
import { io, Socket } from 'socket.io-client';

// Mock the entire socket.io-client module
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: Boolean,
  };

  return {
    io: jest.fn(() => mockSocket) // Always return the same mock instance
  };
});
let testNumber = 1;

describe('Client test suite', () => {
  const mockedIo = io as jest.MockedFunction<typeof io>;
  const userId_1 = '0000';
  const userId_2 = '0001';
  let client1: Client;
  let mockedSocket: jest.Mocked<Socket>;
  function mockEvent(mockedSocket: jest.Mocked<Socket>, eventName: string, ackCallback: Function | null): void {
    mockedSocket.on.mockImplementation((event: string, listener: (...args: any[]) => any): any => {
      if (event === eventName)
        ackCallback = listener;
    })
  }
  function sendArguments(ackCallback: Function | null, ...args: any[]): void {
    if (ackCallback)
      ackCallback(args);
  }
  beforeEach((): void => {
    mockedSocket = mockedIo() as jest.Mocked<Socket>;
    mockedSocket.connected = true;
    client1 = new Client(userId_1, 'JohnDoe', 'user@mail.com');
    jest.clearAllMocks();
  });
  test(`Test${testNumber++}: Should create a client and stablish the connection`, (): void => {
    const client = new Client(userId_1);
    expect(mockedIo).toHaveBeenCalledWith('http://localhost:3000/', {
      auth: {
        serverOffset: 0
      },
      ackTimeout: 10000,
      retries: 3,
    });

  });
  test(`Test${testNumber++}: Should handle server not responding`, (): void => {
    new Client(userId_1);


  })
  test(`Test${testNumber++}: Should send a message with the  login information`, (): void => {
    let ackLoginCallback: Function | null = null;
    mockEvent(mockedSocket, 'LOGIN_ACK', ackLoginCallback);
    mockedSocket.on.mockImplementation((event: string, listener: (...args: any[]) => any): any => {
      if (event === 'LOGIN_ACK')
        ackLoginCallback = listener;
    });
    const client = new Client(userId_1);
    client.login();
    if (ackLoginCallback)
      ackLoginCallback('ok');
    expect(mockedSocket.emit).toHaveBeenCalledWith('LOGIN', client.showInformation());
    expect(mockedSocket.on).toHaveBeenCalledWith('LOGIN_ACK', expect.any(Function));
    expect(client.isOnline()).toBeTruthy();

    const client_not_signed = new Client('0001');
    try {
      client_not_signed.login();
      if (ackLoginCallback)
        ackLoginCallback('not ok');

    } catch (error: any) {
      expect(error.message).toEqual('Error login user')
    }
    expect(client_not_signed.isOnline()).toBeFalsy();
  });
  test(`Test${testNumber++}: Should send a message to general chat`, (): void => {
    client1.sendMessageToGeneral('Hello, general!');
    expect(mockedIo().emit).toHaveBeenCalledWith('GENERAL', 'Hello, general!');
  });
  test(`Test${testNumber++}: Starting a chat should send a START_CHAT and get an ack from the server`, (): void => {
    client1.startChatWith(userId_2);
    expect(mockedSocket.emit).toHaveBeenCalledWith('START_CHAT', { senderId: client1.showInformation().userId, receiverId: userId_2 });
    expect(mockedSocket.on).toHaveBeenCalledWith('START_CHAT_ACK', expect.any(Function));
  });
  test(`Test${testNumber++}: Starting a chat should send a START_CHAT and get an ack from the server`, (): void => {
    client1.startChatWith(userId_2);
    expect(mockedSocket.emit).toHaveBeenCalledWith('START_CHAT', { senderId: client1.showInformation().userId, receiverId: userId_2 });
    expect(mockedSocket.on).toHaveBeenCalledWith('START_CHAT_ACK', expect.any(Function));
  });
  test(`Test${testNumber++}: Sending a message should call CHAT_ROOM and get an ack `, (): void => {
    const message = 'Hello, user!';
    const mockRoomId = '0000';
    let ackCallback: Function | null = null;
    mockedSocket.on.mockImplementation((event, callback: (...args: any[]) => any): any => {
      if (event === 'START_CHAT_ACK') {
        ackCallback = callback;
      }
    });
    client1.startChatWith(userId_2);
    if (ackCallback) {
      ackCallback(mockRoomId);
    }
    client1.sendMessageTo(userId_2, message);
    expect(mockedSocket.emit).toHaveBeenCalledWith('CHAT_ROOM', expect.any(Object));
    expect(mockedSocket.on).toHaveBeenCalledWith('CHAT_ROOM_ACK', expect.any(Function));
  });
  test(`Test${testNumber++}: Sending a message without starting a chat should raise an erors`, (): void => {
    const message = 'Hello, user!';
    expect(() => client1.sendMessageTo(userId_2, message)).toThrow('Error start chat');
  });
  test(`Test${testNumber++}: Should handle server not running`, (): void => {
    try {
      const client1 = new Client(userId_1);
    } catch (error: any) {
      expect(error.message).toEqual('Server error')
    }
    mockedSocket.connected = false;
    expect(client1.isOnline()).toBeFalsy();
    expect((): void => client1.login()).toThrow('Server error');
    expect((): void => client1.startChatWith(userId_2)).toThrow('Server error');
  });
  test(`Test${testNumber++}: Should have an empty map when nobody send it a message`, (): void => {
    const client1 = new Client(userId_1);
    client1.login();
    expect(client1.messages().size).toEqual(0);
  });
  test(`Test${testNumber++}: testing the hole sending message cicuit`, (): void => {
    let loginAck: Function | null;
    let chatRoomAck: Function | null;
    let startChatAck: Function | null;
    const roomId = '0000';
    const message = 'Hello, user 2!';
    const client1 = new Client(userId_1);
    mockedSocket.on.mockImplementation((event: string, listener: (...arg: any[]) => any): any => {
      if (event === 'LOGIN_ACK')
        loginAck = listener;
      if (event === 'START_CHAT_ACK') {
        startChatAck = listener;
      }
      if (event === 'CHAT_ROOM_ACK')
        chatRoomAck = listener;
    });

    client1.login();
    if (loginAck)
      loginAck('ok');
    expect(mockedSocket.emit).toHaveBeenCalledWith('LOGIN', client1.showInformation());

    client1.startChatWith(userId_2);
    if (startChatAck)
      startChatAck(roomId);
    client1.sendMessageTo(userId_2, message);
    if (chatRoomAck)
      chatRoomAck('ok');
  });
  test(`Test${testNumber++}: a client should be able to received  message`, (): void => {
    let callback: Function | null;
    const message = {
      'roomId': '0000',
      'senderId': userId_2,
      'receiverId': userId_1,
      'message': 'Hello, user 1!'
    };
    mockedSocket.on.mockImplementation((event: string, listener: (...args: any[]) => any): any => {
      if (event === 'RECEIVE_MESSAGE')
        callback = listener;
    });
    const client = new Client(userId_1);
    client.login();
    expect(client.messages().size).toEqual(0);
    if (callback)
      callback(message);
    let resultMessages = client.messages();
    expect(resultMessages.size).toEqual(1);
    expect(resultMessages.get(userId_2)).toEqual([message])
    if (callback)
      callback({
        'roomId': '0000',
        'senderId': userId_2,
        'receiverId': userId_1,
        'message': 'Hi! again'
      });
    resultMessages = client.messages();
    expect(resultMessages.size).toEqual(1);
    expect(resultMessages.get(userId_2)?.length).toEqual(2);
  });
}); 
