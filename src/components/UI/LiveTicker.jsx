import React from "react";
import { useAnimatedPrice, formatAnimatedPrice, priceColor } from "../../hooks/useAnimatedPrice";

function CryptoTickerItem({ coin, wsPrice }) {
  const price  = wsPrice?.price  ?? coin.current_price;
  const change = wsPrice?.change24h ?? coin.price_change_percentage_24h;
  const pos    = (change ?? 0) >= 0;
  const { displayValue, flash } = useAnimatedPrice(price, 400);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "0 20px", borderRight: "1px solid var(--card-border)",
      flexShrink: 0, transition: "background 0.3s",
      background: flash === "up"
        ? "color-mix(in srgb, var(--positive) 8%, transparent)"
        : flash === "down"
        ? "color-mix(in srgb, var(--negative) 8%, transparent)"
        : "transparent",
    }}>
      {coin.image && (
        <img src={coin.image} alt={coin.symbol}
          style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0 }}
          onError={e => e.target.style.display = "none"} />
      )}
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", flexShrink: 0 }}>
        {coin.symbol?.toUpperCase()}
      </span>
      {/* ✅ Uses priceColor() — no more hardcoded white */}
      <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 500, flexShrink: 0, color: priceColor(flash), transition: "color 0.4s" }}>
        {formatAnimatedPrice(displayValue)}
      </span>
      {change != null && (
        <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, color: pos ? "var(--positive)" : "var(--negative)" }}>
          {pos ? "▲" : "▼"} {Math.abs(Number(change)).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

function CommodityTickerItem({ commodity }) {
  const { displayValue, flash } = useAnimatedPrice(commodity?.current_price, 400);
  const pos = (commodity?.change_percent ?? 0) >= 0;
  if (!commodity?.available) return null;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "0 20px", borderRight: "1px solid var(--card-border)",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 12 }}>{commodity.icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>{commodity.symbol}</span>
      <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: priceColor(flash) }}>
        {formatAnimatedPrice(displayValue)}
      </span>
      {commodity.change_percent != null && (
        <span style={{ fontSize: 10, fontWeight: 700, color: pos ? "var(--positive)" : "var(--negative)" }}>
          {pos ? "▲" : "▼"} {Math.abs(commodity.change_percent).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

export default function LiveTicker({ coins, wsPrices, connected, commodities = [] }) {
  const PRIORITY = ["bitcoin","ethereum","solana","binancecoin","dogecoin","tether","ripple"];
  const tickerCoins = [
    ...PRIORITY.map(id => coins.find(c => c.id === id)).filter(Boolean),
    ...coins.filter(c => !PRIORITY.includes(c.id)).slice(0, 8),
  ].slice(0, 15);

  const availComm = commodities.filter(c => c.available);
  const duration  = (tickerCoins.length + availComm.length) * 3.5;
  const items     = [...tickerCoins.map(c => ({ type: "crypto", coin: c })), ...availComm.map(c => ({ type: "commodity", commodity: c }))];
  const allItems  = [...items, ...items, ...items];

  return (
    <div style={{
      borderBottom: "1px solid var(--card-border)",
      background: "var(--ticker-bg)",
      overflow: "hidden", position: "relative",
      height: 34, display: "flex", alignItems: "center",
      transition: "background 0.3s, border-color 0.3s",
    }}>
      {/* LIVE badge */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 10,
        display: "flex", alignItems: "center", gap: 5, padding: "0 14px",
        background: "linear-gradient(90deg, var(--ticker-bg) 65%, transparent 100%)",
        pointerEvents: "none",
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: "50%",
          background: connected ? "var(--positive)" : "var(--muted)",
          boxShadow: connected ? "0 0 6px var(--positive)" : "none",
          animation: connected ? "livePulse 2s ease-in-out infinite" : "none",
          display: "inline-block",
        }} />
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: connected ? "var(--positive)" : "var(--muted)" }}>
          {connected ? "LIVE" : "—"}
        </span>
      </div>

      {/* Scrolling track */}
      <div style={{
        display: "flex", alignItems: "center", paddingLeft: 64,
        animation: `tickerMove ${duration}s linear infinite`,
        willChange: "transform", width: "max-content",
      }}>
        {allItems.map((item, i) =>
          item.type === "crypto"
            ? <CryptoTickerItem key={`c-${item.coin.id}-${i}`} coin={item.coin} wsPrice={wsPrices?.[item.coin.id]} />
            : <CommodityTickerItem key={`m-${item.commodity.id}-${i}`} commodity={item.commodity} />
        )}
      </div>

      {/* Fade right */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(270deg, var(--ticker-bg) 30%, transparent 100%)", pointerEvents: "none", zIndex: 5 }} />

      <style>{`
        @keyframes tickerMove { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        @keyframes livePulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
