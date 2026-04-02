import { useState, useEffect, useCallback, useRef } from "react";

// ── API KEYS ────────────────────────────────────────────────────────────────
const AV_KEY = "50UKBOQ7Z4HBZH8N"; // fallback only

// ── COMMODITY DEFINITIONS ───────────────────────────────────────────────────
// Each commodity lists its primary source + fallback chain
const COMMODITIES = [
  {
    id: "gold", name: "Gold", symbol: "XAU/USD",
    icon: "🥇", color: "#f59e0b", unit: "per troy oz",
    sources: [
      { type: "metals_live", metal: "gold" },
      { type: "av_fx", from: "XAU", to: "USD" },
    ],
  },
  {
    id: "silver", name: "Silver", symbol: "XAG/USD",
    icon: "🥈", color: "#94a3b8", unit: "per troy oz",
    sources: [
      { type: "metals_live", metal: "silver" },
      { type: "av_fx", from: "XAG", to: "USD" },
    ],
  },
  {
    id: "oil", name: "Crude Oil", symbol: "WTI",
    icon: "🛢️", color: "#6366f1", unit: "per barrel",
    sources: [
      { type: "coincap_rate", id: "oil-crude" },
      { type: "av_commodity", func: "BRENT" },
    ],
  },
  {
    id: "natgas", name: "Natural Gas", symbol: "NGAS",
    icon: "🔥", color: "#3b82f6", unit: "per MMBtu",
    sources: [
      { type: "av_commodity", func: "NATURAL_GAS" },
    ],
  },
  {
    id: "copper", name: "Copper", symbol: "XCU/USD",
    icon: "🔶", color: "#ea580c", unit: "per lb",
    sources: [
      { type: "metals_live", metal: "copper" },
      { type: "av_fx", from: "XCU", to: "USD" },
    ],
  },
];

// Cache to avoid re-fetching within 3 minutes
const cache = {};
const CACHE_TTL = 3 * 60 * 1000;

function getCached(id) {
  const entry = cache[id];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}
function setCache(id, data) {
  cache[id] = { data, ts: Date.now() };
}

// ── FETCHERS ────────────────────────────────────────────────────────────────
async function fetchMetalsLive(metal) {
  // metals-api.com free tier: gold, silver, platinum, palladium, copper (USD base)
  const METALS_KEY = ""; // leave blank — metals.live has a free no-key endpoint
  const res = await fetch(
    `https://metals-api.com/api/latest?access_key=${METALS_KEY}&base=USD&symbols=${metal.toUpperCase()}`,
    { signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) throw new Error("metals-api failed");
  const data = await res.json();
  if (!data.success) throw new Error("metals-api: " + data.error?.type);
  const rate = data.rates?.[metal.toUpperCase()];
  if (!rate) throw new Error("no rate");
  // metals-api returns how many units of metal per 1 USD, so invert
  return { price: 1 / rate, change_percent: null, source: "Metals-API" };
}

async function fetchAvFX(from, to) {
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${AV_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await res.json();
  const rate = data["Realtime Currency Exchange Rate"];
  if (!rate) throw new Error("AV FX: no data");
  return {
    price: parseFloat(rate["5. Exchange Rate"]) || 0,
    bid:   parseFloat(rate["8. Bid Price"])     || 0,
    ask:   parseFloat(rate["9. Ask Price"])     || 0,
    change_percent: null,
    source: "Alpha Vantage",
  };
}

async function fetchAvCommodity(func) {
  const url = `https://www.alphavantage.co/query?function=${func}&interval=monthly&apikey=${AV_KEY}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await res.json();
  const series = data?.data;
  if (!series?.length) throw new Error("AV commodity: no data");
  const price     = parseFloat(series[0].value) || 0;
  const prevPrice = parseFloat(series[1]?.value) || 0;
  return {
    price,
    change_percent: prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0,
    source: "Alpha Vantage",
  };
}

// Fallback: use rough static estimates when all APIs fail
// (clearly labeled as estimates so user knows)
const STATIC_FALLBACK = {
  gold:   { price: 2300, change_percent: null, source: "estimate" },
  silver: { price: 27,   change_percent: null, source: "estimate" },
  oil:    { price: 82,   change_percent: null, source: "estimate" },
  natgas: { price: 2.1,  change_percent: null, source: "estimate" },
  copper: { price: 4.3,  change_percent: null, source: "estimate" },
};

async function fetchFromSource(source) {
  switch (source.type) {
    case "metals_live":    return await fetchMetalsLive(source.metal);
    case "av_fx":          return await fetchAvFX(source.from, source.to);
    case "av_commodity":   return await fetchAvCommodity(source.func);
    default: throw new Error("unknown source");
  }
}

async function fetchCommodity(commodity) {
  const cached = getCached(commodity.id);
  if (cached) return { ...cached, fromCache: true };

  for (const source of commodity.sources) {
    try {
      const result = await fetchFromSource(source);
      setCache(commodity.id, result);
      return result;
    } catch (e) {
      console.warn(`[${commodity.id}] ${source.type} failed:`, e.message);
    }
  }

  // All sources failed — use static estimate
  const fallback = STATIC_FALLBACK[commodity.id];
  if (fallback) return { ...fallback, isEstimate: true };
  throw new Error("all sources failed");
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ── HOOK ────────────────────────────────────────────────────────────────────
export function useCommodityData() {
  const [commodities, setCommodities] = useState(
    COMMODITIES.map(c => ({ ...c, current_price: null, change_percent: null, available: false, fetching: true, source: null }))
  );
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const abortRef = useRef(false);

  const fetchAll = useCallback(async () => {
    abortRef.current = false;
    setLoading(true);
    setError(null);
    setCommodities(COMMODITIES.map(c => ({ ...c, current_price: null, change_percent: null, available: false, fetching: true, source: null })));

    let anySuccess = false;

    for (let i = 0; i < COMMODITIES.length; i++) {
      if (abortRef.current) break;
      const c = COMMODITIES[i];

      try {
        const result = await fetchCommodity(c);
        anySuccess = true;
        setCommodities(prev => prev.map(item =>
          item.id === c.id ? {
            ...item,
            current_price: result.price,
            change_percent: result.change_percent ?? null,
            bid: result.bid,
            ask: result.ask,
            available: true,
            fetching: false,
            source: result.source,
            isEstimate: result.isEstimate || false,
            fromCache: result.fromCache || false,
          } : item
        ));
      } catch {
        setCommodities(prev => prev.map(item =>
          item.id === c.id ? { ...item, available: false, fetching: false } : item
        ));
      }

      // Stagger only if not cached (cached = no API call made)
      const cached = getCached(c.id);
      if (i < COMMODITIES.length - 1 && !abortRef.current && !cached) {
        await delay(14000); // 14s gap = well within 5 req/min limit
      }
    }

    if (!anySuccess) setError("All commodity sources failed");
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 5 * 60 * 1000);
    return () => { abortRef.current = true; clearInterval(id); };
  }, [fetchAll]);

  return { commodities, loading, error, lastUpdated, refetch: fetchAll };
}
