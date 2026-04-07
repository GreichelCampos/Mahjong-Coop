import { Server as SocketIOServer, Socket } from "socket.io";
import { createGame, addPlayer, removePlayer, selectTile } from "./game";

let gameState = createGame(15);

export function setupSocket(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {
    console.log("Jugador conectado:", socket.id);

    socket.on("player:join", (name: string) => {
      gameState = addPlayer(gameState, socket.id, name);

      io.emit("game:state", gameState);
    });

    socket.on("tile:select", (tileId: string) => {
      const result = selectTile(gameState, tileId, socket.id);
      gameState = result.newState;

      io.emit("game:state", gameState);
    });

    socket.on("disconnect", () => {
      console.log("Jugador desconectado:", socket.id);

      gameState = removePlayer(gameState, socket.id);

      io.emit("game:state", gameState);
    });
  });
}
