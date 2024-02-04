import { Injectable, forwardRef } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketService } from 'src/socket/socket.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class RoomService {
    constructor(
        private readonly socketService: SocketService,
        private readonly jwtService: JwtService,
        private readonly authService: AuthService,
    ){}


    @SubscribeMessage('room-leave')
    handleRoomLeave(socket: Socket, data: any): void {
        const { roomId } = data;

        const activeRoom = this.socketService.getActiveRoom(roomId);

        if (activeRoom) {
            this.socketService.leaveActiveRoom(roomId, socket.id);

            const updatedActiveRoom = this.socketService.getActiveRoom(roomId);

            if (updatedActiveRoom) {
            updatedActiveRoom.participants.forEach((participant) => {
                socket.to(participant.socketId).emit("room-participant-left", {
                connUserSocketId: socket.id,
                });
            });
            }

            this.updateRooms(null);
        }
    }

    updateRooms(socketId: string) {
        const io = this.socketService.getSocketServerInstance();
        const activeRooms = this.socketService.getActiveRooms();

        if (socketId) {
            io.to(socketId).emit("active-rooms", {
            activeRooms,
            });
        } else {
            io.emit("active-rooms", {
            activeRooms,
            });
        }
    }
}
