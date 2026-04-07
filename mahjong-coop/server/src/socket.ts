import { Server as SocketIOServer, Socket } from "socket.io";
import { createGame, addPlayer, removePlayer, selectTile } from "./game";
import type { GameState } from "./types";

type JoinPayload =
  | string
  | {
      name: string;
      roomCode?: string;
    };

type SelectTilePayload =
  | string
  | {
      tileId: string;
      roomCode?: string;
    };

interface RoomState {
  code: string;
  gameState: GameState;
}

const DEFAULT_ROOM = "global";
const ROOM_CODE_LENGTH = 6;

const rooms = new Map<string, RoomState>();

function generateRoomCode(): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + ROOM_CODE_LENGTH)
    .toUpperCase();
}

function getOrCreateRoom(roomCode: string): RoomState {
  const normalizedCode = roomCode.toUpperCase();

  const existingRoom = rooms.get(normalizedCode);
  if (existingRoom) {
    return existingRoom;
  }

  const newRoom: RoomState = {
    code: normalizedCode,
    gameState: createGame(15),
  };

  rooms.set(normalizedCode, newRoom);
  return newRoom;
}

function emitRoomState(io: SocketIOServer, roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  io.to(roomCode).emit("game:state", room.gameState);
}

function cleanupRoomIfEmpty(io: SocketIOServer, roomCode: string): void {
  if (roomCode === DEFAULT_ROOM) return;

  const roomSockets = io.sockets.adapter.rooms.get(roomCode);
  if (!roomSockets || roomSockets.size === 0) {
    rooms.delete(roomCode);
    console.log(`Sala eliminada por quedar vacía: ${roomCode}`);
  }
}

export function setupSocket(io: SocketIOServer): void {
  getOrCreateRoom(DEFAULT_ROOM);

  io.on("connection", (socket: Socket) => {
    console.log("Jugador conectado:", socket.id);

    socket.on(
      "room:create",
      (callback?: (response: { roomCode: string }) => void) => {
        let roomCode = generateRoomCode();

        while (rooms.has(roomCode)) {
          roomCode = generateRoomCode();
        }

        getOrCreateRoom(roomCode);

        if (typeof callback === "function") {
          callback({ roomCode });
        }
      },
    );

    socket.on(
      "player:join",
      (
        payload: JoinPayload,
        callback?: (response: { ok: boolean; roomCode: string }) => void,
      ) => {
        const name = typeof payload === "string" ? payload : payload.name;
        const roomCode =
          typeof payload === "string"
            ? DEFAULT_ROOM
            : (payload.roomCode || DEFAULT_ROOM).toUpperCase();

        const room = getOrCreateRoom(roomCode);

        socket.join(roomCode);
        socket.data.roomCode = roomCode;
        socket.data.playerName = name;

        room.gameState = addPlayer(room.gameState, socket.id, name);

        emitRoomState(io, roomCode);

        if (typeof callback === "function") {
          callback({ ok: true, roomCode });
        }

        console.log(`Jugador ${name} unido a sala ${roomCode}`);
      },
    );

    socket.on("tile:select", (payload: SelectTilePayload) => {
      const tileId = typeof payload === "string" ? payload : payload.tileId;
      const roomCode =
        typeof payload === "string"
          ? (socket.data.roomCode as string | undefined) || DEFAULT_ROOM
          : (
              payload.roomCode ||
              socket.data.roomCode ||
              DEFAULT_ROOM
            ).toUpperCase();

      const room = rooms.get(roomCode);
      if (!room) return;

      const result = selectTile(room.gameState, tileId, socket.id);
      room.gameState = result.newState;

      emitRoomState(io, roomCode);
    });

    socket.on("room:leave", () => {
      const roomCode =
        (socket.data.roomCode as string | undefined) || DEFAULT_ROOM;
      const playerName = socket.data.playerName as string | undefined;

      const room = rooms.get(roomCode);
      if (room) {
        room.gameState = removePlayer(room.gameState, socket.id);
        emitRoomState(io, roomCode);
      }

      socket.leave(roomCode);
      cleanupRoomIfEmpty(io, roomCode);

      console.log(
        `Jugador ${playerName ?? socket.id} salió de sala ${roomCode}`,
      );
    });

    socket.on("disconnect", () => {
      const roomCode =
        (socket.data.roomCode as string | undefined) || DEFAULT_ROOM;
      const playerName = socket.data.playerName as string | undefined;

      const room = rooms.get(roomCode);
      if (room) {
        room.gameState = removePlayer(room.gameState, socket.id);
        emitRoomState(io, roomCode);
      }

      cleanupRoomIfEmpty(io, roomCode);

      console.log(
        `Jugador desconectado: ${playerName ?? socket.id} de sala ${roomCode}`,
      );
    });
  });
}
