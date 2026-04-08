import { Server as SocketIOServer, Socket } from "socket.io";
import {
  addPlayer,
  cloneGameState,
  createGame,
  removePlayer,
  resetGame,
  reshuffleTiles,
  selectTile,
  startGame,
} from "./game";
import type { GameState } from "./types";

const rooms: Record<string, GameState> = {};
const roomHistory: Record<string, GameState[]> = {};
const HISTORY_LIMIT = 20;

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
    const winner = gameState.players.reduce((max, player) =>
      player.score > max.score ? player : max,
    );

    io.to(roomId).emit("game:over", {
      winner: { id: winner.id, name: winner.name, score: winner.score },
      finalScores: gameState.players.map((player) => ({
        id: player.id,
        name: player.name,
        score: player.score,
      })),
    });

    console.log(`[${roomId}] Juego terminado. Ganador: ${winner.name}`);
  }
}

function cleanupEmptyRoom(io: SocketIOServer, roomId: string): void {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  const isEmpty = !roomSockets || roomSockets.size === 0;

  if (isEmpty && rooms[roomId]) {
    delete rooms[roomId];
    delete roomHistory[roomId];
    console.log(`[${roomId}] Sala eliminada (vacia)`);
  }
}

function pushRoomHistory(roomId: string): void {
  const roomState = rooms[roomId];
  if (!roomState) return;

  const snapshots = roomHistory[roomId] ?? [];
  snapshots.push(cloneGameState(roomState));

  if (snapshots.length > HISTORY_LIMIT) {
    snapshots.shift();
  }

  roomHistory[roomId] = snapshots;
}

