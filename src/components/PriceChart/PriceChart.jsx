import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
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
  { id: "bitcoin", label: "BTC", color: "#f7931a", name: "Bitcoin" },
  { id: "ethereum", label: "ETH", color: "#627eea", name: "Ethereum" },
];

export default function PriceChart({ coins }) {
  const [activeCoin, setActiveCoin] = useState(COINS[0]);
  const [range, setRange] = useState(RANGES[1]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverPrice, setHoverPrice] = useState(null);

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

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const marketCoin = coins.find((c) => c.id === activeCoin.id);
  const change24h = marketCoin?.price_change_percentage_24h;
  const currentPrice = marketCoin?.current_price;
  const positive = isPositive(change24h ?? 0);

  const labels = history.map(([ts]) => {
    const d = new Date(ts);
    if (range.days <= 1) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    if (range.days <= 30) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const prices = history.map(([, p]) => p);

  const lineColor = positive ? "#22c55e" : "#ef4444";
  const fillColor = positive ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)";

  const chartData = {
    labels,
    datasets: [
      {
        data: prices,
        borderColor: lineColor,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: "#0b0f19",
        pointHoverBorderWidth: 2,
        fill: true,
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          gradient.addColorStop(0, positive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)");
          gradient.addColorStop(1, "rgba(0,0,0,0)");
          return gradient;
        },
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e2d45",
        borderColor: "#2d3f5a",
        borderWidth: 1,
        titleColor: "#9ca3af",
        bodyColor: "#f1f5f9",
        titleFont: { family: "DM Sans", size: 11 },
        bodyFont: { family: "DM Mono", size: 13, weight: "500" },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          title: (items) => items[0].label,
          label: (item) => " $" + Number(item.raw).toLocaleString("en-US", { maximumFractionDigits: 2 }),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#4b5563",
          font: { family: "DM Sans", size: 11 },
          maxTicksLimit: 8,
          maxRotation: 0,
        },
      },
      y: {
        position: "right",
        grid: { color: "rgba(255,255,255,0.03)" },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: "#4b5563",
          font: { family: "DM Mono", size: 11 },
          callback: (v) => "$" + (v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)),
        },
      },
    },
  };

  return (
    <div className="card p-5 fade-in fade-in-2">
      <div className="absolute inset-x-0 top-0 h-px opacity-40"
        style={{ background: `linear-gradient(90deg, transparent, ${lineColor}, transparent)` }} />

      {/* Header */}
      <div className="flex flex-wrap items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          {/* Coin tabs */}
          <div className="flex items-center gap-1 mb-3">
            {COINS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCoin(c)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeCoin.id === c.id
                    ? "text-white shadow-sm"
                    : "text-text-secondary hover:text-white"
                }`}
                style={activeCoin.id === c.id ? { background: c.color + "22", color: c.color } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-mono text-3xl font-semibold text-white">
              {formatPrice(currentPrice)}
            </span>
            {change24h !== undefined && (
              <span className={`flex items-center gap-1 text-sm font-semibold ${positive ? "text-positive" : "text-negative"}`}>
                {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {formatPercent(change24h)}
              </span>
            )}
          </div>
          <div className="text-xs text-text-secondary mt-0.5">
            {activeCoin.name} · USD · 24h change
          </div>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 bg-bg rounded-xl p-1 border border-card-border">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                range.days === r.days
                  ? "bg-accent text-white shadow-glow"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw size={20} className="text-accent animate-spin" />
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
}
