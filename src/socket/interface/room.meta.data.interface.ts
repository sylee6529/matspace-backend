interface Player {
  socketId: string;
  playerId: number;
  userId: string;
}

interface Room {
  creator: Player;
  players: Player[];
}