export function setupSocket(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {
    console.log(`[CONNECT] Socket ${socket.id} conectado`);

    socket.on(
      "room:create",
      (
        payload?: { maxPlayers?: number },
        callback?: (data: { roomId: string }) => void,
      ) => {
      const oldRoomId = socket.data.roomId as string | undefined;

      if (oldRoomId && rooms[oldRoomId]) {
        socket.leave(oldRoomId);
        rooms[oldRoomId] = removePlayer(rooms[oldRoomId], socket.id);
        broadcastRoomState(io, oldRoomId);
        cleanupEmptyRoom(io, oldRoomId);
      }

      const roomId = ensureUniqueRoomId();
      const maxPlayers = Math.max(1, Math.min(4, payload?.maxPlayers ?? 2));
      rooms[roomId] = createGame(15, maxPlayers);
      roomHistory[roomId] = [];

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerName = `Player_${socket.id.substring(0, 4)}`;

      io.to(roomId).emit("game:state", rooms[roomId]);
      callback?.({ roomId });

      console.log(`[${roomId}] Sala creada por ${socket.id}`);
      },
    );

    const handleRoomJoin = (
      payload: { roomId: string; name: string } | string,
      callback?: (data: { ok: boolean; error?: string }) => void,
    ) => {
      let roomId: string;
      let name: string;

      if (typeof payload === "string") {
        name = payload;
        roomId = (socket.data.roomId as string | undefined) || "";
      } else {
        roomId = payload.roomId;
        name = payload.name;
      }

      if (!rooms[roomId]) {
        callback?.({ ok: false, error: "Sala no encontrada" });
        console.log(`[${roomId}] Intento de union fallido: sala no existe`);
        return;
      }

      const connectedPlayers = rooms[roomId].players.filter((player) => player.isConnected);
      if (connectedPlayers.length >= rooms[roomId].maxPlayers) {
        callback?.({ ok: false, error: "La sala ya esta llena" });
        console.log(`[${roomId}] Intento de union fallido: sala llena`);
        return;
      }

      const playerExists = rooms[roomId].players.some((player) => player.id === socket.id);
      if (playerExists) {
        callback?.({ ok: true });
        broadcastRoomState(io, roomId);
        return;
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerName = name;

      rooms[roomId] = addPlayer(rooms[roomId], socket.id, name);
      broadcastRoomState(io, roomId);
      callback?.({ ok: true });

      console.log(`[${roomId}] ${name} (${socket.id}) se unio`);
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
        const tileIdRaw =
          typeof payload === "string" || typeof payload === "number" ? payload : payload.tileId;
        const tileId = typeof tileIdRaw === "string" ? parseInt(tileIdRaw, 10) : tileIdRaw;

        if (!roomId || !rooms[roomId]) {
          callback?.({ ok: false, error: "No estas en una sala valida" });
          return;
        }

        if (rooms[roomId].isGameOver) {
          callback?.({ ok: false, error: "El juego ya termino" });
          return;
        }

        const result = selectTile(rooms[roomId], tileId, socket.id);

        if (result.newState !== rooms[roomId]) {
          pushRoomHistory(roomId);
          rooms[roomId] = result.newState;
          broadcastRoomState(io, roomId);
        }

        callback?.({ ok: true });

        if (result.event) {
          io.to(roomId).emit("tile:event", {
            event: result.event,
            tileId,
            playerId: socket.id,
          });
        }
      },
    );

    socket.on("game:reset", (callback?: (data: { ok: boolean; error?: string }) => void) => {
      const roomId = socket.data.roomId as string | undefined;

      if (!roomId || !rooms[roomId]) {
        callback?.({ ok: false, error: "No estas en una sala valida" });
        return;
      }

      roomHistory[roomId] = [];
      rooms[roomId] = resetGame(rooms[roomId]);
      broadcastRoomState(io, roomId);
      callback?.({ ok: true });
    });

    socket.on("game:start", (callback?: (data: { ok: boolean; error?: string }) => void) => {
      const roomId = socket.data.roomId as string | undefined;

      if (!roomId || !rooms[roomId]) {
        callback?.({ ok: false, error: "No estas en una sala valida" });
        return;
      }

      if (rooms[roomId].hostId !== socket.id) {
        callback?.({ ok: false, error: "Solo el anfitrion puede iniciar" });
        return;
      }

      const connectedPlayers = rooms[roomId].players.filter((player) => player.isConnected);
      if (connectedPlayers.length < rooms[roomId].maxPlayers) {
        callback?.({ ok: false, error: "Faltan jugadores para iniciar" });
        return;
      }

      rooms[roomId] = startGame(rooms[roomId]);
      broadcastRoomState(io, roomId);
      io.to(roomId).emit("game:started", { roomId });
      callback?.({ ok: true });
    });

    socket.on("game:shuffle", (callback?: (data: { ok: boolean; error?: string }) => void) => {
      const roomId = socket.data.roomId as string | undefined;

      if (!roomId || !rooms[roomId]) {
        callback?.({ ok: false, error: "No estas en una sala valida" });
        return;
      }

      if (rooms[roomId].isGameOver) {
        callback?.({ ok: false, error: "El juego ya termino" });
        return;
      }

      pushRoomHistory(roomId);
      rooms[roomId] = reshuffleTiles(rooms[roomId]);
      broadcastRoomState(io, roomId);
      callback?.({ ok: true });
    });

    socket.on("game:undo", (callback?: (data: { ok: boolean; error?: string }) => void) => {
      const roomId = socket.data.roomId as string | undefined;

      if (!roomId || !rooms[roomId]) {
        callback?.({ ok: false, error: "No estas en una sala valida" });
        return;
      }

      const snapshots = roomHistory[roomId] ?? [];
      const previousState = snapshots.pop();

      if (!previousState) {
        callback?.({ ok: false, error: "No hay movimientos para deshacer" });
        return;
      }

      const currentConnections = new Map(
        rooms[roomId].players.map((player) => [player.id, player.isConnected]),
      );

      rooms[roomId] = {
        ...cloneGameState(previousState),
        players: previousState.players.map((player) => ({
          ...player,
          isConnected: currentConnections.get(player.id) ?? player.isConnected,
        })),
      };

      roomHistory[roomId] = snapshots;
      broadcastRoomState(io, roomId);
      callback?.({ ok: true });
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

      console.log(`[${roomId}] ${playerName ?? socket.id} abandono la sala`);
    });
  });
}
