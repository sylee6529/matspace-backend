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
