import type { UserRepository } from "../../domain/repositories/UserRepository.domain";
import type { User } from "../../domain/entities/User.entity";
import type { SignupInfo } from "../schemas/Message-schema";
import { user_name_already_taken, user_email_already_sign_up, correct_signup_message } from "../messages/server_messages";
class ValidUser implements User {
  constructor(private userRepository: UserRepository, private signupInfo: SignupInfo) { };
  async handleSignUp(): Promise<void> {
    const userId = await this.userRepository.signUp(this.signupInfo);
  };
  message(): string {
    return correct_signup_message;
  };
};
class UserInvalidUserName implements User {
  constructor(private _userRepository: UserRepository, private _signupInfo: SignupInfo) { };
  async handleSignUp(): Promise<void> {
  };
  message(): string {
    return user_name_already_taken;
  };
};
class UserInvalidUserEmail implements User {
  constructor(private _userRepository: UserRepository, private _signupInfo: SignupInfo) { };
  async handleSignUp(): Promise<void> {
  };
  message(): string {
    return user_email_already_sign_up;
  };
};

async function userFactory(userRepository: UserRepository, signupInfo: SignupInfo): Promise<User> {
  const isUserNameTaken = await userRepository.checkForUserName(signupInfo.userName);
  if (isUserNameTaken) return new UserInvalidUserName(userRepository, signupInfo);
  const isEmailTaken = await userRepository.checkForEmail(signupInfo.userEmail);
  if (isEmailTaken) return new UserInvalidUserEmail(userRepository, signupInfo);
  return new ValidUser(userRepository, signupInfo);
};
export { userFactory };

