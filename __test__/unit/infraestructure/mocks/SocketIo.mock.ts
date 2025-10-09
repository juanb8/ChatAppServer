import { Server, Socket } from "socket.io";

// Mock Socket instance
export const createMockSocket = (): jest.Mocked<Socket> => {
  const mockSocket = {
    id: "mock-socket-id",
    connected: true,
    disconnected: false,

    // Mock event listeners
    on: jest.fn((event: string, callback: Function) => {
      callback();
      return mockSocket;
    }),

    // Mock event emitters
    emit: jest.fn((event: string, ...args: any[]) => {
      return mockSocket;
    }),

    // Mock other commonly used socket methods
    join: jest.fn((room: string) => mockSocket),
    leave: jest.fn((room: string) => mockSocket),
    to: jest.fn((room: string) => mockSocket),
    disconnect: jest.fn((close?: boolean) => mockSocket),
    broadcast: {
      to: jest.fn((room: string) => ({
        emit: jest.fn(),
      })),
    },
  } as any;

  return mockSocket;
};
//
// Mock Socket.IO Server
export const createMockServer = (): jest.Mocked<Server> => {
  const mockServer = {
    // Server event handling
    on: jest.fn((event: string, callback: (socket: Socket) => void) => {
      return mockServer;
    }),

    // Emit to all connected clients
    emit: jest.fn((event: string, ...args: any[]) => {
      return mockServer;
    }),

    // Room management
    to: jest.fn((room: string) => mockServer),
    in: jest.fn((room: string) => mockServer),

    // Socket management
    sockets: {
      sockets: new Map(),
      emit: jest.fn(),
      in: jest.fn(() => ({ emit: jest.fn() })),
      to: jest.fn(() => ({ emit: jest.fn() })),
    },

    // Mock other commonly used server methods
    of: jest.fn((namespace: string) => mockServer),
    close: jest.fn(),
    adapter: {
      rooms: new Map(),
      sockets: new Map(),
    } as any,
  } as any;

  return mockServer;
};
