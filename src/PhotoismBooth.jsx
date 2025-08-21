import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./PhotoismBooth.css";
import kpopHeader from "./assets/kpop.webp";

const socket = io(import.meta.env.VITE_API_URL || "https://naratiger.up.railway.app");

function PhotoismBooth() {
  const [queue, setQueue] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showFullScreenMessage, setShowFullScreenMessage] = useState(false);
  const timerRef = useRef(null);

  // Socket.IO updates
  useEffect(() => {
    socket.on("stateUpdate", ({ queue, currentUser, timeLeft }) => {
      setQueue(queue);
      setCurrentUser(currentUser);
      setTimeLeft(timeLeft);
    });
    return () => socket.off("stateUpdate");
  }, []);

  // Timer
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          socket.emit("updateTime", newTime);
          return newTime;
        });
      }, 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && currentUser) {
      alert(`${currentUser}'s session ended!`);
      startNext();
    }
  }, [timeLeft]);

  // Add user via Axios
  const addUser = async () => {
    if (!nameInput.trim()) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "https://naratiger.up.railway.app"}/addUser`, { name: nameInput.trim() });
      setNameInput("");
      setShowFullScreenMessage(true);
      setTimeout(() => setShowFullScreenMessage(false), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const startNext = () => { socket.emit("startNext"); setIsRunning(false); };
  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const formatTime = seconds => `${Math.floor(seconds/60)}:${(seconds%60).toString().padStart(2,"0")}`;

  return (
    <div className="booth-container">
      {showFullScreenMessage && <div className="fullscreen-message">Please follow the instructions of Photoism or ask KPN staff.</div>}

      <header className="booth-header">
        <img src={kpopHeader} alt="K-pop Header" className="kpop-header-img" />
      </header>

      <h1>Photoism Booth</h1>
      <div className="booth-main">
        <div className="booth-content">
          <h2>Current User: {currentUser || "Nobody waiting"}</h2>
          <div className="timer">{currentUser ? formatTime(timeLeft) : "Waiting..."}</div>

          <div className="controls">
            <button onClick={startTimer} disabled={!currentUser || isRunning}>Start</button>
            <button onClick={pauseTimer} disabled={!isRunning}>Pause</button>
            <button onClick={startNext}>Next</button>
          </div>

          <h3>Queue:</h3>
          <ul className="queue-list">{queue.map((name, idx) => <li key={idx}>{name}</li>)}</ul>

          <input type="text" value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Enter your name" />
          <button onClick={addUser}>Add</button>
        </div>
      </div>
    </div>
  );
}

export default PhotoismBooth;
