import { useState, useEffect, useCallback } from "react";

const BASE = "https://api.coingecko.com/api/v3";
const API_KEY = "CG-fNpFG1H3N3i2wTTMFUpJsNLp";
const HEADERS = { "x-cg-demo-api-key": API_KEY };

export function useMarketData() {
  const [coins, setCoins] = useState([]);
  const [global, setGlobal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [coinsRes, globalRes] = await Promise.all([
        fetch(`${BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`, { headers: HEADERS }),
        fetch(`${BASE}/global`, { headers: HEADERS }),
      ]);
      if (!coinsRes.ok || !globalRes.ok) throw new Error("API error");
      const [coinsData, globalData] = await Promise.all([coinsRes.json(), globalRes.json()]);
      setCoins(coinsData);
      setGlobal(globalData.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  return { coins, global, loading, error, refetch: fetchData, lastUpdated };
}

export function usePriceHistory(coinId, days = 7) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coinId) return;
    setLoading(true);
    fetch(`${BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`, { headers: HEADERS })
      .then((r) => r.json())
      .then((d) => { if (d.prices) setHistory(d.prices); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coinId, days]);

  return { history, loading };
}