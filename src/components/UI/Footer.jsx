import React from "react";
import { Zap, Wifi, Radio } from "lucide-react";
import { timeAgo } from "../../utils/format";

export default function Footer({ lastUpdated, error, onRefetch, dataSource, wsConnected }) {
  return (
    <footer style={{
      borderTop: "1px solid var(--card-border)",
      marginTop: 40, padding: "20px 24px",
      transition: "border-color 0.3s",
    }}>
      <div style={{
        maxWidth: 1440, margin: "0 auto",
        display: "flex", flexWrap: "wrap",
        alignItems: "center", justifyContent: "space-between",
        gap: 12,
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={12} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>TokenPulse</span>
          </div>
          {dataSource && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
              <Wifi size={10} /> {dataSource}
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: wsConnected ? "var(--positive)" : "var(--muted)" }}>
            <Radio size={10} />
            {wsConnected ? "Binance WS connected" : "Reconnecting…"}
          </span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {error && (
            <span style={{ fontSize: 11, color: "var(--negative)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--negative)", display: "inline-block" }} />
              {error}
            </span>
          )}
          {lastUpdated && (
            <span style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--positive)", display: "inline-block", animation: "pulseDot 2s ease-in-out infinite" }} />
              {timeAgo(lastUpdated)}
            </span>
          )}
          <button onClick={onRefetch}
            style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid var(--card-border)", background: "transparent", color: "var(--text2)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--text1)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--card-border)"; e.currentTarget.style.color = "var(--text2)"; }}>
            Refresh
          </button>
        </div>
      </div>
    </footer>
  );
}
