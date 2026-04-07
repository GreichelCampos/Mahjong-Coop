import { Server as SocketIOServer, Socket } from "socket.io";
import { createGame, addPlayer, removePlayer, selectTile } from "./game";
import type { GameState } from "./types";

const rooms: Record<string, GameState> = {};

function generateRoomId(): string {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}

function ensureUniqueRoomId(): string {
  let roomId = generateRoomId();
  while (rooms[roomId]) {
    roomId = generateRoomId();
  }
  return roomId;
}


function broadcastRoomState(io: SocketIOServer, roomId: string): void {
  const gameState = rooms[roomId];
  if (!gameState) return;

  io.to(roomId).emit("game:state", gameState);
  console.log(`[${roomId}] Estado actualizado - ${gameState.players.length} jugadores`);
}

function cleanupEmptyRoom(io: SocketIOServer, roomId: string): void {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  const isEmpty = !roomSockets || roomSockets.size === 0;

  if (isEmpty && rooms[roomId]) {
    delete rooms[roomId];
    console.log(`[${roomId}] Sala eliminada (vacía)`);
  }
}

export function setupSocket(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {
    console.log(`[CONNECT] Socket ${socket.id} conectado`);

    
    socket.on("room:create", (callback?: (data: { roomId: string }) => void) => {
      const roomId = ensureUniqueRoomId();

      rooms[roomId] = createGame(15);

      socket.join(roomId);
      socket.data.roomId = roomId;

      io.to(roomId).emit("game:state", rooms[roomId]);

      if (typeof callback === "function") {
        callback({ roomId });
      }

      console.log(`[${roomId}] Sala creada por ${socket.id}`);
    });

    
    socket.on(
      "room:join",
      (
        payload: { roomId: string; name: string },
        callback?: (data: { ok: boolean; error?: string }) => void,
      ) => {
        const { roomId, name } = payload;

        if (!rooms[roomId]) {
          if (typeof callback === "function") {
            callback({ ok: false, error: "Sala no encontrada" });
          }
          console.log(`[${roomId}] Intento de unión fallido: sala no existe`);
          return;
        }

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.playerName = name;

        rooms[roomId] = addPlayer(rooms[roomId], socket.id, name);

        broadcastRoomState(io, roomId);

        if (typeof callback === "function") {
          callback({ ok: true });
        }

        console.log(`[${roomId}] ${name} (${socket.id}) se unió`);
      },
    );

    
    socket.on(
      "tile:select",
      (
        payload: { tileId: string },
        callback?: (data: { ok: boolean; error?: string }) => void,
      ) => {
        const roomId = socket.data.roomId as string | undefined;
        const { tileId } = payload;

        // Validar que está en una sala
        if (!roomId || !rooms[roomId]) {
          if (typeof callback === "function") {
            callback({ ok: false, error: "No estás en una sala válida" });
          }
          return;
        }

        const result = selectTile(rooms[roomId], tileId, socket.id);
        rooms[roomId] = result.newState;

        // Emitir SOLO a esa sala usando io.to(roomId)
        io.to(roomId).emit("game:state", rooms[roomId]);

        // Feedback al cliente
        if (typeof callback === "function") {
          callback({ ok: true });
        }

        console.log(`[${roomId}] Tile ${tileId} seleccionado por ${socket.id}`);
      },
    );

   
    socket.on("disconnect", () => {
      const roomId = socket.data.roomId as string | undefined;
      const playerName = socket.data.playerName as string | undefined;

      if (roomId && rooms[roomId]) {
        rooms[roomId] = removePlayer(rooms[roomId], socket.id);

        broadcastRoomState(io, roomId);

        cleanupEmptyRoom(io, roomId);
      }

      console.log(
        `[DISCONNECT] ${playerName ?? socket.id} desconectado de ${roomId ?? "sin sala"}`,
      );
    });

    
    socket.on("room:leave", () => {
      const roomId = socket.data.roomId as string | undefined;
      const playerName = socket.data.playerName as string | undefined;

      if (roomId && rooms[roomId]) {
        rooms[roomId] = removePlayer(rooms[roomId], socket.id);
        broadcastRoomState(io, roomId);
        cleanupEmptyRoom(io, roomId);

        socket.leave(roomId);
        delete socket.data.roomId;
      }

      console.log(`[${roomId}] ${playerName ?? socket.id} abandonó la sala`);
    });
  });
}
