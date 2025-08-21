import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./PhotoismBooth.css";
import kpopHeader from "./assets/kpop.webp";

const API_URL = import.meta.env.VITE_API_URL || "https://naratiger.up.railway.app";

function PhotoismBooth() {
  const [queue, setQueue] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showFullScreenMessage, setShowFullScreenMessage] = useState(false);

  const timerRef = useRef(null);

  // Fetch initial state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await axios.get(`${API_URL}/state`);
        setQueue(res.data.queue);
        setCurrentUser(res.data.currentUser);
        setTimeLeft(res.data.timeLeft);
      } catch (err) {
        console.error(err);
      }
    };
    fetchState();
  }, []);

  // Timer interval
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(async () => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          axios.post(`${API_URL}/updateTime`, { time: newTime }).catch(console.error);
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && currentUser) {
      alert(`${currentUser}'s session ended!`);
      startNext();
    }
  }, [timeLeft]);

  // Add user
  const addUser = async () => {
    if (!nameInput.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/addUser`, { name: nameInput.trim() });
      setQueue(res.data.queue);
      setNameInput("");
      setShowFullScreenMessage(true);
      setTimeout(() => setShowFullScreenMessage(false), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  // Start next user
  const startNext = async () => {
    try {
      const res = await axios.post(`${API_URL}/startNext`);
      setQueue(res.data.queue);
      setCurrentUser(res.data.currentUser);
      setTimeLeft(res.data.timeLeft);
      setIsRunning(false);
    } catch (err) {
      console.error(err);
    }
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
          <ul className="queue-list">{queue.map((name, idx) => <li key={idx}>{name}</li>)}</ul>

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
