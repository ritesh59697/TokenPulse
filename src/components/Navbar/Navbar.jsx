import React, { useState } from "react";
import { Search, Wallet, Zap, X } from "lucide-react";

export default function Navbar({ coins, onSelectCoin }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = query.trim().length > 1
    ? coins.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.symbol.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  function handleSelect(coin) {
    onSelectCoin?.(coin);
    setQuery("");
    setFocused(false);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border bg-bg/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow group-hover:shadow-[0_0_24px_rgba(59,130,246,0.4)] transition-shadow duration-300">
            <Zap size={16} className="text-white fill-white" />
          </div>
          <span className="font-semibold text-white tracking-tight text-[15px]">
            Token<span className="text-accent">Pulse</span>
          </span>
        </a>

        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 bg-card ${
            focused ? "border-accent/60 shadow-glow" : "border-card-border"
          }`}>
            <Search size={14} className="text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search tokens…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              className="flex-1 bg-transparent text-sm text-white placeholder-muted outline-none font-sans"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted hover:text-white transition-colors">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {focused && results.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 card py-1 shadow-xl z-50">
              {results.map((coin) => (
                <button
                  key={coin.id}
                  onMouseDown={() => handleSelect(coin)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/5 transition-colors text-left"
                >
                  <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{coin.name}</div>
                    <div className="text-xs text-text-secondary uppercase">{coin.symbol}</div>
                  </div>
                  <div className="text-xs font-mono text-text-secondary">#{coin.market_cap_rank}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-positive pulse-dot" />
            Live
          </div>

          <button className="btn-primary flex items-center gap-2">
            <Wallet size={14} />
            <span className="hidden sm:inline">Connect Wallet</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
