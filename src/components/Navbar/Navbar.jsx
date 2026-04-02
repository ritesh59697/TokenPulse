import React, { useState } from "react";
import { Search, Zap, X, Sun, Moon } from "lucide-react";

export default function Navbar({ coins, onSelectCoin, theme, onToggleTheme }) {
  const [query, setQuery]     = useState("");
  const [focused, setFocused] = useState(false);

  const results = query.trim().length > 1
    ? coins.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.symbol.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  function handleSelect(coin) {
    onSelectCoin?.(coin);
    setQuery(""); setFocused(false);
  }

  const isDark = theme === "dark";

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: "1px solid var(--card-border)",
      background: isDark ? "rgba(11,15,25,0.88)" : "rgba(240,244,248,0.92)",
      backdropFilter: "blur(20px)",
      padding: "0 24px", height: 60,
      display: "flex", alignItems: "center", gap: 16,
      transition: "background 0.3s, border-color 0.3s",
    }}>
      {/* Logo */}
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 16px color-mix(in srgb, var(--accent) 40%, transparent)",
        }}>
          <Zap size={16} fill="white" color="white" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text1)", letterSpacing: "-0.3px" }}>
          Token<span style={{ color: "var(--accent)" }}>Pulse</span>
        </span>
      </a>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 400, position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: 12,
          border: focused ? "1px solid var(--accent)" : "1px solid var(--card-border)",
          background: "var(--card)",
          boxShadow: focused ? "0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent)" : "none",
          transition: "all 0.2s",
        }}>
          <Search size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
          <input
            type="text" placeholder="Search tokens…" value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text1)", fontSize: 13, fontFamily: "inherit" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", padding: 0 }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {focused && results.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
            background: "var(--card)", border: "1px solid var(--card-border)",
            borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            zIndex: 100, overflow: "hidden",
          }}>
            {results.map(coin => (
              <button key={coin.id} onMouseDown={() => handleSelect(coin)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 6%, transparent)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <img src={coin.image} alt={coin.name} style={{ width: 24, height: 24, borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)" }}>{coin.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>{coin.symbol}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'DM Mono', monospace" }}>
                  #{coin.market_cap_rank}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>

        {/* Live dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text2)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--positive)", display: "inline-block", animation: "pulseDot 2s ease-in-out infinite" }} />
          Live
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            width: 34, height: 34, borderRadius: 10,
            border: "1px solid var(--card-border)",
            background: "var(--card)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text2)", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--card-border)"; e.currentTarget.style.color = "var(--text2)"; }}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "var(--card-border)" }} />

        {/* Creator badge — in navbar */}
        <a
          href="https://x.com/Ritesh5969"
          target="_blank"
          rel="noopener noreferrer"
          title="Built by @Ritesh5969"
          style={{
            display: "flex", alignItems: "center", gap: 7,
            textDecoration: "none", opacity: 0.6,
            transition: "opacity 0.2s",
            padding: "4px 8px", borderRadius: 8,
            border: "1px solid var(--card-border)",
            background: "var(--card)",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 40%, transparent)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.borderColor = "var(--card-border)"; }}
        >
          {/* X logo SVG */}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="var(--text2)">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>

          {/* Profile picture */}
          <img
            src="https://pbs.twimg.com/profile_images/1944572785373728768/Qc4iOnla_400x400.jpg"
            alt="Ritesh"
            style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid var(--card-border)", objectFit: "cover" }}
            onError={e => e.target.style.display = "none"}
          />

          {/* Name */}
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
            @Ritesh5969
          </span>
        </a>
      </div>
    </nav>
  );
}
