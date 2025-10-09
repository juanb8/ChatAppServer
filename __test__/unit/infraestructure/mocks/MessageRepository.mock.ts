import type { MessageRepository } from "../../../../src/domain/repositories/MessageRepository.domain";

export function createMessageRepository(): jest.Mocked<MessageRepository> {
  const mockMessageRepository = {
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
  return mockMessageRepository;
}
