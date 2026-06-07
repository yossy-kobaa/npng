"use client";

import { useState } from "react";
import MorningLog from "@/components/MorningLog";
import HiitTimer from "@/components/HiitTimer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"timer" | "log">("timer");
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const handleTabClick = (tab: "timer" | "log") => {
    if (isTimerRunning) {
      alert("タイマー実行中は切り替えできません。");
      return;
    }
    setActiveTab(tab);
  };

  return (
    <>
      <main className="app-container">
        {activeTab === "timer" ? (
          <HiitTimer onStateChange={(running) => setIsTimerRunning(running)} />
        ) : (
          <MorningLog />
        )}
      </main>
      
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === "timer" ? "active" : ""}`}
          onClick={() => handleTabClick("timer")}
          style={{ opacity: isTimerRunning && activeTab !== "timer" ? 0.5 : 1 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          HIIT Timer
        </button>
        <button 
          className={`nav-item ${activeTab === "log" ? "active" : ""}`}
          onClick={() => handleTabClick("log")}
          style={{ opacity: isTimerRunning ? 0.5 : 1 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Morning Log
        </button>
      </nav>
    </>
  );
}
