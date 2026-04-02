import { useEffect, useRef, useCallback, useState } from "react";

// Maps CoinGecko IDs to Binance symbols
const CG_TO_BINANCE = {
  bitcoin: "BTCUSDT", ethereum: "ETHUSDT", binancecoin: "BNBUSDT",
  solana: "SOLUSDT", ripple: "XRPUSDT", cardano: "ADAUSDT",
  avalanche: "AVAXUSDT", polkadot: "DOTUSDT", chainlink: "LINKUSDT",
  litecoin: "LTCUSDT", "uniswap": "UNIUSDT", "bitcoin-cash": "BCHUSDT",
  stellar: "XLMUSDT", cosmos: "ATOMUSDT", algorand: "ALGOUSDT",
  vechain: "VETUSDT", filecoin: "FILUSDT", tron: "TRXUSDT",
  monero: "XMRUSDT", "shiba-inu": "SHIBUSDT", dogecoin: "DOGEUSDT",
  "matic-network": "MATICUSDT", "near": "NEARUSDT", aptos: "APTUSDT",
  arbitrum: "ARBUSDT", optimism: "OPUSDT", sui: "SUIUSDT",
  sei: "SEIUSDT", "injective-protocol": "INJUSDT", pepe: "PEPEUSDT",
  "the-sandbox": "SANDUSDT", "decentraland": "MANAOWUSDT",
  aave: "AAVEUSDT", "curve-dao-token": "CRVUSDT",
  "pancakeswap-token": "CAKEUSDT", "render-token": "RENDERUSDT",
  "fetch-ai": "FETUSDT", "worldcoin-wld": "WLDUSDT",
};

export function cgToBinance(cgId) {
  return CG_TO_BINANCE[cgId] || null;
}

// Single websocket that subscribes to multiple streams
export function useBinanceWS(coinIds = []) {
  const [prices, setPrices] = useState({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const symbols = coinIds
      .map(id => CG_TO_BINANCE[id])
      .filter(Boolean)
      .map(s => s.toLowerCase() + "@miniTicker");

    if (symbols.length === 0) return;

    const url = `wss://stream.binance.com:9443/stream?streams=${symbols.join("/")}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) setConnected(true);
      };

      ws.onmessage = (evt) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(evt.data);
          const data = msg.data;
          if (data?.s && data?.c) {
            // Find CG id from binance symbol
            const cgId = Object.keys(CG_TO_BINANCE).find(
              k => CG_TO_BINANCE[k] === data.s
            );
            if (cgId) {
              setPrices(prev => ({
                ...prev,
              [cgId]: {
  price: parseFloat(data.c) || 0,
  change24h: isNaN(parseFloat(data.P)) ? null : parseFloat(data.P),
  high24h: parseFloat(data.h) || 0,
  low24h: parseFloat(data.l) || 0,
  volume24h: parseFloat(data.v) || 0,
  ts: Date.now(),
}
              }));
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        // Reconnect after 5s
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {}
  }, [coinIds.join(",")]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { prices, connected };
}
