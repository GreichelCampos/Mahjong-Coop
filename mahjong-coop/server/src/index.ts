import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { setupSocket } from "./socket";

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_URLS = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  return CLIENT_URLS.includes(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    port: PORT,
    clientUrl: CLIENT_URLS,
  });
});

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupSocket(io);

const server = httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS enabled for: ${CLIENT_URLS.join(", ")}`);
});

const gracefulShutdown = () => {
  console.log("\n[SHUTDOWN] Cerrando servidor...");

  io.disconnectSockets();

  server.close(() => {
    console.log("[SHUTDOWN] Servidor cerrado.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("[SHUTDOWN] Forzando salida...");
    process.exit(1);
  }, 5000);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
