import React from "react";
import Navbar from "./components/Navbar/Navbar";
import MarketOverview from "./components/MarketOverview/MarketOverview";
import PriceChart from "./components/PriceChart/PriceChart";
import TrendingTokens from "./components/TrendingTokens/TrendingTokens";
import GainersLosers from "./components/GainersLosers/GainersLosers";
import Footer from "./components/UI/Footer";
import ErrorBanner from "./components/UI/ErrorBanner";
import { useMarketData } from "./hooks/useMarketData";
import "./styles/index.css";

export default function App() {
  const { coins, global, loading, error, refetch, lastUpdated } = useMarketData();

  return (
    <div className="min-h-screen bg-bg text-white">
      <Navbar coins={coins} />

      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-purple/5 blur-[120px]" />
      </div>

      {/* Main content */}
      <main className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {error && <ErrorBanner message={error} onRetry={refetch} />}

        <MarketOverview coins={coins} global={global} loading={loading} />

        {/* Chart + Gainers/Losers side by side on large screens */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <PriceChart coins={coins} />
          </div>
          <div className="xl:col-span-1">
            <GainersLosers coins={coins} loading={loading} />
          </div>
        </div>

        <TrendingTokens coins={coins} loading={loading} />
      </main>

      <Footer lastUpdated={lastUpdated} error={error} onRefetch={refetch} />
    </div>
  );
}
