type LoginInfo = {
  userId: string;
  userName: string | undefined;
  userEmail: string | undefined;
};
type UserId = string;
type Message = {
  roomId: string;
  senderId: string;
  receiverId: string;
  message: string;
};
type RoomId = string;
type SignupInfo = {
  userName: string;
  userEmail: string;
};
export type { LoginInfo, SignupInfo, UserId, Message, RoomId };
