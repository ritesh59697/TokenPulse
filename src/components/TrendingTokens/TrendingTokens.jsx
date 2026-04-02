import React, { useState } from "react";
import { ArrowUpDown, Flame, Zap, BarChart2 } from "lucide-react";
import { formatPrice, formatLargeNumber, formatPercent, isPositive } from "../../utils/format";

const TABS = ["Market", "DexScreener"];
const COLS_MARKET = ["#", "Token", "Price", "24h", "Volume", "Market Cap"];
const COLS_DEX = ["Token", "Price", "24h", "Volume", "Liquidity", "Txns 24h"];

function DexRow({ coin, onClick, hovered, onHover, onLeave }) {
  const pos = isPositive(coin.price_change_percentage_24h);
  const chainColors = { ethereum: "#627eea", solana: "#9945ff", bsc: "#f0b90b" };
  const chainColor = chainColors[coin.chainId] || "#4b5563";

  return (
    <tr onClick={onClick} onMouseEnter={onHover} onMouseLeave={onLeave}
      style={{ cursor: "pointer", background: hovered ? "rgba(59,130,246,0.04)" : "transparent", transition: "background 0.15s", borderBottom: "1px solid rgba(30,45,69,0.5)" }}>
      <td style={{ padding: "12px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: chainColor + "22", border: `1px solid ${chainColor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: chainColor }}>
            {coin.symbol?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: hovered ? "#60a5fa" : "var(--text1)", transition: "color 0.15s" }}>{coin.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--text2)", textTransform: "uppercase" }}>{coin.symbol}</span>
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: chainColor + "22", color: chainColor, fontWeight: 600 }}>{coin.chainId}</span>
            </div>
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 20px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: "var(--text1)" }}>{formatPrice(coin.current_price)}</td>
      <td style={{ padding: "12px 20px", textAlign: "right" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: pos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: pos ? "#22c55e" : "#ef4444", border: `1px solid ${pos ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
          {formatPercent(coin.price_change_percentage_24h)}
        </span>
      </td>
      <td style={{ padding: "12px 20px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--text2)" }}>{formatLargeNumber(coin.total_volume)}</td>
      <td style={{ padding: "12px 20px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--text2)" }}>{formatLargeNumber(coin.liquidity)}</td>
      <td style={{ padding: "12px 20px", textAlign: "right" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "var(--text1)" }}>{coin.txns24h?.toLocaleString()}</span>
          <div style={{ display: "flex", gap: 4, fontSize: 10 }}>
            <span style={{ color: "#22c55e" }}>B:{coin.buys24h}</span>
            <span style={{ color: "#ef4444" }}>S:{coin.sells24h}</span>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function TrendingTokens({ coins, dexTokens, dexLoading, loading, onSelectCoin }) {
  const [tab, setTab] = useState("Market");
  const [sortKey, setSortKey] = useState("market_cap_rank");
  const [sortDir, setSortDir] = useState("asc");
  const [hovered, setHovered] = useState(null);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...coins].sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === "asc" ? va - vb : vb - va;
  });

  const SORT_KEYS = ["market_cap_rank", "name", "current_price", "price_change_percentage_24h", "total_volume", "market_cap"];

  return (
    <div className="card fade-in fade-in-3">
      <div style={{ padding: "20px 16px 0", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {tab === "Market"
            ? <Flame size={14} style={{ color: "#f97316" }} />
            : <Zap size={14} style={{ color: "#8b5cf6" }} />}
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {tab === "Market" ? "Trending Tokens" : "DexScreener Discovery"}
          </span>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 2, background: "var(--bg)", borderRadius: 10, padding: 3, border: "1px solid var(--card-border)", marginLeft: "auto", width: "fit-content" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              background: tab === t ? (t === "DexScreener" ? "#8b5cf6" : "#3b82f6") : "transparent",
              color: tab === t ? "white" : "var(--text2)",
              transition: "all 0.2s",
            }}>{t}</button>
          ))}
        </div>

        <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "var(--muted)" }}>
          {tab === "Market" ? coins.length : dexTokens.length} assets
        </span>
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {tab === "Market" ? (
          <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", marginTop: 16 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                {COLS_MARKET.map((col, i) => (
                  <th key={col} onClick={() => toggleSort(SORT_KEYS[i])}
                    style={{ padding: "10px 16px", textAlign: i >= 2 ? "right" : "left", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--text2)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid color-mix(in srgb, var(--card-border) 70%, transparent)" }}>
                      {[24, 120, 80, 60, 90, 90].map((w, j) => (
                        <td key={j} style={{ padding: "14px 16px" }}>
                          <div className="skeleton" style={{ height: 14, width: w, borderRadius: 4 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : sorted.slice(0, 25).map((coin) => {
                    const pos = isPositive(coin.price_change_percentage_24h);
                    const isHov = hovered === coin.id;
                    return (
                      <tr key={coin.id} onClick={() => onSelectCoin?.(coin)}
                        onMouseEnter={() => setHovered(coin.id)} onMouseLeave={() => setHovered(null)}
                        style={{ cursor: "pointer", background: isHov ? "rgba(59,130,246,0.04)" : "transparent", transition: "background 0.15s", borderBottom: "1px solid color-mix(in srgb, var(--card-border) 70%, transparent)" }}>
                        <td style={{ padding: "13px 16px", fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--text2)" }}>{coin.market_cap_rank}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <img src={coin.image} alt={coin.name}
                              style={{ width: 28, height: 28, borderRadius: "50%", border: isHov ? "1px solid rgba(59,130,246,0.4)" : "1px solid var(--card-border)", transition: "border-color 0.2s" }}
                              onError={e => e.target.style.display = "none"} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: isHov ? "#60a5fa" : "var(--text1)", transition: "color 0.15s" }}>{coin.name}</div>
                              <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "var(--text2)", textTransform: "uppercase" }}>{coin.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 500, color: "var(--text1)" }}>{formatPrice(coin.current_price)}</td>
                        <td style={{ padding: "13px 16px", textAlign: "right" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: pos ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: pos ? "#22c55e" : "#ef4444", border: `1px solid ${pos ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
                            {formatPercent(coin.price_change_percentage_24h)}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--text2)" }}>{formatLargeNumber(coin.total_volume)}</td>
                        <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--text2)" }}>{formatLargeNumber(coin.market_cap)}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        ) : (
          <table style={{ width: "100%", minWidth: 780, borderCollapse: "collapse", marginTop: 16 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                {COLS_DEX.map((col, i) => (
                  <th key={col} style={{ padding: "10px 16px", textAlign: i === 0 ? "left" : "right", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dexLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid color-mix(in srgb, var(--card-border) 70%, transparent)" }}>
                      {[160, 80, 60, 90, 80, 70].map((w, j) => (
                        <td key={j} style={{ padding: "14px 16px" }}>
                          <div className="skeleton" style={{ height: 14, width: w, borderRadius: 4, marginLeft: j > 0 ? "auto" : 0 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : dexTokens.map((coin, i) => (
                    <DexRow
                      key={coin.id + i}
                      coin={coin}
                      onClick={() => onSelectCoin?.(coin)}
                      hovered={hovered === coin.id + i}
                      onHover={() => setHovered(coin.id + i)}
                      onLeave={() => setHovered(null)}
                    />
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Click hint */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--card-border)", textAlign: "center" }}>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          {tab === "DexScreener" ? "DexScreener · Live DEX pairs across Ethereum, Solana, BSC" : "Click any token to view detailed chart & stats"}
        </span>
      </div>
    </div>
  );
}
