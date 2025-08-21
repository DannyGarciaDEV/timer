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
let timeLeft = 600; // default 10 min

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Send current state to new client
  socket.emit("stateUpdate", { queue, currentUser, timeLeft });

  // Add a new user to the queue
  socket.on("addUser", (name) => {
    if (!name) return;
    queue.push(name);
    io.emit("stateUpdate", { queue, currentUser, timeLeft });
  });

  // Start next user
  socket.on("startNext", () => {
    currentUser = queue.shift() || null;
    timeLeft = 600;
    io.emit("stateUpdate", { queue, currentUser, timeLeft });
  });

  // Timer updates from client
  socket.on("updateTime", (time) => {
    if (typeof time === "number") {
      timeLeft = time;
      io.emit("stateUpdate", { queue, currentUser, timeLeft });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
