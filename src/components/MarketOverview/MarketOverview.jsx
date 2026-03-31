import React from "react";
import { TrendingUp, TrendingDown, BarChart2, Activity } from "lucide-react";
import { formatPrice, formatLargeNumber, formatPercent, isPositive } from "../../utils/format";

function StatCard({ icon: Icon, label, value, sub, subColor, accentColor, delay, loading }) {
  if (loading) {
    return (
      <div className="card p-5 fade-in" style={{ animationDelay: `${delay}ms` }}>
        <div className="skeleton h-3 w-20 mb-3" />
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-3 w-16" />
      </div>
    );
  }

  return (
    <div className={`card p-5 fade-in group cursor-default`} style={{ animationDelay: `${delay}ms` }}>
      {/* Top glow accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-3">
        <span className="stat-label">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accentColor}18` }}
        >
          <Icon size={15} style={{ color: accentColor }} />
        </div>
      </div>

      <div className="stat-value mb-1.5">{value}</div>

      {sub && (
        <div className={`text-xs font-medium flex items-center gap-1`} style={{ color: subColor }}>
          {subColor === "#22c55e" ? <TrendingUp size={11} /> : subColor === "#ef4444" ? <TrendingDown size={11} /> : null}
          {sub}
        </div>
      )}
    </div>
  );
}

export default function MarketOverview({ coins, global, loading }) {
  const btc = coins.find((c) => c.id === "bitcoin");
  const eth = coins.find((c) => c.id === "ethereum");

  const marketCap = global?.total_market_cap?.usd;
  const volume = global?.total_volume?.usd;
  const marketCapChange = global?.market_cap_change_percentage_24h_usd;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Activity size={14} className="text-accent" />
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Market Overview</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Bitcoin"
          value={formatPrice(btc?.current_price)}
          sub={btc ? formatPercent(btc.price_change_percentage_24h) + " (24h)" : null}
          subColor={btc && isPositive(btc.price_change_percentage_24h) ? "#22c55e" : "#ef4444"}
          accentColor="#f7931a"
          delay={50}
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Ethereum"
          value={formatPrice(eth?.current_price)}
          sub={eth ? formatPercent(eth.price_change_percentage_24h) + " (24h)" : null}
          subColor={eth && isPositive(eth.price_change_percentage_24h) ? "#22c55e" : "#ef4444"}
          accentColor="#627eea"
          delay={100}
          loading={loading}
        />
        <StatCard
          icon={BarChart2}
          label="Market Cap"
          value={formatLargeNumber(marketCap)}
          sub={marketCapChange ? formatPercent(marketCapChange) + " (24h)" : null}
          subColor={marketCapChange && isPositive(marketCapChange) ? "#22c55e" : "#ef4444"}
          accentColor="#3b82f6"
          delay={150}
          loading={loading}
        />
        <StatCard
          icon={Activity}
          label="24h Volume"
          value={formatLargeNumber(volume)}
          sub="Across all markets"
          subColor="#6b7280"
          accentColor="#8b5cf6"
          delay={200}
          loading={loading}
        />
      </div>
    </div>
  );
}
