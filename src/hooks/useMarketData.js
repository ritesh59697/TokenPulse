import { useState, useEffect, useCallback } from "react";

const CG_KEY = "CG-fNpFG1H3N3i2wTTMFUpJsNLp";
const CG = "https://api.coingecko.com/api/v3";
const CG_HEADERS = { "x-cg-demo-api-key": CG_KEY };
const COINCAP = "https://api.coincap.io/v2";

// In-memory cache so refresh doesn't blank out prices
let lastGoodCoins = [];
let lastGoodGlobal = null;

async function safeFetch(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function fetchFromCoinGecko() {
  const [coins, global] = await Promise.all([
    safeFetch(
      `${CG}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`,
      { headers: CG_HEADERS }
    ),
    safeFetch(`${CG}/global`, { headers: CG_HEADERS }),
  ]);
  return { coins, global: global.data, source: "CoinGecko" };
}

async function fetchFromCoinCap() {
  const [assetsRes, btcRes] = await Promise.all([
    safeFetch(`${COINCAP}/assets?limit=50`),
    safeFetch(`${COINCAP}/assets/bitcoin`),
  ]);
  const coins = assetsRes.data.map(a => ({
    id: a.id,
    symbol: a.symbol?.toLowerCase(),
    name: a.name,
    image: `https://assets.coincap.io/assets/icons/${a.symbol?.toLowerCase()}@2x.png`,
    current_price: parseFloat(a.priceUsd) || 0,
    market_cap: parseFloat(a.marketCapUsd) || 0,
    market_cap_rank: parseInt(a.rank) || 0,
    total_volume: parseFloat(a.volumeUsd24Hr) || 0,
    price_change_percentage_24h: parseFloat(a.changePercent24Hr) || 0,
    circulating_supply: parseFloat(a.supply) || 0,
    ath: null,
    ath_change_percentage: null,
  }));
  const totalMarketCap = coins.reduce((s, c) => s + c.market_cap, 0);
  const totalVolume    = coins.reduce((s, c) => s + c.total_volume, 0);
  return {
    coins,
    global: {
      total_market_cap: { usd: totalMarketCap },
      total_volume:     { usd: totalVolume },
      market_cap_change_percentage_24h_usd: parseFloat(btcRes.data?.changePercent24Hr) || 0,
    },
    source: "CoinCap",
  };
}

export async function fetchChartData(coinId, days = 7) {
  // Try CoinGecko
  try {
    const data = await safeFetch(
      `${CG}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      { headers: CG_HEADERS }
    );
    if (data.prices?.length) return { prices: data.prices, source: "CoinGecko" };
  } catch {}

  // Fallback: CoinCap
  try {
    const intervalMap = { 1: "m5", 7: "h2", 30: "h8", 90: "d1", 365: "d1" };
    const interval = intervalMap[days] || "h2";
    const end   = Date.now();
    const start = end - days * 24 * 60 * 60 * 1000;
    const data  = await safeFetch(
      `${COINCAP}/assets/${coinId}/history?interval=${interval}&start=${start}&end=${end}`
    );
    if (data.data?.length) {
      return { prices: data.data.map(p => [p.time, parseFloat(p.priceUsd)]), source: "CoinCap" };
    }
  } catch {}

  throw new Error("All chart sources failed");
}

export function useMarketData() {
  // ✅ Start with last known good data so prices never blank out on refresh
  const [coins, setCoins]           = useState(lastGoodCoins);
  const [global, setGlobal]         = useState(lastGoodGlobal);
  const [loading, setLoading]       = useState(lastGoodCoins.length === 0);
  const [error, setError]           = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      // Don't set loading=true if we already have data — avoids price blanking
      if (lastGoodCoins.length === 0) setLoading(true);

      let result;
      try {
        result = await fetchFromCoinGecko();
      } catch {
        // Wait 1s then try CoinCap
        await new Promise(r => setTimeout(r, 1000));
        result = await fetchFromCoinCap();
      }

      // Cache for next refresh
      lastGoodCoins  = result.coins;
      lastGoodGlobal = result.global;

      setCoins(result.coins);
      setGlobal(result.global);
      setDataSource(result.source);
      setLastUpdated(new Date());
    } catch {
      setError("Market data unavailable — showing last known prices");
      // ✅ Don't clear existing data on error — keep showing last prices
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 90000);
    return () => clearInterval(id);
  }, [fetchData]);

  return { coins, global, loading, error, refetch: fetchData, lastUpdated, dataSource };
}

export function usePriceHistory(coinId, days = 7) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!coinId) return;
    setLoading(true);
    fetchChartData(coinId, days)
      .then(({ prices }) => setHistory(prices))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coinId, days]);
  return { history, loading };
}