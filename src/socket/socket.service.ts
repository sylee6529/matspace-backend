import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class SocketService {
  private server: Server;
  // private activeConnections: Map<string, Set<string>> = new Map();
  // private readonly connectedUsers: Map<string, string> = new Map();
  // private activeRooms: any[] = [];

  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  // setSocketServerInstance(server: Server) {
  //   this.server = server;
  // }

  // getSocketServerInstance(): Server {
  //   return this.server;
  // }

  // addNewConnectedUser(socketId: string, userId: string): void {
  //   this.connectedUsers.set(socketId, userId);
  //   // console.log('new connected users');
  //   // console.log(this.connectedUsers);
  // }

  // removeConnectedUser(socketId: string): void {
  //   if (this.connectedUsers.has(socketId)) {
  //     this.connectedUsers.delete(socketId);
  //     //   console.log('new connected users');
  //     //   console.log(this.connectedUsers);
  //   }
  // }

  // getActiveConnections(userId: string): string[] {
  //   const activeConnections = [];

  //   this.connectedUsers.forEach((value, key) => {
  //     if (value === userId) {
  //       activeConnections.push(key);
  //     }
  //   });

  //   return activeConnections;
  // }

  // getOnlineUsers(): Array<{ socketId: string; userId: string }> {
  //   const onlineUsers = [];

  //   this.connectedUsers.forEach((value, key) => {
  //     onlineUsers.push({ socketId: key, userId: value });
  //   });

  //   return onlineUsers;
  // }

  // addNewActiveRoom(userId: string, socketId: string): any {
  //   const newActiveRoom = {
  //     roomCreator: { userId, socketId },
  //     participants: [{ userId, socketId }],
  //     roomId: uuidv4(),
  //   };

  //   this.activeRooms = [...this.activeRooms, newActiveRoom];
  //   return newActiveRoom;
  // }

  // getActiveRooms(): Array<any> {
  //   return [...this.activeRooms];
  // }

  // getActiveRoom(roomId: string): any | null {
  //   const activeRoom = this.activeRooms.find((activeRoom) => activeRoom.roomId === roomId);

  //   if (activeRoom) {
  //     return { ...activeRoom };
  //   } else {
  //     return null;
  //   }
  // }

  // joinActiveRoom(roomId: string, newParticipant: any): void {
  //   const room = this.activeRooms.find((room) => room.roomId === roomId);
  //   console.log('room has been found');

  //   this.activeRooms = this.activeRooms.filter((room) => room.roomId !== roomId);
  //   console.log(this.activeRooms);

  //   const updatedRoom = {
  //     ...room,
  //     participants: [...room.participants, newParticipant],
  //   };

  //   this.activeRooms.push(updatedRoom);
  // }

  // leaveActiveRoom(roomId: string, participantSocketId: string): void {
  //   const activeRoom = this.activeRooms.find((room) => room.roomId === roomId);

  //   if (activeRoom) {
  //     const copyOfActiveRoom = { ...activeRoom };

  //     copyOfActiveRoom.participants = copyOfActiveRoom.participants.filter(
  //       (participant) => participant.socketId !== participantSocketId,
  //     );

  //     this.activeRooms = this.activeRooms.filter((room) => room.roomId !== roomId);

  //     if (copyOfActiveRoom.participants.length > 0) {
  //       this.activeRooms.push(copyOfActiveRoom);
  //     }
  //   }
  // }

  // async updateFriends(userId: string): Promise<void> {
  //   try {
  //     // find active connections of specific id (online users)
  //     const receiverList = this.getActiveConnections(userId);

  //     if (receiverList.length > 0) {
  //       const user = this.authService.getUserPopulated(userId);
  //       if (user) {
  //         const friendsList = (await user).friends.map((f: any) => {
  //           return {
  //             id: f._id,
  //             mail: f.email,
  //             username: f.username,
  //           };
  //         });

  //         receiverList.forEach((receiverSocketId) => {
  //           this.server.on('friends-list', (socket) => {
  //             socket.to(receiverSocketId).emit('friends-list', {
  //               friends: friendsList ? friendsList : [],
  //             });
  //           });
  //           // to(receiverSocketId).emit("friends-list", {
  //           //     friends: friendsList ? friendsList : [],
  //           // });
  //         });
  //       }
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }
}
