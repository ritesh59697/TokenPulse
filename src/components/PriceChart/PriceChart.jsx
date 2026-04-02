import React, { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { formatPrice, formatPercent, isPositive } from "../../utils/format";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RANGES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "1Y", days: 365 },
];

const COINS = [
  { id: "bitcoin",  label: "BTC", color: "#f7931a", name: "Bitcoin"  },
  { id: "ethereum", label: "ETH", color: "#627eea", name: "Ethereum" },
];

// ── Custom HTML Tooltip Plugin ──────────────────────────────────────────────
function getOrCreateTooltip(chart, tooltipTheme) {
  let el = chart.canvas.parentNode.querySelector("#tp-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.id = "tp-tooltip";
    chart.canvas.parentNode.appendChild(el);
  }

  el.style.position = "absolute";
  el.style.pointerEvents = "none";
  el.style.zIndex = "100";
  el.style.background = tooltipTheme.background;
  el.style.border = `1px solid ${tooltipTheme.border}`;
  el.style.borderRadius = "12px";
  el.style.padding = "10px 14px";
  el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
  el.style.transition = "opacity 0.15s ease, transform 0.15s ease";
  el.style.minWidth = "160px";

  return el;
}

function buildCustomTooltip(activeCoin, marketCoin, tooltipTheme) {
  return {
    enabled: false,
    external(context) {
      const { chart, tooltip } = context;
      const el = getOrCreateTooltip(chart, tooltipTheme);

      if (tooltip.opacity === 0) {
        el.style.opacity = "0";
        return;
      }

      if (tooltip.body) {
        const date   = tooltip.title?.[0] || "";
        const raw    = tooltip.dataPoints?.[0]?.raw ?? 0;
        const price  = "$" + Number(raw).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const imgSrc = marketCoin?.image || "";

        el.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            ${imgSrc ? `<img src="${imgSrc}" style="width:20px;height:20px;border-radius:50%;border:1px solid ${tooltipTheme.border};" onerror="this.style.display='none'" />` : ""}
            <span style="font-size:12px;font-weight:700;color:${tooltipTheme.textPrimary};font-family:'DM Sans',sans-serif;">${activeCoin.name}</span>
            <span style="font-size:10px;color:${tooltipTheme.textSecondary};font-family:'DM Mono',monospace;background:${tooltipTheme.badgeBackground};padding:1px 6px;border-radius:4px;">${activeCoin.label}</span>
          </div>
          <div style="font-size:18px;font-weight:600;color:${tooltipTheme.textPrimary};font-family:'DM Mono',monospace;margin-bottom:4px;">${price}</div>
          <div style="font-size:11px;color:${tooltipTheme.textSecondary};font-family:'DM Sans',sans-serif;">${date}</div>
        `;
      }

      // Position tooltip
      const { offsetLeft: left, offsetTop: top } = chart.canvas;
      const x = left + tooltip.caretX;
      const y = top  + tooltip.caretY;
      const w = el.offsetWidth  || 160;
      const h = el.offsetHeight || 80;
      const cw = chart.width;

      // Flip left if too close to right edge
      const tx = x + w + 16 > cw ? x - w - 12 : x + 12;
      const ty = Math.max(0, y - h / 2);

      el.style.opacity    = "1";
      el.style.left       = tx + "px";
      el.style.top        = ty + "px";
    },
  };
}

export default function PriceChart({ coins }) {
  const [activeCoin, setActiveCoin] = useState(COINS[0]);
  const [range, setRange]           = useState(RANGES[1]);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [chartTheme, setChartTheme] = useState(() => ({
    axisText: "#9CA3AF",
    grid: "rgba(255,255,255,0.1)",
    tooltipBackground: "#111827",
    tooltipBorder: "#1e2d45",
    tooltipTextPrimary: "#f1f5f9",
    tooltipTextSecondary: "#9CA3AF",
    tooltipBadgeBackground: "#1e2d45",
  }));

  useEffect(() => {
    const root = document.documentElement;

    const readThemeColors = () => {
      const styles = getComputedStyle(root);
      const isLight = root.classList.contains("light");
      const axisText = isLight ? "#374151" : "#9CA3AF";
      const tooltipBackground = styles.getPropertyValue("--card").trim() || "#111827";
      const tooltipBorder = styles.getPropertyValue("--card-border").trim() || "#1e2d45";
      const tooltipTextPrimary = styles.getPropertyValue("--text1").trim() || "#f1f5f9";
      const tooltipTextSecondary = isLight ? "#374151" : "#9CA3AF";

      setChartTheme({
        axisText,
        grid: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)",
        tooltipBackground,
        tooltipBorder,
        tooltipTextPrimary,
        tooltipTextSecondary,
        tooltipBadgeBackground: tooltipBorder,
      });
    };

    readThemeColors();

    const observer = new MutationObserver(readThemeColors);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `https://api.coingecko.com/api/v3/coins/${activeCoin.id}/market_chart?vs_currency=usd&days=${range.days}`
      );
      const d = await r.json();
      if (d.prices) setHistory(d.prices);
    } catch {}
    setLoading(false);
  }, [activeCoin.id, range.days]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const marketCoin   = coins.find(c => c.id === activeCoin.id);
  const change24h    = marketCoin?.price_change_percentage_24h;
  const currentPrice = marketCoin?.current_price;
  const positive     = isPositive(change24h ?? 0);
  const lineColor    = positive ? "#22c55e" : "#ef4444";

  const labels = history.map(([ts]) => {
    const d = new Date(ts);
    if (range.days <= 1) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const chartData = {
    labels,
    datasets: [{
      data: history.map(([, p]) => p),
      borderColor: lineColor, borderWidth: 2,
      pointRadius: 0, pointHoverRadius: 5,
      pointHoverBackgroundColor: lineColor,
      pointHoverBorderColor: "var(--bg)",
      pointHoverBorderWidth: 2,
      fill: true,
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
        g.addColorStop(0, positive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        return g;
      },
      tension: 0.4,
    }],
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: buildCustomTooltip(activeCoin, marketCoin, {
        background: chartTheme.tooltipBackground,
        border: chartTheme.tooltipBorder,
        textPrimary: chartTheme.tooltipTextPrimary,
        textSecondary: chartTheme.tooltipTextSecondary,
        badgeBackground: chartTheme.tooltipBadgeBackground,
      }),
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: chartTheme.axisText, font: { family: "DM Sans", size: 11 }, maxTicksLimit: 8, maxRotation: 0 },
      },
      y: {
        position: "right",
        grid: { color: chartTheme.grid },
        border: { display: false },
        ticks: { color: chartTheme.axisText, font: { family: "DM Mono", size: 11 }, callback: v => "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)) },
      },
    },
  };

  return (
    <div className="card p-4 sm:p-5 fade-in fade-in-2" style={{ position: "relative" }}>
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 1, opacity: 0.4, background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)` }} />

      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Coin tabs with logos */}
          <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
            {COINS.map(c => {
              const mc = coins.find(x => x.id === c.id);
              return (
                <button key={c.id} onClick={() => setActiveCoin(c)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                    background: activeCoin.id === c.id ? c.color + "22" : "transparent",
                    color: activeCoin.id === c.id ? c.color : "var(--text2)",
                    transition: "all 0.2s",
                  }}>
                  {/* Show real logo if available, else colored dot */}
                  {mc?.image
                    ? <img src={mc.image} alt={c.label} style={{ width: 16, height: 16, borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                    : <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                  }
                  {c.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 600, color: "var(--text1)", wordBreak: "break-word" }}>
              {formatPrice(currentPrice)}
            </span>
            {change24h !== undefined && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: positive ? "var(--positive)" : "var(--negative)" }}>
                {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {formatPercent(change24h)}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>
            {activeCoin.name} · USD · 24h change
          </div>
        </div>

        {/* Range selector */}
        <div style={{ display: "flex", gap: 2, background: "var(--bg)", borderRadius: 12, padding: 4, border: "1px solid var(--card-border)", flexWrap: "wrap", width: "fit-content" }}>
          {RANGES.map(r => (
            <button key={r.label} onClick={() => setRange(r)}
              style={{
                padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                background: range.days === r.days ? "var(--accent)" : "transparent",
                color: range.days === r.days ? "white" : "var(--text2)",
                boxShadow: range.days === r.days ? "0 0 12px color-mix(in srgb, var(--accent) 30%, transparent)" : "none",
                transition: "all 0.2s",
              }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 300, position: "relative", width: "100%" }}>
        {loading ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={20} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}
