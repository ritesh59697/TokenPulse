import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, X, TrendingUp, HelpCircle } from "lucide-react";
import { formatPrice, formatPercent } from "../../utils/format";

// Preset starting mock assets to give the user a filled dashboard on first visit
const DEFAULT_TRANSACTIONS = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", amount: 0.25, buyPrice: 72000, date: new Date().toISOString() },
  { id: "ethereum", symbol: "eth", name: "Ethereum", amount: 1.5, buyPrice: 2850, date: new Date().toISOString() },
  { id: "solana", symbol: "sol", name: "Solana", amount: 10, buyPrice: 135, date: new Date().toISOString() },
];

export default function PortfolioTracker({ coins, wsPrices, onSelectCoin }) {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("tp_portfolio_transactions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing transactions", e);
      }
    }
    return DEFAULT_TRANSACTIONS;
  });

  const [isOpenForm, setIsOpenForm] = useState(false);
  const [selectedCoinId, setSelectedCoinId] = useState("");
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  // Save to localStorage when transactions change
  useEffect(() => {
    localStorage.setItem("tp_portfolio_transactions", JSON.stringify(transactions));
  }, [transactions]);

  // Autofill buy price ONLY when user selects a new coin
  const handleSelectCoinChange = (e) => {
    const val = e.target.value;
    setSelectedCoinId(val);
    if (val) {
      const coin = coins.find(c => c.id === val);
      if (coin) {
        const livePrice = wsPrices?.[coin.id]?.price ?? coin.current_price;
        setBuyPrice(livePrice ? Number(livePrice).toFixed(2) : "");
      }
    } else {
      setBuyPrice("");
    }
  };

  // Aggregate holdings
  const portfolio = useMemo(() => {
    let totalCost = 0;
    let currentValue = 0;

    const holdingsMap = {};

    transactions.forEach(tx => {
      if (!holdingsMap[tx.id]) {
        holdingsMap[tx.id] = {
          id: tx.id,
          symbol: tx.symbol,
          name: tx.name,
          amount: 0,
          totalCost: 0,
        };
      }
      holdingsMap[tx.id].amount += Number(tx.amount);
      holdingsMap[tx.id].totalCost += Number(tx.amount) * Number(tx.buyPrice);
    });

    const holdings = Object.values(holdingsMap).map(h => {
      const coin = coins.find(c => c.id === h.id);
      const livePrice = wsPrices?.[h.id]?.price ?? coin?.current_price ?? (h.totalCost / h.amount); // fallback to avg cost
      const value = h.amount * livePrice;
      const avgBuyPrice = h.totalCost / h.amount;
      const profit = value - h.totalCost;
      const profitPercent = h.totalCost > 0 ? (profit / h.totalCost) * 100 : 0;
      
      totalCost += h.totalCost;
      currentValue += value;

      return {
        ...h,
        image: coin?.image,
        avgBuyPrice,
        livePrice,
        value,
        profit,
        profitPercent,
        priceChange24h: coin?.price_change_percentage_24h ?? 0,
      };
    }).sort((a, b) => b.value - a.value);

    const totalProfit = currentValue - totalCost;
    const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    // Calculate asset allocation weights
    const holdingsWithWeights = holdings.map(h => ({
      ...h,
      weight: currentValue > 0 ? (h.value / currentValue) * 100 : 0,
    }));

    return {
      holdings: holdingsWithWeights,
      totalCost,
      currentValue,
      totalProfit,
      totalProfitPercent,
    };
  }, [transactions, coins, wsPrices]);

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!selectedCoinId || !amount || !buyPrice || isNaN(amount) || isNaN(buyPrice)) return;

    const coin = coins.find(c => c.id === selectedCoinId);
    if (!coin) return;

    const newTx = {
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      amount: parseFloat(amount),
      buyPrice: parseFloat(buyPrice),
      date: new Date().toISOString(),
    };

    setTransactions(prev => [...prev, newTx]);
    
    // Reset form
    setAmount("");
    setSelectedCoinId("");
    setBuyPrice("");
    setIsOpenForm(false);
  };

  const handleRemoveAsset = (coinId) => {
    if (window.confirm(`Are you sure you want to clear your ${coinId.toUpperCase()} mock holding?`)) {
      setTransactions(prev => prev.filter(tx => tx.id !== coinId));
    }
  };

  const handleResetPortfolio = () => {
    if (window.confirm("Do you want to reset the portfolio to default assets?")) {
      setTransactions(DEFAULT_TRANSACTIONS);
    }
  };

  const isProfit = portfolio.totalProfit >= 0;

  // Nice palette for horizontal allocation stack
  const allocationColors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#6366f1"];

  return (
    <div className="card p-4 sm:p-6 fade-in fade-in-3" style={{ position: "relative", overflow: "hidden" }}>
      {/* Light glow strip at top */}
      <div style={{ position: "absolute", inset: "0 0 auto 0", height: 1, opacity: 0.4, background: `linear-gradient(90deg, transparent, var(--accent), transparent)` }} />

      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text1)", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <Wallet size={20} color="var(--accent)" /> Simulated Portfolio Tracker
          </h2>
          <p style={{ fontSize: 12, color: "var(--text2)", margin: 0 }}>
            Mock buy assets at target entry levels to monitor potential capital returns in real-time.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setIsOpenForm(!isOpenForm)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--accent)", color: "white", border: "none",
              padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              cursor: "pointer", transition: "transform 0.2s, background-color 0.2s",
              boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            {isOpenForm ? <X size={14} /> : <Plus size={14} />} {isOpenForm ? "Close Drawer" : "Add Simulated Buy"}
          </button>
          <button onClick={handleResetPortfolio}
            title="Reset to default mock holdings"
            style={{
              background: "transparent", border: "1px solid var(--card-border)", color: "var(--text2)",
              padding: "8px 12px", borderRadius: 10, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--card-border)"; }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        {/* Net Worth Card */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--card-border)", borderRadius: 16, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Portfolio Value</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 700, color: "var(--text1)" }}>
            {formatPrice(portfolio.currentValue)}
          </span>
          <span style={{ fontSize: 11, color: "var(--text2)" }}>Total Cost basis: {formatPrice(portfolio.totalCost)}</span>
        </div>

        {/* P/L Card */}
        <div style={{ background: "var(--bg)", border: "1px solid var(--card-border)", borderRadius: 16, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Profit / Loss</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 700, color: isProfit ? "var(--positive)" : "var(--negative)" }}>
              {isProfit ? "+" : ""}{formatPrice(portfolio.totalProfit)}
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
              background: isProfit ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              color: isProfit ? "var(--positive)" : "var(--negative)",
            }}>
              {isProfit ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {formatPercent(portfolio.totalProfitPercent)}
            </span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text2)" }}>Simulated return since inception</span>
        </div>
      </div>

      {/* Add Transaction Collapsible Form Drawer */}
      {isOpenForm && (
        <form onSubmit={handleAddTransaction} className="fade-in"
          style={{
            background: "var(--bg)", border: "1px solid var(--card-border)", borderRadius: 16,
            padding: 20, marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end",
          }}>
          <div style={{ flex: "1 1 200px", minWidth: 160, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)" }}>Select Simulated Asset</label>
            <select value={selectedCoinId} onChange={handleSelectCoinChange} required
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, background: "var(--card)",
                border: "1px solid var(--card-border)", color: "var(--text1)", fontSize: 13, fontFamily: "inherit", outline: "none",
              }}>
              <option value="" disabled>-- Choose a coin --</option>
              {coins.slice(0, 30).map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.symbol?.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div style={{ flex: "1 1 120px", minWidth: 100, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)" }}>Buy Quantity</label>
            <input type="number" step="any" placeholder="0.5" value={amount} onChange={e => setAmount(e.target.value)} required
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, background: "var(--card)",
                border: "1px solid var(--card-border)", color: "var(--text1)", fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
          </div>

          <div style={{ flex: "1 1 150px", minWidth: 120, display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)" }}>Buy Price (USD)</label>
            <input type="number" step="any" placeholder="72000" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} required
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, background: "var(--card)",
                border: "1px solid var(--card-border)", color: "var(--text1)", fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
          </div>

          <button type="submit"
            style={{
              padding: "10px 20px", background: "var(--accent)", color: "white", border: "none",
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", minWidth: 120, height: 40,
            }}>
            Confirm Purchase
          </button>
        </form>
      )}

      {portfolio.holdings.length === 0 ? (
        <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, border: "1px dashed var(--card-border)", borderRadius: 16 }}>
          <HelpCircle size={28} color="var(--muted)" />
          <span style={{ fontSize: 13, color: "var(--text2)" }}>Your portfolio is currently empty.</span>
          <button onClick={() => setIsOpenForm(true)} style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Click here to add your first mock holding
          </button>
        </div>
      ) : (
        <>
          {/* Custom allocation horizontal stack */}
          <div style={{ marginBottom: 28 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 8 }}>Holdings Distribution</span>
            <div style={{ height: 16, borderRadius: 8, display: "flex", overflow: "hidden", background: "var(--bg)", width: "100%" }}>
              {portfolio.holdings.map((h, i) => (
                <div key={h.id}
                  title={`${h.name}: ${h.weight.toFixed(1)}%`}
                  style={{
                    width: `${h.weight}%`,
                    background: allocationColors[i % allocationColors.length],
                    height: "100%",
                    transition: "width 0.5s ease",
                  }}
                />
              ))}
            </div>
            {/* Allocation badges grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", marginTop: 10 }}>
              {portfolio.holdings.map((h, i) => (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, color: "var(--text2)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: allocationColors[i % allocationColors.length] }} />
                  <span style={{ color: "var(--text1)", fontWeight: 600 }}>{h.symbol?.toUpperCase()}</span>
                  <span>{h.weight.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Holdings Grid/Table */}
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Asset</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Amount Owned</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Avg Buy Price</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Live Price</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Value (USD)</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Profit / Loss</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map(h => {
                  const itemProfit = h.profit >= 0;
                  return (
                    <tr key={h.id}
                      className="hover-row"
                      style={{ borderBottom: "1px solid var(--card-border)", transition: "background 0.2s" }}>
                      
                      {/* Name/Image Column */}
                      <td style={{ padding: "12px 10px" }}>
                        <div onClick={() => onSelectCoin?.(h)}
                          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                          {h.image ? (
                            <img src={h.image} alt={h.name} style={{ width: 24, height: 24, borderRadius: "50%" }} onError={e => e.target.style.display = "none"} />
                          ) : (
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--card-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                              {h.symbol?.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)" }}>{h.name}</div>
                            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>{h.symbol}</div>
                          </div>
                        </div>
                      </td>

                      {/* Amount Column */}
                      <td style={{ textAlign: "right", padding: "12px 10px", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--text1)" }}>
                        {h.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </td>

                      {/* Avg Buy Price Column */}
                      <td style={{ textAlign: "right", padding: "12px 10px", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--text2)" }}>
                        {formatPrice(h.avgBuyPrice)}
                      </td>

                      {/* Live Price Column */}
                      <td style={{ textAlign: "right", padding: "12px 10px", fontFamily: "'DM Mono', monospace", fontSize: 13, color: "var(--text1)" }}>
                        {formatPrice(h.livePrice)}
                      </td>

                      {/* Value Column */}
                      <td style={{ textAlign: "right", padding: "12px 10px", fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--text1)" }}>
                        {formatPrice(h.value)}
                      </td>

                      {/* Profit Column */}
                      <td style={{ textAlign: "right", padding: "12px 10px", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
                        <div style={{ color: itemProfit ? "var(--positive)" : "var(--negative)", fontWeight: 600 }}>
                          {itemProfit ? "+" : ""}{formatPrice(h.profit)}
                        </div>
                        <div style={{ fontSize: 10, color: itemProfit ? "var(--positive)" : "var(--negative)", opacity: 0.9 }}>
                          {formatPercent(h.profitPercent)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "12px 10px", textAlign: "center" }}>
                        <button onClick={() => handleRemoveAsset(h.id)}
                          title="Delete holding"
                          style={{
                            background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 4, borderRadius: 6, display: "inline-flex", transition: "all 0.2s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = "var(--negative)"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "none"; }}>
                          <Trash2 size={13} />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Row hover custom styling via style block */}
      <style>{`
        .hover-row:hover {
          background: color-mix(in srgb, var(--accent) 3%, transparent) !important;
        }
      `}</style>
    </div>
  );
}
