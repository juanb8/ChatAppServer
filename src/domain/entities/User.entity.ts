export interface User {
  handleSignUp: () => Promise<void>;
  message: () => string;
};
