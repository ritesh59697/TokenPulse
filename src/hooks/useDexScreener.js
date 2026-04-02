import { useState, useEffect, useCallback } from "react";

const DEX_BASE = "https://api.dexscreener.com/latest/dex";

// Normalize a DexScreener pair into our token shape
function normalizePair(pair) {
  return {
    id: pair.baseToken?.address || pair.pairAddress,
    dexId: pair.dexId,
    chainId: pair.chainId,
    pairAddress: pair.pairAddress,
    name: pair.baseToken?.name || "Unknown",
    symbol: pair.baseToken?.symbol || "???",
    image: null, // DexScreener doesn't provide images
    current_price: parseFloat(pair.priceUsd) || 0,
    price_change_percentage_24h: parseFloat(pair.priceChange?.h24) || 0,
    total_volume: parseFloat(pair.volume?.h24) || 0,
    market_cap: parseFloat(pair.marketCap) || parseFloat(pair.fdv) || 0,
    market_cap_rank: null,
    liquidity: parseFloat(pair.liquidity?.usd) || 0,
    circulating_supply: null,
    ath: null,
    ath_change_percentage: null,
    pairUrl: pair.url,
    isDex: true,
    quoteSymbol: pair.quoteToken?.symbol,
    txns24h: (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0),
    buys24h: pair.txns?.h24?.buys || 0,
    sells24h: pair.txns?.h24?.sells || 0,
  };
}

export function useDexScreener() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchTrending = useCallback(async () => {
    try {
      setError(null);
      // Fetch trending on popular chains
      const chains = ["ethereum", "solana", "bsc"];
      const results = await Promise.allSettled(
        chains.map(chain =>
          fetch(`${DEX_BASE}/tokens/trending/${chain}`)
            .then(r => r.ok ? r.json() : Promise.reject())
        )
      );

      let pairs = [];
      results.forEach(r => {
        if (r.status === "fulfilled" && r.value?.pairs) {
          pairs = [...pairs, ...r.value.pairs];
        }
      });

      // If chain-specific trending fails, try general search
      if (pairs.length === 0) {
        const res = await fetch(`${DEX_BASE}/search?q=USDT`);
        const data = await res.json();
        if (data?.pairs) pairs = data.pairs;
      }

      // Sort by 24h volume, deduplicate by symbol
      const seen = new Set();
      const unique = pairs
        .filter(p => p.priceUsd && parseFloat(p.priceUsd) > 0)
        .sort((a, b) => parseFloat(b.volume?.h24 || 0) - parseFloat(a.volume?.h24 || 0))
        .filter(p => {
          const key = p.baseToken?.symbol?.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 30)
        .map(normalizePair);

      setTrending(unique);
      setLastUpdated(new Date());
    } catch (err) {
      setError("DexScreener unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending();
    const id = setInterval(fetchTrending, 60000);
    return () => clearInterval(id);
  }, [fetchTrending]);

  return { trending, loading, error, lastUpdated, refetch: fetchTrending };
}

export async function fetchDexPairsBySymbol(symbol) {
  try {
    const res = await fetch(`${DEX_BASE}/search?q=${symbol}`);
    const data = await res.json();
    if (data?.pairs?.length) {
      return data.pairs
        .filter(p => p.baseToken?.symbol?.toUpperCase() === symbol.toUpperCase())
        .slice(0, 5)
        .map(normalizePair);
    }
  } catch {}
  return [];
}
