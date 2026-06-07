"use client";

import { useState } from "react";
import { submitMorningLogAction } from "@/actions/logActions";

export default function MorningLog() {
  const [sleep, setSleep] = useState(7.0);
  const [condition, setCondition] = useState<number>(3);
  const [weight, setWeight] = useState("65.0"); // デフォルト値（前回データ想定）
  const [fat, setFat] = useState("20.0"); // デフォルト値（前回データ想定）
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSave = async () => {
    try {
      setStatus("loading");
      const now = new Date();
      // YYYY-MM-DD
      const dateStr = now.toLocaleDateString('ja-JP').split('/').join('-');
      // YYYY-MM-DD HH:mm:ss
      const timeStr = now.toLocaleTimeString('ja-JP', { hour12: false });
      const timestamp = `${dateStr} ${timeStr}`;

      await submitMorningLogAction({
        date: dateStr,
        sleepHours: sleep,
        condition,
        weight: parseFloat(weight),
        bodyFat: parseFloat(fat),
        timestamp,
      });

      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", height: "100%" }}>
      <header>
        <h1 style={{ fontSize: "2.2rem", fontWeight: "900", marginBottom: "8px", letterSpacing: "-0.5px" }}>Morning Log</h1>
      </header>

      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <label style={{ fontWeight: "600", color: "var(--text-muted)" }}>睡眠時間</label>
          <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--accent-color)" }}>{sleep.toFixed(1)} h</span>
        </div>
        <input 
          type="range" 
          min="0" max="12" step="0.5" 
          value={sleep} 
          onChange={(e) => setSleep(parseFloat(e.target.value))} 
        />
      </div>

      <div className="glass-panel" style={{ padding: "24px" }}>
        <label style={{ display: "block", marginBottom: "20px", fontWeight: "600", color: "var(--text-muted)" }}>コンディション</label>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star}
              onClick={() => setCondition(star)}
              style={{
                fontSize: "3rem",
                color: condition >= star ? "var(--timer-ready)" : "var(--glass-border)",
                transform: condition === star ? "scale(1.1)" : "scale(1)",
                transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px" }}>
        <div className="glass-panel" style={{ padding: "20px", flex: 1 }}>
          <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "var(--text-muted)" }}>体重 (kg)</label>
          <input 
            type="number" 
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="glass-panel" style={{ padding: "20px", flex: 1 }}>
          <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "var(--text-muted)" }}>体脂肪率 (%)</label>
          <input 
            type="number" 
            step="0.1"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
          />
        </div>
      </div>

      <button 
        disabled={status === "loading" || status === "success"}
        style={{
          marginTop: "auto",
          padding: "20px",
          borderRadius: "20px",
          background: status === "success" ? "var(--timer-ready)" : status === "error" ? "var(--timer-rest)" : "var(--accent-color)",
          color: "#000",
          fontSize: "1.2rem",
          fontWeight: "bold",
          boxShadow: status === "success" ? "none" : "0 8px 24px rgba(74, 222, 128, 0.4)",
          opacity: status === "loading" ? 0.7 : 1,
          transition: "all 0.3s ease"
        }}
        onClick={handleSave}
      >
        {status === "idle" && "SAVE"}
        {status === "loading" && "SAVING..."}
        {status === "success" && "✓ SAVED!"}
        {status === "error" && "ERROR - TRY AGAIN"}
      </button>
    </div>
  );
}
