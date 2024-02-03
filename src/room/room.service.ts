import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConnectedSocket, SubscribeMessage } from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { userDocument } from 'src/auth/user.schema';
import { SocketService } from 'src/socket/socket.service';
import { JwtStrategy } from 'src/auth/provider/jwt.strategy';
import { UserSocket } from 'src/socket/interface/user.handshake';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { SocketGateway } from 'src/socket/socket.gateway';
import cryptoRandomString from 'crypto-random-string';

@Injectable()
export class RoomService {
    constructor(
        private readonly socketService: SocketService,
        private readonly jwtService: JwtService,
        private readonly authService: AuthService,
    ){}

    

    @SubscribeMessage('room-join')
    async handleRoomJoin(socket: Socket, data: any): Promise<void> {
        const { roomId } = data;
        // const userSocket = socket as UserSocket;

        const token = socket.handshake.auth?.token;
        // console.log(token)
        const userId = this.jwtService.verify(token);
        const user = await this.authService.validate(userId);

        const participantDetails = {
            userId: user._id.toString(),
            socketId: socket.id,
        };

        const roomDetails = this.socketService.getActiveRoom(roomId);
        this.socketService.joinActiveRoom(roomId, participantDetails);

        // send information to users in room that they should prepare for incoming connection
        roomDetails.participants.forEach((participant) => {
            if (participant.socketId !== participantDetails.socketId) {
            socket.to(participant.socketId).emit("conn-prepare", {
                connUserSocketId: participantDetails.socketId,
            });
            }
        });

        this.updateRooms(null);
    }

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
