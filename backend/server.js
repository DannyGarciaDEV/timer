import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

let queue = [];
let currentUser = null;
let timeLeft = 600;

io.on("connection", (socket) => {
  console.log("New client connected");

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

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
