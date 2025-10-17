import type { LoginInfo, SignupInfo, UserId } from "../../infraestructure/schemas/Message-schema";
import type { User } from "../entities/User.entity";

export interface UserRepository {
  loginUser: (_user: string) => Promise<boolean>;
  checkForUserName: (_userName: string) => Promise<boolean>;
  checkForEmail: (_email: string) => Promise<boolean>;
  signUp: (_userInfo: SignupInfo) => Promise<UserId>;
  checkForUserId: (_userId: UserId) => Promise<boolean>;
}
