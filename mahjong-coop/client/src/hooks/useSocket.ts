import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { GameState } from "../types";

const SERVER_URL = "http://localhost:3000";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL);

    socketRef.current = socket;

    // 🔌 Conexión
    socket.on("connect", () => {
      console.log("Conectado al server:", socket.id);
      setIsConnected(true);
    });

    // ❌ Desconexión
    socket.on("disconnect", () => {
      console.log("Desconectado");
      setIsConnected(false);
    });

    // 🎮 Estado del juego
    socket.on("game:state", (state: GameState) => {
      console.log("Nuevo estado recibido:", state);
      setGameState(state);
    });

    // 🧹 Limpieza al desmontar
    return () => {
      socket.disconnect();
    };
  }, []);

  // 👤 Unirse al juego
  const joinGame = (name: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit("player:join", name);
  };

  // 🎯 Seleccionar ficha
  const selectTile = (tileId: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit("tile:select", tileId);
  };

  return {
    gameState,
    isConnected,
    joinGame,
    selectTile,
  };
};
