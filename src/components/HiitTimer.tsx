"use client";

import { useState, useEffect, useRef } from "react";
import { submitHiitLogAction } from "@/actions/logActions";

const PREP_TIME = 3; // 待機時間を3秒に変更
const WORK_TIME = 20;
const REST_TIME = 10;
const TOTAL_SETS = 8;

export default function HiitTimer({ onStateChange }: { onStateChange?: (running: boolean) => void }) {
  const [phase, setPhase] = useState<"idle" | "prep" | "work" | "rest" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API on first user interaction to bypass autoplay restrictions
  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playBeep = (type: "short" | "long" | "done" | "start") => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    // Resume context if suspended (often needed on iOS/Mac Safari)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    if (type === "start") {
      // 短く高い音で開始を知らせる（同時にAudioContextをアンロック）
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "short") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "long") {
      osc.type = "square";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === "done") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.4);
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.0);
    }
  };

  // Sync phase state up to parent for navigation locking
  useEffect(() => {
    if (onStateChange) {
      onStateChange(phase !== "idle" && phase !== "done");
    }
  }, [phase, onStateChange]);

  // Request/Release Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && !wakeLockRef.current) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch (err) {
        console.error("Wake Lock error:", err);
      }
    };
    
    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };

    if (phase !== "idle" && phase !== "done") {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => { releaseWakeLock(); };
  }, [phase]);

  // Timer logic
  useEffect(() => {
    if (phase === "idle" || phase === "done" || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) {
          if (prev <= 4) playBeep("short"); // Beep at 3, 2, 1 (when prev is 4, 3, 2 and drops to 3, 2, 1)
          return prev - 1;
        }
        
        // Time is up (prev === 1, next is 0 but we transition)
        playBeep("long");
        
        if (phase === "prep") {
          setPhase("work");
          return WORK_TIME;
        } else if (phase === "work") {
          if (currentSet < TOTAL_SETS) {
            setPhase("rest");
            return REST_TIME;
          } else {
            setPhase("done");
            playBeep("done");
            return 0;
          }
        } else if (phase === "rest") {
          setPhase("work");
          setCurrentSet((s) => s + 1);
          return WORK_TIME;
        }
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentSet, isPaused]);

  // Handle completion API call
  useEffect(() => {
    if (phase === "done" && !isSubmitting) {
      const submitLog = async () => {
        try {
          setIsSubmitting(true);
          const now = new Date();
          const dateStr = now.toLocaleDateString('ja-JP').split('/').join('-');
          const timeStr = now.toLocaleTimeString('ja-JP', { hour12: false });
          const timestamp = `${dateStr} ${timeStr}`;
          
          await submitHiitLogAction(dateStr, timestamp);
        } catch (error) {
          console.error("Failed to save HIIT log:", error);
        } finally {
          setIsSubmitting(false);
        }
      };
      submitLog();
    }
  }, [phase, isSubmitting]);

  const getPhaseColor = () => {
    if (isPaused) return "var(--text-muted)";
    switch(phase) {
      case "prep": return "var(--timer-ready)";
      case "work": return "var(--timer-work)";
      case "rest": return "var(--timer-rest)";
      case "done": return "var(--accent-color)";
      default: return "var(--bg-color-base)";
    }
  };

  const getPhaseText = () => {
    if (isPaused) return "PAUSED";
    switch(phase) {
      case "prep": return "READY";
      case "work": return "WORK!";
      case "rest": return "REST";
      case "done": return "COMPLETED";
      default: return "TABATA";
    }
  };

  const startTimer = () => {
    initAudioContext();
    // Mac Safari対策でクリックイベント内で直接（同期的に）音を鳴らす
    playBeep("start");
    setPhase("prep");
    setTimeLeft(PREP_TIME);
    setCurrentSet(1);
    setIsPaused(false);
  };

  const handleCancelClick = () => {
    setIsPaused(true);
    setShowConfirm(true);
  };

  const confirmCancel = () => {
    setShowConfirm(false);
    setIsPaused(false);
    setPhase("idle");
    setCurrentSet(1);
    setTimeLeft(0);
  };

  const resumeFromCancel = () => {
    setShowConfirm(false);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      position: "relative",
      padding: "24px 24px 0 24px"
    }}>
      {/* 確認モーダル */}
      {showConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 100
        }}>
          <div style={{
            background: "var(--glass-bg)", padding: "32px", borderRadius: "24px",
            border: "1px solid var(--glass-border)", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ marginBottom: "24px", fontSize: "1.5rem", fontWeight: "bold" }}>本当に終了しますか？</h2>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
              <button 
                onClick={resumeFromCancel} 
                style={{ padding: "16px 32px", borderRadius: "16px", background: "var(--glass-border)", color: "white", fontWeight: "bold", fontSize: "1.1rem" }}
              >
                終了しない
              </button>
              <button 
                onClick={confirmCancel} 
                style={{ padding: "16px 32px", borderRadius: "16px", background: "#ef4444", color: "white", fontWeight: "bold", fontSize: "1.1rem" }}
              >
                終了する
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: getPhaseColor(),
        opacity: phase === "idle" ? 0 : (isPaused ? 0.05 : 0.15),
        transition: "background-color 0.5s, opacity 0.5s",
        pointerEvents: "none",
        zIndex: -1
      }} />

      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h2 style={{ fontSize: "1.75rem", color: "var(--text-muted)", letterSpacing: "2px", marginBottom: "8px", fontWeight: "bold" }}>
          SET {currentSet} / {TOTAL_SETS}
        </h2>
        <h1 style={{ fontSize: "3.5rem", fontWeight: "900", letterSpacing: "2px", color: phase !== "idle" ? getPhaseColor() : "inherit" }}>
          {getPhaseText()}
        </h1>
      </div>

      <div style={{
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `8px solid ${phase === "idle" ? "var(--glass-border)" : getPhaseColor()}`,
        boxShadow: phase !== "idle" ? (isPaused ? "none" : `0 0 60px ${getPhaseColor()}40`) : "0 0 30px rgba(0,0,0,0.5) inset",
        background: phase === "idle" ? "transparent" : "rgba(0,0,0,0.2)",
        backdropFilter: "blur(10px)",
        transition: "all 0.5s ease-in-out",
        marginBottom: "auto",
        marginTop: "20px"
      }}>
        {phase === "idle" ? (
          <span style={{ fontSize: "5.5rem", fontWeight: "900", color: "var(--text-muted)", letterSpacing: "-2px" }}>4:00</span>
        ) : (
          <span style={{ fontSize: "8rem", fontWeight: "900", letterSpacing: "-4px", opacity: isPaused ? 0.5 : 1 }}>{timeLeft}</span>
        )}
      </div>

      <div style={{ width: "100%", marginTop: "auto", marginBottom: "0px" }}>
        {phase === "idle" || phase === "done" ? (
          <button
            onClick={startTimer}
            disabled={isSubmitting}
            style={{
              width: "100%",
              height: "88px",
              borderRadius: "24px",
              background: "white",
              color: "black",
              fontSize: "1.8rem",
              fontWeight: "900",
              letterSpacing: "4px",
              boxShadow: "0 12px 40px rgba(255,255,255,0.2)",
              opacity: isSubmitting ? 0.7 : 1,
              border: "none"
            }}
          >
            {isSubmitting ? "SAVING..." : phase === "done" ? "RESTART" : "START"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: "16px", width: "100%" }}>
            <button
              onClick={togglePause}
              style={{
                flex: 1,
                height: "88px",
                borderRadius: "24px",
                background: isPaused ? "var(--timer-ready)" : "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                color: isPaused ? "black" : "white",
                fontSize: "1.4rem",
                fontWeight: "bold",
                backdropFilter: "blur(12px)",
                transition: "all 0.3s ease"
              }}
            >
              {isPaused ? "RESUME" : "PAUSE"}
            </button>
            <button
              onClick={handleCancelClick}
              style={{
                flex: 1,
                height: "88px",
                borderRadius: "24px",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                color: "var(--timer-rest)",
                fontSize: "1.4rem",
                fontWeight: "bold",
                backdropFilter: "blur(12px)"
              }}
            >
              CANCEL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
