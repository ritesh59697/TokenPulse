import React, { useState, useCallback } from "react";
import Navbar from "./components/Navbar/Navbar";
import MarketOverview from "./components/MarketOverview/MarketOverview";
import PriceChart from "./components/PriceChart/PriceChart";
import TrendingTokens from "./components/TrendingTokens/TrendingTokens";
import GainersLosers from "./components/GainersLosers/GainersLosers";
import Footer from "./components/UI/Footer";
import ErrorBanner from "./components/UI/ErrorBanner";
import SplashScreen from "./components/UI/SplashScreen";
import TokenModal from "./components/UI/TokenModal";
import LiveTicker from "./components/UI/LiveTicker";
import CommoditiesPanel from "./components/CommoditiesPanel/CommoditiesPanel";
import { useMarketData } from "./hooks/useMarketData";
import { useBinanceWS } from "./hooks/useBinanceWS";
import { useDexScreener } from "./hooks/useDexScreener";
import { useCommodityData } from "./hooks/useCommodityData";
import { useTheme } from "./hooks/useTheme";
import "./styles/index.css";

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { coins, global, loading, error, refetch, lastUpdated, dataSource } = useMarketData();
  const { trending: dexTokens, loading: dexLoading } = useDexScreener();
  const { commodities, loading: commLoading, error: commError, lastUpdated: commUpdated, refetch: commRefetch } = useCommodityData();

  // ✅ RESTORED: splash starts false so it always shows
  const [splashDone, setSplashDone] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);

  const topCoinIds = coins.slice(0, 20).map(c => c.id);
  const { prices: wsPrices, connected: wsConnected } = useBinanceWS(topCoinIds);

  const mergedCoins = coins.map(coin => {
    const ws = wsPrices[coin.id];
    if (!ws) return coin;
    return {
      ...coin,
      current_price: ws.price || coin.current_price,
      price_change_percentage_24h: ws.change24h ?? coin.price_change_percentage_24h,
    };
  });

  const handleSelectCoin = useCallback((coin) => {
    setSelectedCoin(coin);
    document.body.style.overflow = "hidden";
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCoin(null);
    document.body.style.overflow = "";
  }, []);

  const isDark = theme === "dark";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text1)", transition: "background 0.3s, color 0.3s" }}>

      {/* ✅ SPLASH SCREEN — always shows on load */}
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      <div style={{
        opacity: splashDone ? 1 : 0,
        transform: splashDone ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}>
        <Navbar coins={mergedCoins} onSelectCoin={handleSelectCoin} theme={theme} onToggleTheme={toggleTheme} />

        {mergedCoins.length > 0 && (
          <LiveTicker coins={mergedCoins} wsPrices={wsPrices} connected={wsConnected} commodities={commodities} />
        )}

        {/* Ambient glow — dark only */}
        {isDark && (
          <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
            <div style={{ position: "absolute", top: "-10%", left: "20%", width: 500, height: 500, borderRadius: "50%", background: "rgba(59,130,246,0.05)", filter: "blur(120px)" }} />
            <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "rgba(139,92,246,0.05)", filter: "blur(120px)" }} />
          </div>
        )}

        <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8" style={{ position: "relative", zIndex: 10, maxWidth: 1440, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32, width: "100%" }}>
          {error && <ErrorBanner message={error} onRetry={refetch} />}

          <MarketOverview coins={mergedCoins} global={global} loading={loading} />

          <div style={{ background: "var(--card)", borderRadius: 18, border: "1px solid var(--card-border)", padding: 20, transition: "background 0.3s, border-color 0.3s" }}>
            <CommoditiesPanel commodities={commodities} loading={commLoading} error={commError} lastUpdated={commUpdated} refetch={commRefetch} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6 items-start">
            <PriceChart coins={mergedCoins} onSelectCoin={handleSelectCoin} />
            <GainersLosers coins={mergedCoins} loading={loading} onSelectCoin={handleSelectCoin} />
          </div>

          <TrendingTokens coins={mergedCoins} dexTokens={dexTokens} dexLoading={dexLoading} loading={loading} onSelectCoin={handleSelectCoin} />
        </main>

        <Footer lastUpdated={lastUpdated} error={error} onRefetch={refetch} dataSource={dataSource} wsConnected={wsConnected} />
      </div>

      {selectedCoin && <TokenModal coin={selectedCoin} onClose={handleCloseModal} wsPrices={wsPrices} />}
    </div>
  );
}
