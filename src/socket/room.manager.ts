import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomManager {
  private roomData: Record<string, Room> = {};
  private static CREATOR_PLAYER_ID = 1;

  addCreatorToRoom(roomId: string, socketId: string, userId: string) {
    const createrPlayerId = RoomManager.CREATOR_PLAYER_ID;
    this.roomData[roomId] = {
      creator: { socketId, playerId: createrPlayerId, userId },
      players: [],
    };
    this.roomData[roomId].players.push({ socketId, playerId: createrPlayerId, userId });
    return createrPlayerId;
  }

  addPlayerToRoom(roomId: string, socketId: string, userId: string) {
    if (!this.roomData[roomId]) {
      throw new Error(`Room ${roomId} does not exist.`);
    }

    // 같은 userId를 가진 플레이어가 이미 존재하는지 확인
    for (let player of this.roomData[roomId].players) {
      if (player.userId === userId) {
        return player.playerId;
      }
    }
    const playerId: number = this.generatePlayerId(roomId);
    this.roomData[roomId].players.push({ socketId, playerId, userId });
    return playerId;
  }

  getRoomData(roomId: string): Room | undefined {
    return this.roomData[roomId];
  }

  getPlayersInRoom(roomId: string) {
    return this.roomData[roomId].players;
  }

  generatePlayerId(roomId: string) {
    return this.roomData[roomId].players.length + 1;
  }

  getCreatorInRoom(roomId: string) {
    return this.roomData[roomId].creator;
  }

  getPlayerByUserId(roomId: string, userId: string) {
    const room = this.roomData[roomId];
    if (!room) {
      return null;
    }

    // playerId가 일치하는 객체를 찾아 반환
    for (let player of room.players) {
      if (player.userId === userId) {
        return player;
      }
    }

    return null;
  }

  getRoomDataLength() {
    return Object.keys(this.roomData).length;
  }
}
