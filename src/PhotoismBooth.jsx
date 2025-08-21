import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./PhotoismBooth.css";
import kpopHeader from "./assets/kpop.webp";

// Connect to your backend
const SOCKET_URL = import.meta.env.VITE_API_URL || "https://naratiger.up.railway.app";
const socket = io(SOCKET_URL, {
  transports: ["websocket"], // ensures WebSocket connection
});

function PhotoismBooth() {
  const [queue, setQueue] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showFullScreenMessage, setShowFullScreenMessage] = useState(false);

  const timerRef = useRef(null);

  // Debug connection
  useEffect(() => {
    socket.on("connect", () => console.log("Connected to backend!", socket.id));
    socket.on("connect_error", (err) => console.error("Connection error:", err));
    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, []);

  // Listen for state updates from backend
  useEffect(() => {
    socket.on("stateUpdate", ({ queue, currentUser, timeLeft }) => {
      setQueue(queue);
      setCurrentUser(currentUser);
      setTimeLeft(timeLeft);
    });

    return () => socket.off("stateUpdate");
  }, []);

  // Timer logic (only for the active session)
  useEffect(() => {
    if (isRunning && currentUser) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          socket.emit("updateTime", newTime); // sync with server
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, currentUser]);

  // Auto-next when timer reaches 0
  useEffect(() => {
    if (timeLeft <= 0 && currentUser) {
      alert(`${currentUser}'s session ended!`);
      startNext();
    }
  }, [timeLeft]);

  const addUser = () => {
    if (!nameInput.trim()) return;
    socket.emit("addUser", nameInput.trim());
    setNameInput("");
    setShowFullScreenMessage(true);
    setTimeout(() => setShowFullScreenMessage(false), 5000);
  };

  const startNext = () => {
    socket.emit("startNext");
    setIsRunning(false);
  };

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="booth-container">
      {showFullScreenMessage && (
        <div className="fullscreen-message">
          Please follow the instructions of Photoism or ask KPN staff.
        </div>
      )}

      <header className="booth-header">
        <img src={kpopHeader} alt="K-pop Header" className="kpop-header-img" />
      </header>

      <h1>Photoism Booth</h1>

      <div className="booth-main">
        <div className="booth-content">
          <h2>Current User: {currentUser || "Nobody waiting"}</h2>
          <div className="timer">{currentUser ? formatTime(timeLeft) : "Waiting..."}</div>

          <div className="controls">
            <button onClick={startTimer} disabled={!currentUser || isRunning}>
              Start
            </button>
            <button onClick={pauseTimer} disabled={!isRunning}>
              Pause
            </button>
            <button onClick={startNext}>Next</button>
          </div>

          <h3>Queue:</h3>
          <ul className="queue-list">
            {queue.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ul>

          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name"
          />
          <button onClick={addUser}>Add</button>
        </div>
      </div>
    </div>
  );
}

export default PhotoismBooth;
