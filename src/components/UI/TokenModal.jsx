import React, { useState, useEffect, useRef } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import { X, TrendingUp, TrendingDown, ExternalLink, Wifi, Activity } from "lucide-react";
import { formatPrice, formatLargeNumber, formatPercent, isPositive } from "../../utils/format";
import { fetchChartData } from "../../hooks/useMarketData";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const RANGES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "1Y", days: 365 },
];

export default function TokenModal({ coin, onClose, wsPrices }) {
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState(RANGES[1]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [visible, setVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [chartSource, setChartSource] = useState(null);
  const overlayRef = useRef(null);

  const wsData = wsPrices?.[coin?.id];
  const livePrice = wsData?.price ?? coin?.current_price;
  const liveChange = wsData?.change24h ?? coin?.price_change_percentage_24h;
  const pos = isPositive(liveChange ?? 0);
  const lineColor = pos ? "#22c55e" : "#ef4444";

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!coin || coin.isDex) return;
    setLoadingChart(true);
    setHistory([]);
    setErrorMsg(null);
    fetchChartData(coin.id, range.days)
      .then(({ prices, source }) => { setHistory(prices); setChartSource(source); })
      .catch(() => setErrorMsg("Chart unavailable"))
      .finally(() => setLoadingChart(false));
  }, [coin?.id, range.days]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

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
      pointRadius: 0, pointHoverRadius: 4,
      pointHoverBackgroundColor: lineColor,
      fill: true,
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
        g.addColorStop(0, pos ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        return g;
      },
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e2d45", borderColor: "#2d3f5a", borderWidth: 1,
        titleColor: "#9ca3af", bodyColor: "#f1f5f9",
        titleFont: { family: "DM Sans", size: 11 },
        bodyFont: { family: "DM Mono", size: 12, weight: "500" },
        padding: 10, cornerRadius: 8,
        callbacks: { label: i => " $" + Number(i.raw).toLocaleString("en-US", { maximumFractionDigits: 4 }) },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: "#4b5563", font: { family: "DM Sans", size: 10 }, maxTicksLimit: 6, maxRotation: 0 } },
      y: { position: "right", grid: { color: "rgba(255,255,255,0.03)" }, border: { display: false }, ticks: { color: "#4b5563", font: { family: "DM Mono", size: 10 }, callback: v => "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v >= 1 ? v.toFixed(2) : v.toPrecision(3)) } },
    },
  };

  const isDex = coin?.isDex;

  const stats = isDex ? [
    { label: "Liquidity", value: formatLargeNumber(coin.liquidity) },
    { label: "24h Volume", value: formatLargeNumber(coin.total_volume) },
    { label: "24h Txns", value: coin.txns24h?.toLocaleString() || "—" },
    { label: "Buys 24h", value: coin.buys24h?.toLocaleString() || "—" },
    { label: "Sells 24h", value: coin.sells24h?.toLocaleString() || "—" },
    { label: "Chain", value: coin.chainId?.toUpperCase() || "—" },
  ] : [
    { label: "Market Cap", value: formatLargeNumber(coin?.market_cap) },
    { label: "24h Volume", value: formatLargeNumber(coin?.total_volume) },
    { label: "Circulating Supply", value: coin?.circulating_supply ? (coin.circulating_supply / 1e6).toFixed(2) + "M " + coin.symbol?.toUpperCase() : "—" },
    { label: "All-Time High", value: coin?.ath ? formatPrice(coin.ath) : "—" },
    { label: "ATH Change", value: coin?.ath_change_percentage ? formatPercent(coin.ath_change_percentage) : "—" },
    { label: "Rank", value: coin?.market_cap_rank ? "#" + coin.market_cap_rank : "—" },
  ];

  if (!coin) return null;

  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && handleClose()}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(7,11,19,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, transition: "opacity 0.3s ease", opacity: visible ? 1 : 0 }}>
      <div style={{
        background: "#111827", border: "1px solid #1e2d45", borderRadius: 20,
        width: "100%", maxWidth: 680, maxHeight: "90vh", overflow: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)",
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        opacity: visible ? 1 : 0, position: "relative",
      }}>
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: 1, background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)`, opacity: 0.6, borderRadius: "20px 20px 0 0" }} />

        {/* Header */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "flex-start", gap: 14 }}>
          {coin.image ? (
            <img src={coin.image} alt={coin.name}
              onError={e => e.target.style.display = "none"}
              style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #1e2d45" }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1e2d45", border: "2px solid #2d3f5a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#3b82f6" }}>
              {coin.symbol?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "white", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{coin.name}</h2>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#6b7280", background: "#1e2d45", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" }}>{coin.symbol}</span>
              {isDex && coin.chainId && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 5, background: "rgba(139,92,246,0.15)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.3)", fontWeight: 600 }}>{coin.chainId}</span>}
              {!isDex && coin.market_cap_rank && <span style={{ fontSize: 11, color: "#6b7280" }}>#{coin.market_cap_rank}</span>}
              {wsData && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(34,197,94,0.2)" }}><Activity size={9} /> LIVE</span>}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 600, color: "white", fontFamily: "'DM Mono', monospace" }}>{formatPrice(livePrice)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: pos ? "#22c55e" : "#ef4444" }}>
                {pos ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {formatPercent(liveChange)}
              </span>
            </div>
            {wsData && (
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>H: <span style={{ color: "#22c55e", fontFamily: "'DM Mono', monospace" }}>{formatPrice(wsData.high24h)}</span></span>
                <span style={{ fontSize: 11, color: "#6b7280" }}>L: <span style={{ color: "#ef4444", fontFamily: "'DM Mono', monospace" }}>{formatPrice(wsData.low24h)}</span></span>
              </div>
            )}
          </div>
          <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: 8, background: "#1e2d45", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", transition: "all 0.2s", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#2d3f5a"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#1e2d45"; e.currentTarget.style.color = "#9ca3af"; }}>
            <X size={14} />
          </button>
        </div>

        {/* Chart — only for CoinGecko tokens */}
        {!isDex ? (
          <>
            <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", gap: 4 }}>
              {RANGES.map(r => (
                <button key={r.label} onClick={() => setRange(r)} style={{
                  padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  background: range.days === r.days ? "#3b82f6" : "transparent",
                  color: range.days === r.days ? "white" : "#6b7280", transition: "all 0.2s",
                  boxShadow: range.days === r.days ? "0 0 12px rgba(59,130,246,0.3)" : "none",
                }}>{r.label}</button>
              ))}
              {chartSource && (
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#4b5563", display: "flex", alignItems: "center", gap: 4 }}>
                  <Wifi size={10} /> via {chartSource}
                </span>
              )}
            </div>
            <div style={{ padding: "12px 20px 0", height: 220 }}>
              {loadingChart ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{ width: 24, height: 24, border: "2px solid #1e2d45", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "modalSpin 0.8s linear infinite" }} />
                  <span style={{ fontSize: 11, color: "#4b5563" }}>Loading chart…</span>
                  <style>{`@keyframes modalSpin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : errorMsg ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#ef4444" }}>{errorMsg}</span>
                  <button onClick={() => setRange({ ...range })} style={{ padding: "6px 14px", borderRadius: 8, background: "#1e2d45", border: "1px solid #2d3f5a", color: "#9ca3af", fontSize: 11, cursor: "pointer" }}>Retry</button>
                </div>
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: "16px 20px 0" }}>
            <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#9ca3af" }}>
              📊 Chart data via DexScreener. Click "View Pair" below for the full chart.
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: "#0d1521", borderRadius: 12, padding: "12px 14px", border: "1px solid #1e2d45" }}>
              <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "flex-end" }}>
          <a href={isDex ? coin.pairUrl : `https://www.coingecko.com/en/coins/${coin.id}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
            {isDex ? "View Pair on DexScreener" : "View on CoinGecko"} <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}
