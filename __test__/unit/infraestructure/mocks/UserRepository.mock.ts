import type { UserRepository } from "../../../../src/domain/repositories/UserRepository.domain";
import type { LoginInfo, SignupInfo, UserId } from "../../../../src/infraestructure/schemas/Message-schema";
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
    signUp: jest.fn().mockImplementation(async (_userInfo: SignupInfo): Promise<UserId> => {
      return Promise.resolve('0000');
    }),
    checkForUserId: jest.fn().mockImplementation(async (_userId: UserId): Promise<boolean> => {
      return Promise.resolve(true);
    }),
  }
  return userRepository;
}
