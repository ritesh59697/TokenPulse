import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPrice, formatPercent } from "../../utils/format";

function MiniList({ title, coins, positive, icon: Icon, iconColor, loading, onSelectCoin }) {
  return (
    <div className="card p-5 flex-1 min-w-0 fade-in fade-in-4">
      <div className="absolute inset-x-0 top-0 h-px opacity-50"
        style={{ background: `linear-gradient(90deg, transparent, ${iconColor}, transparent)` }} />
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: iconColor + "18" }}>
          <Icon size={13} style={{ color: iconColor }} />
        </div>
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-7 h-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-20" />
                  <div className="skeleton h-3 w-14" />
                </div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))
          : coins.map((coin, idx) => (
              <div key={coin.id}
                onClick={() => onSelectCoin?.(coin)}
                className="flex items-center gap-3 p-2 rounded-xl cursor-pointer group"
                onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                style={{ transition: "background 0.15s" }}>
                <div className="relative">
                  <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full ring-1 ring-card-border group-hover:ring-accent/30 transition-all" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-card text-[8px] font-bold text-muted flex items-center justify-center border border-card-border">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate group-hover:text-blue-400 transition-colors" style={{ color: "var(--text1)" }}>{coin.name}</div>
                  <div className="text-[11px] font-mono text-muted">{formatPrice(coin.current_price)}</div>
                </div>
                <span className={positive ? "badge-positive" : "badge-negative"}>
                  {formatPercent(coin.price_change_percentage_24h)}
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}

export default function GainersLosers({ coins, loading, onSelectCoin }) {
  const sorted = [...coins].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
  const gainers = sorted.slice(0, 5);
  const losers = sorted.slice(-5).reverse();

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={14} className="text-accent" />
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Top Movers · 24h</h2>
      </div>
      <div className="flex gap-4 flex-col sm:flex-row">
        <MiniList title="Top Gainers" coins={gainers} positive icon={TrendingUp} iconColor="#22c55e" loading={loading} onSelectCoin={onSelectCoin} />
        <MiniList title="Top Losers" coins={losers} positive={false} icon={TrendingDown} iconColor="#ef4444" loading={loading} onSelectCoin={onSelectCoin} />
      </div>
    </div>
  );
}
