import { Socket } from 'socket.io';
import { User } from 'src/auth/user.schema';

export interface UserSocket extends Socket {
  user?: User;
}
