import { useEffect, useRef, useState } from "react";

export function useAnimatedPrice(targetPrice, duration = 600) {
  const [displayValue, setDisplayValue] = useState(targetPrice);
  const [flash, setFlash]               = useState(null); // "up" | "down" | null
  const prevRef    = useRef(targetPrice);
  const rafRef     = useRef(null);
  const startRef   = useRef(null);
  const fromRef    = useRef(targetPrice);

  useEffect(() => {
    if (targetPrice == null) return;
    const from = prevRef.current ?? targetPrice;
    if (from === targetPrice) return;

    setFlash(targetPrice > from ? "up" : "down");
    const flashTimer = setTimeout(() => setFlash(null), 800);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    fromRef.current  = from;
    startRef.current = null;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed  = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(fromRef.current + (targetPrice - fromRef.current) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetPrice);
        prevRef.current = targetPrice;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    prevRef.current = targetPrice;

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(flashTimer);
    };
  }, [targetPrice, duration]);

  return { displayValue, flash };
}

export function formatAnimatedPrice(value) {
  if (value == null || isNaN(value)) return "—";
  if (value >= 1000) return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (value >= 1)    return "$" + value.toFixed(2);
  return "$" + value.toPrecision(4);
}

/**
 * Returns the correct CSS color string for a price value.
 * Uses CSS variables so it works in both dark and light themes.
 */
export function priceColor(flash) {
  if (flash === "up")   return "var(--positive)";
  if (flash === "down") return "var(--negative)";
  return "var(--text1)"; // ✅ theme-aware instead of hardcoded "white"
}