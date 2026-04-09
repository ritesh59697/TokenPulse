import React, { useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw, BarChart2, AlertCircle, Loader, Database } from "lucide-react";
import { formatPercent, isPositive, timeAgo } from "../../utils/format";
import { useAnimatedPrice, formatAnimatedPrice } from "../../hooks/useAnimatedPrice";

function CommodityCard({ item }) {
  const [hovered, setHovered] = useState(false);
  const { displayValue, flash } = useAnimatedPrice(item.current_price, 600);
  const pos = isPositive(item.change_percent ?? 0);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--card)", borderRadius: 14, padding: 16,
        border: flash === "up" ? "1px solid rgba(34,197,94,0.4)" : flash === "down" ? "1px solid rgba(239,68,68,0.4)" : hovered ? `1px solid ${item.color}55` : "1px solid var(--card-border)",
        boxShadow: hovered ? `0 0 20px ${item.color}12` : "none",
        display: "flex", flexDirection: "column", gap: 10,
        transition: "all 0.25s", cursor: "default",
        position: "relative", overflow: "hidden", minHeight: 110,
      }}
    >
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 1, background: `linear-gradient(90deg, transparent, ${item.color}88, transparent)`, opacity: hovered ? 0.9 : 0.4, transition: "opacity 0.25s" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: item.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text1)", lineHeight: 1.2 }}>{item.name}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'DM Mono', monospace" }}>{item.symbol}</div>
          </div>
        </div>
        {item.fetching ? (
          <Loader size={12} style={{ color: item.color, animation: "spin 1s linear infinite", flexShrink: 0 }} />
        ) : item.source ? (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {item.fromCache && <span style={{ fontSize: 9, color: item.color, background: `${item.color}18`, padding: "1px 5px", borderRadius: 4 }}>CACHED</span>}
          </div>
        ) : null}
      </div>

      {/* Price */}
      {item.fetching ? (
        <div>
          <div className="skeleton" style={{ height: 22, width: 90, borderRadius: 4, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 10, width: 60, borderRadius: 4 }} />
        </div>
      ) : !item.available ? (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <AlertCircle size={11} style={{ color: "var(--muted)" }} />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>Unavailable</span>
        </div>
      ) : (
        <div>
          <div style={{
            fontSize: 20, fontWeight: 600, lineHeight: 1,
            fontFamily: "'DM Mono', monospace",
            color: flash === "up" ? "var(--positive)" : flash === "down" ? "var(--negative)" : "var(--text1)",
            transition: "color 0.4s",
          }}>
            {formatAnimatedPrice(displayValue ?? item.current_price)}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{item.unit}</span>
            {item.change_percent != null ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: pos ? "var(--positive)" : "var(--negative)", background: pos ? "color-mix(in srgb, var(--positive) 10%, transparent)" : "color-mix(in srgb, var(--negative) 10%, transparent)", border: `1px solid ${pos ? "color-mix(in srgb, var(--positive) 25%, transparent)" : "color-mix(in srgb, var(--negative) 25%, transparent)"}`, padding: "2px 7px", borderRadius: 100 }}>
                {pos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                {formatPercent(item.change_percent)}
              </span>
            ) : item.bid ? (
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'DM Mono', monospace" }}>
                Bid {formatAnimatedPrice(item.bid)}
              </span>
            ) : null}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function CommoditiesPanel({ commodities, loading, error, lastUpdated, refetch }) {
  const loadingCount   = commodities.filter(c => c.fetching).length;
  const availableCount = commodities.filter(c => c.available).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart2 size={14} style={{ color: "#f59e0b" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Commodities</span>
          <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", fontWeight: 600 }}>Alpha Vantage</span>
          {loadingCount > 0 && <span style={{ fontSize: 10, color: "var(--muted)" }}>{availableCount}/{commodities.length} loaded</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastUpdated && <span style={{ fontSize: 11, color: "var(--muted)" }}>{timeAgo(lastUpdated)}</span>}
          <button onClick={refetch}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, background: "transparent", border: "1px solid var(--card-border)", color: "var(--muted)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b44"; e.currentTarget.style.color = "#f59e0b"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--card-border)"; e.currentTarget.style.color = "var(--muted)"; }}>
            <RefreshCw size={10} /> Refresh
          </button>
        </div>
      </div>

      {loadingCount > 0 && (
        <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}>
          <Loader size={10} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
          Fetching sequentially to respect API rate limits…
        </div>
      )}

      {error && (
        <div style={{ background: "color-mix(in srgb, var(--negative) 5%, transparent)", border: "1px solid color-mix(in srgb, var(--negative) 20%, transparent)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--negative)" }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 12 }}>
        {commodities.map(item => <CommodityCard key={item.id} item={item} />)}
      </div>

      <div style={{ marginTop: 16, borderTop: "1px solid var(--card-border)", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Database size={10} style={{ color: "var(--muted)" }} />
        <span style={{ fontSize: 10, color: "var(--muted)" }}>Alpha Vantage commodity and spot feeds · Sequential loading · Cache 3min · Refresh 5min</span>
      </div>
    </div>
  );
}
