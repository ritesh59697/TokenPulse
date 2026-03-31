import React, { useState } from "react";
import { ArrowUpDown, Flame } from "lucide-react";
import { formatPrice, formatLargeNumber, formatPercent, isPositive } from "../../utils/format";

const COLS = ["#", "Token", "Price", "24h", "Volume", "Market Cap"];

export default function TrendingTokens({ coins, loading }) {
  const [sortKey, setSortKey] = useState("market_cap_rank");
  const [sortDir, setSortDir] = useState("asc");

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...coins].sort((a, b) => {
    let va, vb;
    switch (sortKey) {
      case "market_cap_rank": va = a.market_cap_rank; vb = b.market_cap_rank; break;
      case "name": va = a.name; vb = b.name; break;
      case "current_price": va = a.current_price; vb = b.current_price; break;
      case "price_change_percentage_24h": va = a.price_change_percentage_24h; vb = b.price_change_percentage_24h; break;
      case "total_volume": va = a.total_volume; vb = b.total_volume; break;
      case "market_cap": va = a.market_cap; vb = b.market_cap; break;
      default: va = a.market_cap_rank; vb = b.market_cap_rank;
    }
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === "asc" ? va - vb : vb - va;
  });

  const sortKeys = ["market_cap_rank", "name", "current_price", "price_change_percentage_24h", "total_volume", "market_cap"];

  return (
    <div className="card fade-in fade-in-3">
      <div className="flex items-center gap-2 p-5 pb-0">
        <Flame size={14} className="text-orange-400" />
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-widest">Trending Tokens</h2>
        <span className="ml-auto text-xs text-muted font-mono">{coins.length} assets</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="border-b border-card-border">
              {COLS.map((col, i) => (
                <th
                  key={col}
                  onClick={() => toggleSort(sortKeys[i])}
                  className={`px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors select-none ${
                    i === 0 ? "w-12" : ""
                  } ${i >= 2 ? "text-right" : ""}`}
                >
                  <span className="flex items-center gap-1 justify-end">
                    {i >= 2 && <ArrowUpDown size={10} className="opacity-40" />}
                    {col}
                    {i < 2 && <ArrowUpDown size={10} className="opacity-40 ml-1" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-card-border/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="skeleton h-4 rounded" style={{ width: ["24px", "120px", "80px", "60px", "90px", "90px"][j] }} />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.slice(0, 20).map((coin, idx) => {
                  const pos = isPositive(coin.price_change_percentage_24h);
                  return (
                    <tr key={coin.id} className="token-row group">
                      <td className="px-5 py-3.5 text-muted font-mono text-xs">{coin.market_cap_rank}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={coin.image}
                            alt={coin.name}
                            className="w-7 h-7 rounded-full ring-1 ring-card-border group-hover:ring-accent/30 transition-all"
                          />
                          <div>
                            <div className="font-semibold text-white text-[13px] leading-tight">{coin.name}</div>
                            <div className="text-[11px] font-mono text-muted uppercase">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-[13px] font-medium text-white">
                        {formatPrice(coin.current_price)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={pos ? "badge-positive" : "badge-negative"}>
                          {formatPercent(coin.price_change_percentage_24h)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-[13px] text-text-secondary">
                        {formatLargeNumber(coin.total_volume)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-[13px] text-text-secondary">
                        {formatLargeNumber(coin.market_cap)}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
