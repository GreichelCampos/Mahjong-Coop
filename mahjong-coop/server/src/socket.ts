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

  if (gameState.isGameOver) {
    const winner = gameState.players.reduce((max, p) =>
      p.score > max.score ? p : max,
    );
    io.to(roomId).emit("game:over", {
      winner: { id: winner.id, name: winner.name, score: winner.score },
      finalScores: gameState.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
      })),
    });
    console.log(`[${roomId}] ¡JUEGO TERMINADO! Ganador: ${winner.name}`);
  }
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
     
      const oldRoomId = socket.data.roomId as string | undefined;
      if (oldRoomId && rooms[oldRoomId]) {
        socket.leave(oldRoomId);
        rooms[oldRoomId] = removePlayer(rooms[oldRoomId], socket.id);
        broadcastRoomState(io, oldRoomId);
        cleanupEmptyRoom(io, oldRoomId);
      }

      const roomId = ensureUniqueRoomId();
      rooms[roomId] = createGame(15);

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerName = `Player_${socket.id.substring(0, 4)}`;

      // Emitir estado inicial a la sala
      io.to(roomId).emit("game:state", rooms[roomId]);

      if (typeof callback === "function") {
        callback({ roomId });
      }

      console.log(`[${roomId}] Sala creada por ${socket.id}`);
    });

    
    const handleRoomJoin = (
      payload: { roomId: string; name: string } | string,
      callback?: (data: { ok: boolean; error?: string }) => void,
    ) => {
    
      let roomId: string;
      let name: string;

      if (typeof payload === "string") {
       
        name = payload;
        roomId = socket.data.roomId as string | undefined || "";
      } else {
        roomId = payload.roomId;
        name = payload.name;
      }

      if (!rooms[roomId]) {
        if (typeof callback === "function") {
          callback({ ok: false, error: "Sala no encontrada" });
        }
        console.log(`[${roomId}] Intento de unión fallido: sala no existe`);
        return;
      }

      // Validar que el socket no esté ya en la sala (evitar duplicados)
      const playerExists = rooms[roomId].players.some((p) => p.id === socket.id);
      if (playerExists) {
        // Ya está en la sala, solo emitir el estado
        if (typeof callback === "function") {
          callback({ ok: true });
        }
        console.log(`[${roomId}] ${socket.id} ya estaba en la sala, se reenvía estado`);
        broadcastRoomState(io, roomId);
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
    };

    socket.on("room:join", handleRoomJoin);
    socket.on("player:join", handleRoomJoin);

   
    socket.on(
      "tile:select",
      (
        payload: string | number | { tileId: string | number },
        callback?: (data: { ok: boolean; error?: string }) => void,
      ) => {
        const roomId = socket.data.roomId as string | undefined;
        const tileIdRaw = typeof payload === "string" || typeof payload === "number" ? payload : payload.tileId;
        const tileId = typeof tileIdRaw === "string" ? parseInt(tileIdRaw, 10) : tileIdRaw;

        if (!roomId || !rooms[roomId]) {
          if (typeof callback === "function") {
            callback({ ok: false, error: "No estás en una sala válida" });
          }
          return;
        }

        if (rooms[roomId].isGameOver) {
          if (typeof callback === "function") {
            callback({ ok: false, error: "El juego ya terminó" });
          }
          return;
        }


        const result = selectTile(rooms[roomId], tileId, socket.id);
        rooms[roomId] = result.newState;

        broadcastRoomState(io, roomId);

        if (typeof callback === "function") {
          callback({ ok: true });
        }

        if (result.event) {
          io.to(roomId).emit("tile:event", {
            event: result.event,
            tileId,
            playerId: socket.id,
          });

          console.log(
            `[${roomId}] Tile ${tileId} por ${socket.id} -> ${result.event}`,
          );
        }
      },
    );

   
    socket.on("game:reset", (callback?: (data: { ok: boolean }) => void) => {
      const roomId = socket.data.roomId as string | undefined;

      if (!roomId || !rooms[roomId]) {
        if (typeof callback === "function") {
          callback({ ok: false });
        }
        return;
      }

      const currentRoomState = rooms[roomId];
      const newGameState = createGame(15);

      rooms[roomId] = {
        ...newGameState,
        players: currentRoomState.players.map((p) => ({
          ...p,
          score: 0, 
          isConnected: p.isConnected,
        })),
      };

      broadcastRoomState(io, roomId);

      if (typeof callback === "function") {
        callback({ ok: true });
      }

      console.log(`[${roomId}] Juego reiniciado`);
    });

    
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
        delete socket.data.playerName;
      }

      console.log(`[${roomId}] ${playerName ?? socket.id} abandonó la sala`);
    });
  });
}
