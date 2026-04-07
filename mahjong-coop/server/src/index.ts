import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { setupSocket } from "./socket";

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    port: PORT,
    clientUrl: CLIENT_URL,
  });
});

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupSocket(io);

// Crear servidor con opciones para reutilizar puerto en caso de cierre inesperado
const server = httpServer.listen(PORT, '127.0.0.1', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`CORS enabled for: ${CLIENT_URL}`);
});

server.on('listening', () => {
  const socket = (server as any)._server;
  if (socket) {
    socket.setsockopt?.(1, 15, 1); 
  }
});

const gracefulShutdown = () => {
  console.log('\n[SHUTDOWN] Cerrando servidor...');
  

  io.disconnectSockets();
  

  server.close(() => {
    console.log('[SHUTDOWN] Servidor cerrado.');
    process.exit(0);
  });


  setTimeout(() => {
    console.error('[SHUTDOWN] Forzando salida...');
    process.exit(1);
  }, 5000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
