import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { GameState } from "../types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
const DEFAULT_ROOM_ID = "GLOBAL";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const roomIdRef = useRef("");
  const playerNameRef = useRef("");

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      const socket = io(SERVER_URL);
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Conectado al server:", socket.id);
        if (socket.id) {
          setSocketId(socket.id);
        }
        setIsConnected(true);

        if (roomIdRef.current && playerNameRef.current) {
          socket.emit(
            "room:join",
            { roomId: roomIdRef.current, name: playerNameRef.current },
            (response: { ok: boolean; error?: string }) => {
              if (!response?.ok) {
                setGameState(null);
                setRoomId("");
                roomIdRef.current = "";
              }
            },
          );
        }
      });

      socket.on("disconnect", () => {
        console.log("Desconectado");
        setIsConnected(false);
      });

      socket.on("game:state", (state: GameState) => {
        console.log("Nuevo estado recibido:", state);
        setGameState(state);
      });
    }
  }, []);

  const createRoom = (maxPlayers: number): Promise<string> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve(DEFAULT_ROOM_ID);
        return;
      }

      socketRef.current.emit(
        "room:create",
        { maxPlayers },
        (response: { roomId: string }) => {
          const nextRoomId = response.roomId.toUpperCase();
          setRoomId(nextRoomId);
          roomIdRef.current = nextRoomId;
          resolve(nextRoomId);
        }
      );
    });
  };

  const joinGame = (
    name: string,
    nextRoomId?: string
  ): Promise<{ ok: boolean; roomId: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ ok: false, roomId: nextRoomId || roomId || DEFAULT_ROOM_ID });
        return;
      }

      const finalRoomId = (nextRoomId || roomId || DEFAULT_ROOM_ID).toUpperCase();

      socketRef.current.emit(
        "room:join",
        { roomId: finalRoomId, name },
        (response: { ok: boolean; error?: string }) => {
          if (response?.ok) {
            setRoomId(finalRoomId);
            roomIdRef.current = finalRoomId;
            playerNameRef.current = name;
          } else if (roomIdRef.current === finalRoomId) {
            setRoomId("");
            setGameState(null);
            roomIdRef.current = "";
          }

          resolve({
            ok: response?.ok ?? false,
            roomId: finalRoomId,
          });
        }
      );
    });
  };

  const selectTile = (tileId: number) => {
    if (!socketRef.current) return;

    socketRef.current.emit("tile:select", tileId);
  };

  const resetGame = (): Promise<{ ok: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ ok: false, error: "Sin conexion" });
        return;
      }

      socketRef.current.emit("game:reset", (response: { ok: boolean; error?: string }) => {
        resolve(response ?? { ok: false, error: "No response" });
      });
    });
  };

  const shuffleGame = (): Promise<{ ok: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ ok: false, error: "Sin conexion" });
        return;
      }

      socketRef.current.emit("game:shuffle", (response: { ok: boolean; error?: string }) => {
        resolve(response ?? { ok: false, error: "No response" });
      });
    });
  };

  const undoMove = (): Promise<{ ok: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ ok: false, error: "Sin conexion" });
        return;
      }

      socketRef.current.emit("game:undo", (response: { ok: boolean; error?: string }) => {
        resolve(response ?? { ok: false, error: "No response" });
      });
    });
  };

  const startGame = (): Promise<{ ok: boolean; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve({ ok: false, error: "Sin conexion" });
        return;
      }

      socketRef.current.emit("game:start", (response: { ok: boolean; error?: string }) => {
        resolve(response ?? { ok: false, error: "No response" });
      });
    });
  };

  const leaveRoom = () => {
    if (!socketRef.current) return;

    socketRef.current.emit("room:leave");
    setGameState(null);
    setRoomId('');
    roomIdRef.current = "";
    playerNameRef.current = "";
  };

  return {
    gameState,
    isConnected,
    socketId,
    roomId,
    createRoom,
    joinGame,
    selectTile,
    startGame,
    resetGame,
    shuffleGame,
    undoMove,
    leaveRoom,
  };
};
