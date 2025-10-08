export interface UserRepository {
  loginUser: (_user: string) => Promise<boolean>;
}
