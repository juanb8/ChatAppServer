import type { UserRepository } from "../../../../src/domain/repositories/UserRepository.domain";
export function createMockUserRepository(emitValue: boolean = true, isUserNameTaken: boolean = false, isEmailTaken: boolean = false): jest.Mocked<UserRepository> {
  const userRepository = {
    loginUser: jest
      .fn()
      .mockImplementation(async (_userId: string): Promise<boolean> => {
        return Promise.resolve(emitValue);
      }),
    checkForUserName: jest.fn().mockImplementation(async (_userName: string): Promise<boolean> => {
      return Promise.resolve(isUserNameTaken);
    }),
    checkForEmail: jest.fn().mockImplementation(async (_userName: string): Promise<boolean> => {
      return Promise.resolve(isEmailTaken);
    }),
  }
  return userRepository;
}
