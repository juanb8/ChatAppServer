import type { UserRepository } from "../../../../src/domain/repositories/UserRepository.domain";
export function createMockUserRepository(emitValue: boolean = true): jest.Mocked<UserRepository> {
  const userRepository = {
    loginUser: jest
      .fn()
      .mockImplementation(async (_userId: string): Promise<boolean> => {
        return Promise.resolve(emitValue);
      }),
  }
  return userRepository;
}
