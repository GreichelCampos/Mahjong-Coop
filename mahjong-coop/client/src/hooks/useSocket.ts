import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { GameState } from "../types";

const SERVER_URL = "http://localhost:3000";
const DEFAULT_ROOM = "GLOBAL";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState(DEFAULT_ROOM);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Conectado al server:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Desconectado");
      setIsConnected(false);
    });

    socket.on("game:state", (state: GameState) => {
      console.log("Nuevo estado recibido:", state);
      setGameState(state);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve(DEFAULT_ROOM);
        return;
      }

      socketRef.current.emit(
        "room:create",
        (response: { roomCode: string }) => {
          const nextRoomCode = response.roomCode.toUpperCase();
          setRoomCode(nextRoomCode);
          resolve(nextRoomCode);
        }
      );
    });
  };

  const joinGame = (
    name: string,
    nextRoomCode?: string
  ): Promise<{ ok: boolean; roomCode: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ ok: false, roomCode });
        return;
      }

      const finalRoomCode = (nextRoomCode || roomCode || DEFAULT_ROOM).toUpperCase();

      socketRef.current.emit(
        "player:join",
        { name, roomCode: finalRoomCode },
        (response: { ok: boolean; roomCode: string }) => {
          if (response?.ok) {
            setRoomCode(response.roomCode.toUpperCase());
          }

          resolve({
            ok: response?.ok ?? false,
            roomCode: response?.roomCode?.toUpperCase() ?? finalRoomCode,
          });
        }
      );
    });
  };

  const selectTile = (tileId: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit("tile:select", {
      tileId,
      roomCode,
    });
  };

  const leaveRoom = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("room:leave");
    setGameState(null);
    setRoomCode(DEFAULT_ROOM);
  };

  return {
    socket: socketRef.current,
    gameState,
    isConnected,
    roomCode,
    createRoom,
    joinGame,
    selectTile,
    leaveRoom,
  };
};