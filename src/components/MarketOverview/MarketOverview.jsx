import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, BarChart2, Activity } from "lucide-react";
import { formatLargeNumber, formatPercent, isPositive } from "../../utils/format";

// ── Inline animated price — no external hook dependency issue ──────────────
function useLocalAnimatedPrice(target) {
  const [display, setDisplay] = useState(null);
  const [flash, setFlash]     = useState(null);
  const prev    = useRef(null);
  const raf     = useRef(null);

  useEffect(() => {
    // target not ready yet — wait
    if (target == null || target === 0) return;

    // First time we get a real value — set instantly, no animation
    if (prev.current == null) {
      prev.current = target;
      setDisplay(target);
      return;
    }

    // Same value — nothing to do
    if (prev.current === target) return;

    // Animate from prev → target
    const from     = prev.current;
    const diff     = target - from;
    const duration = 500;
    let   start    = null;

    setFlash(diff > 0 ? "up" : "down");
    const flashTimer = setTimeout(() => setFlash(null), 800);

    if (raf.current) cancelAnimationFrame(raf.current);

    const step = (ts) => {
      if (!start) start = ts;
      const p    = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(from + diff * ease);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else { setDisplay(target); prev.current = target; }
    };

    raf.current = requestAnimationFrame(step);
    prev.current = target;

    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(flashTimer);
    };
  }, [target]);

  return { display, flash };
}

function fmt(value) {
  if (value == null || isNaN(value) || value === 0) return null; // return null → show skeleton
  if (value >= 1000) return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (value >= 1)    return "$" + value.toFixed(2);
  return "$" + value.toPrecision(4);
}

function StatCard({ icon: Icon, label, rawValue, formattedValue, sub, subColor, accentColor, delay, loading }) {
  const { display, flash } = useLocalAnimatedPrice(rawValue);

  // What to render in the price slot
  const priceText = rawValue != null
    ? (fmt(display) ?? fmt(rawValue) ?? "—")   // animated, or raw, or dash
    : (formattedValue ?? "—");                  // pre-formatted (market cap, volume)

  // Show skeleton only when truly loading AND no value at all
  const showSkeleton = loading && priceText === "—";

  return (
    <div
      className="card p-5 fade-in"
      style={{
        animationDelay: `${delay}ms`,
        boxShadow: flash === "up"
          ? "0 0 0 1px rgba(34,197,94,0.35), 0 0 20px rgba(34,197,94,0.08)"
          : flash === "down"
          ? "0 0 0 1px rgba(239,68,68,0.35),  0 0 20px rgba(239,68,68,0.08)"
          : undefined,
        transition: "box-shadow 0.4s ease",
      }}
    >
      {/* Accent top line */}
      <div style={{
        position: "absolute", inset: "0 0 auto 0", height: 1, opacity: 0.55,
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <span className="stat-label">{label}</span>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: accentColor + "18",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={14} style={{ color: accentColor }} />
        </div>
      </div>

      {/* Price */}
      {showSkeleton ? (
        <div className="skeleton" style={{ height: 28, width: 120, marginBottom: 8, borderRadius: 6 }} />
      ) : (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 24, fontWeight: 600, letterSpacing: "-0.5px", marginBottom: 6,
          color: flash === "up"
            ? "var(--positive)"
            : flash === "down"
            ? "var(--negative)"
            : "var(--text1)",           // ← theme-aware, never hardcoded white
          transition: "color 0.4s ease",
        }}>
          {priceText}
        </div>
      )}

      {/* Sub label */}
      {sub ? (
        <div style={{ fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, color: subColor }}>
          {subColor === "var(--positive)" ? <TrendingUp size={11} /> : subColor === "var(--negative)" ? <TrendingDown size={11} /> : null}
          {sub}
        </div>
      ) : showSkeleton ? (
        <div className="skeleton" style={{ height: 10, width: 80, borderRadius: 4 }} />
      ) : null}
    </div>
  );
}

export default function MarketOverview({ coins, global, loading }) {
  const btc   = coins.find(c => c.id === "bitcoin");
  const eth   = coins.find(c => c.id === "ethereum");
  const mcCap = global?.total_market_cap?.usd;
  const vol   = global?.total_volume?.usd;
  const mcChg = global?.market_cap_change_percentage_24h_usd;

  const pos = "var(--positive)";
  const neg = "var(--negative)";
  const muted = "var(--muted)";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Activity size={14} style={{ color: "var(--accent)" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Market Overview
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp} label="Bitcoin"
          rawValue={btc?.current_price}
          sub={btc?.price_change_percentage_24h != null
            ? formatPercent(btc.price_change_percentage_24h) + " (24h)" : null}
          subColor={btc && isPositive(btc.price_change_percentage_24h) ? pos : neg}
          accentColor="#f7931a" delay={50} loading={loading}
        />
        <StatCard
          icon={TrendingUp} label="Ethereum"
          rawValue={eth?.current_price}
          sub={eth?.price_change_percentage_24h != null
            ? formatPercent(eth.price_change_percentage_24h) + " (24h)" : null}
          subColor={eth && isPositive(eth.price_change_percentage_24h) ? pos : neg}
          accentColor="#627eea" delay={100} loading={loading}
        />
        <StatCard
          icon={BarChart2} label="Market Cap"
          rawValue={null}
          formattedValue={formatLargeNumber(mcCap)}
          sub={mcChg != null ? formatPercent(mcChg) + " (24h)" : null}
          subColor={mcChg != null && isPositive(mcChg) ? pos : neg}
          accentColor="#3b82f6" delay={150} loading={loading}
        />
        <StatCard
          icon={Activity} label="24h Volume"
          rawValue={null}
          formattedValue={formatLargeNumber(vol)}
          sub="Across all markets"
          subColor={muted}
          accentColor="#8b5cf6" delay={200} loading={loading}
        />
      </div>
    </div>
  );
}
