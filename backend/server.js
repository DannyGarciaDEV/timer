import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Middleware
app.use(cors());
app.use(express.json());

let queue = [];
let currentUser = null;
let timeLeft = 600;

// ===== REST API with Axios support =====
app.get("/queue", (req, res) => {
  res.json({ queue, currentUser, timeLeft });
});

app.post("/addUser", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  queue.push(name);
  io.emit("stateUpdate", { queue, currentUser, timeLeft });
  res.json({ success: true });
});

// ===== Socket.IO =====
io.on("connection", (socket) => {
  console.log("New client connected");

  // Send current state
  socket.emit("stateUpdate", { queue, currentUser, timeLeft });

  socket.on("addUser", (name) => {
    queue.push(name);
    io.emit("stateUpdate", { queue, currentUser, timeLeft });
  });

  socket.on("startNext", () => {
    currentUser = queue.shift() || null;
    timeLeft = 600;
    io.emit("stateUpdate", { queue, currentUser, timeLeft });
  });

  socket.on("updateTime", (time) => {
    timeLeft = time;
    io.emit("stateUpdate", { queue, currentUser, timeLeft });
  });

  socket.on("disconnect", () => console.log("Client disconnected"));
});

// ===== Start server =====
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
