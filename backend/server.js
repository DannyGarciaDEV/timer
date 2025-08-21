import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json()); // Parse JSON bodies

// Queue and timer state
let queue = [];
let currentUser = null;
let timeLeft = 600;

// ---- REST Endpoints ----

// Get current state
app.get("/state", (req, res) => {
  res.json({ queue, currentUser, timeLeft });
});

// Add user
app.post("/addUser", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  queue.push(name);
  res.json({ queue, currentUser, timeLeft });
});

// Start next user
app.post("/startNext", (req, res) => {
  currentUser = queue.shift() || null;
  timeLeft = 600;
  res.json({ queue, currentUser, timeLeft });
});

// Update timer
app.post("/updateTime", (req, res) => {
  const { time } = req.body;
  if (time == null) return res.status(400).json({ error: "Time required" });

  timeLeft = time;
  res.json({ queue, currentUser, timeLeft });
});

// Serve React frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "photoism-app", "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "photoism-app", "build", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
