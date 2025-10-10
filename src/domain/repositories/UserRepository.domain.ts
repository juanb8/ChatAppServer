export interface UserRepository {
  loginUser: (_user: string) => Promise<boolean>;
  checkForUserName: (_userName: string) => Promise<boolean>;
  checkForEmail: (_email: string) => Promise<boolean>;
}
