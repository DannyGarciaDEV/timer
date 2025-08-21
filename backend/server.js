import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // allow all for now
  },
});

let queue = [];
let currentUser = null;
let timeLeft = 600;

io.on("connection", (socket) => {
  console.log("New client connected");

  // Send current state to new client
  socket.emit("stateUpdate", { queue, currentUser, timeLeft });

  // Listen for new user
  socket.on("addUser", (name) => {
    queue.push(name);
    io.emit("stateUpdate", { queue, currentUser, timeLeft });
  });

  // Start next user
  socket.on("startNext", () => {
    currentUser = queue.shift() || null;
    timeLeft = 600;
    io.emit("stateUpdate", { queue, currentUser, timeLeft });
  });

  // Timer tick
  socket.on("updateTime", (time) => {
    timeLeft = time;
    io.emit("stateUpdate", { queue, currentUser, timeLeft });
  });

  socket.on("disconnect", () => console.log("Client disconnected"));
});

httpServer.listen(3000, () => console.log("Server running on port 3000"));
