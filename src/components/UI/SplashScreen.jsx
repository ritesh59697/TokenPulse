import React, { useEffect, useState } from "react";

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("visible");

  useEffect(() => {
    // Always dismiss after 2.5s regardless of data
    const t1 = setTimeout(() => setPhase("fading"), 1800);
    const t2 = setTimeout(() => {
      setPhase("done");
      onDone?.();
    }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // ← empty deps, runs once only

  if (phase === "done") return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0b0f19",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 28,
      transition: "opacity 0.6s ease",
      opacity: phase === "fading" ? 0 : 1,
      pointerEvents: phase === "fading" ? "none" : "all",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "#3b82f6",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 32px rgba(59,130,246,0.4)",
          animation: "splashPulse 1.8s ease-in-out infinite",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span style={{
          fontSize: 22, fontWeight: 700, color: "white",
          fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.5px",
        }}>
          Token<span style={{ color: "#3b82f6" }}>Pulse</span>
        </span>
      </div>

      <div style={{ position: "relative", width: 36, height: 36 }}>
        <div style={{
          position: "absolute", inset: 0,
          border: "2px solid rgba(59,130,246,0.15)",
          borderTopColor: "#3b82f6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>

      <div style={{
        fontSize: 12, color: "#4b5563",
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.1em", textTransform: "uppercase",
      }}>
        Fetching live market data
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes splashPulse {
          0%, 100% { box-shadow: 0 0 24px rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 40px rgba(59,130,246,0.6); }
        }
      `}</style>
    </div>
  );
}